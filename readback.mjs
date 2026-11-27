function keccak(bytes){
 const mask=(1n<<64n)-1n,rc=[1n,0x8082n,0x800000000000808an,0x8000000080008000n,0x808bn,0x80000001n,0x8000000080008081n,0x8000000000008009n,0x8an,0x88n,0x80008009n,0x8000000an,0x8000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,0x800an,0x800000008000000an,0x8000000080008081n,0x8000000000008080n,0x80000001n,0x8000000080008008n],rot=[0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
 const a=Array(25).fill(0n),data=Array.from(bytes);data.push(1);while(data.length%136)data.push(0);data[data.length-1]|=128;
 const rol=(v,r)=>((v<<BigInt(r))|(v>>BigInt(64-r)))&mask;
 for(let off=0;off<data.length;off+=136){for(let i=0;i<136;i++)a[i>>3]^=BigInt(data[off+i])<<BigInt(8*(i%8));
 for(const k of rc){const c=Array.from({length:5},(_,x)=>a[x]^a[x+5]^a[x+10]^a[x+15]^a[x+20]),d=c.map((_,x)=>c[(x+4)%5]^rol(c[(x+1)%5],1));
 for(let i=0;i<25;i++)a[i]^=d[i%5];
 const b=Array(25).fill(0n);for(let x=0;x<5;x++)for(let y=0;y<5;y++)b[y+5*((2*x+3*y)%5)]=rol(a[x+5*y],rot[x+5*y]);
 for(let x=0;x<5;x++)for(let y=0;y<5;y++)a[x+5*y]=b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]);a[0]^=k;}}
 return "0x"+Array.from({length:32},(_,i)=>Number((a[i>>3]>>BigInt(8*(i%8)))&255n).toString(16).padStart(2,"0")).join("");
}
function sig(s){return keccak(Array.from(s,c=>c.charCodeAt(0)));}
function word(x){return BigInt(x).toString(16).padStart(64,"0");}
function hashId(chain,emitter,tx,index){const h=word(chain)+emitter.slice(2).toLowerCase().padStart(64,"0")+tx.slice(2).toLowerCase()+word(index);return keccak(h.match(/../g).map(x=>parseInt(x,16)));}
function requireCondition(condition,message){if(!condition)throw new Error(message);}
const endpoints={"source":"https://ethereum-sepolia-rpc.publicnode.com","target":"https://sepolia.base.org"};
async function rpc(side,method,params){
 const r=await fetch(endpoints[side],{method:"POST",headers:{"Content-Type":"application/json"},credentials:"omit",redirect:"error",referrerPolicy:"no-referrer",cache:"no-store",body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error("RPC HTTP "+r.status);
 const j=await r.json();if(j.error||j.id!==1||!Object.hasOwn(j,"result"))throw Error("RPC method unavailable: "+method);return j.result;
}
export async function verify(input,request=rpc){
 const addr=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/,hex=/^0x[0-9a-fA-F]+$/,equal=(a,b)=>typeof a==="string"&&typeof b==="string"&&a.toLowerCase()===b.toLowerCase();
 requireCondition(input&&addr.test(input.sourceEmitter)&&addr.test(input.targetController)&&hash.test(input.sourceTx)&&hash.test(input.targetTx),"Enter two transaction hashes and two testnet contract addresses.");
 const sourceEmitter=input.sourceEmitter.toLowerCase(),targetController=input.targetController.toLowerCase();
 const [a,b]=await Promise.all([request("source","eth_chainId",[]),request("target","eth_chainId",[])]);
 requireCondition(hex.test(a)&&hex.test(b)&&BigInt(a)===11155111n&&BigInt(b)===84532n,"Wrong chain ID");
 async function finalizedReceipt(side,tx){
 const [receipt,head]=await Promise.all([request(side,"eth_getTransactionReceipt",[tx]),request(side,"eth_getBlockByNumber",["finalized",false])]);
 requireCondition(receipt&&equal(receipt.transactionHash,tx)&&receipt.status==="0x1"&&hex.test(receipt.blockNumber)&&hash.test(receipt.blockHash)&&Array.isArray(receipt.logs),"Missing or failed receipt: "+side);
 requireCondition(head&&hex.test(head.number)&&BigInt(head.number)>=BigInt(receipt.blockNumber),"Receipt not finalized: "+side);
 const canonical=await request(side,"eth_getBlockByNumber",[receipt.blockNumber,false]);
 requireCondition(canonical&&equal(canonical.hash,receipt.blockHash),"Noncanonical receipt: "+side);return {receipt,head};}
 const [src,dst]=await Promise.all([finalizedReceipt("source",input.sourceTx),finalizedReceipt("target",input.targetTx)]);
 const source=src.receipt.logs.filter(l=>equal(l?.address,sourceEmitter)&&equal(l.topics?.[0],sig("RiskObserved(uint256,uint256)")));
 requireCondition(source.length===1,"Exactly one source RiskObserved log required");
 const l=source[0];requireCondition(l.topics.length===2&&hash.test(l.topics[1])&&hash.test(l.data)&&hex.test(l.logIndex)&&l.removed!==true,"Malformed source event");
 const risk=BigInt(l.data);requireCondition(risk<=100n,"Invalid risk value");
 const eventId=hashId(11155111,sourceEmitter,input.sourceTx,l.logIndex);
 const matches=dst.receipt.logs.filter(t=>equal(t?.address,targetController)&&equal(t.topics?.[0],sig("SafetyTriggered(bytes32,uint256)"))&&equal(t.topics?.[1],eventId)&&t.topics.length===2&&hash.test(t.data)&&BigInt(t.data)===risk&&t.removed!==true);
 requireCondition(matches.length===1,"No unique bound target event");
 const call=(selector,args="")=>request("target","eth_call",[{to:targetController,data:sig(selector).slice(0,10)+args},dst.head.number]);
 const [paused,consumed,emitter,threshold,code]=await Promise.all([call("paused()"),call("consumed(bytes32)",eventId.slice(2)),call("emitter()"),call("threshold()"),request("target","eth_getCode",[targetController,dst.head.number])]);
 requireCondition([paused,consumed,emitter,threshold].every(x=>hash.test(x))&&BigInt(paused)===1n&&BigInt(consumed)===1n&&BigInt(emitter)===BigInt(sourceEmitter)&&BigInt(threshold)>0n&&BigInt(threshold)<=risk&&typeof code==="string"&&/^0x(?:[0-9a-fA-F]{2})+$/.test(code),"Target finalized state does not match");
 return {status:"MATCHED_RPC_EVIDENCE",sourceChain:11155111,targetChain:84532,sourceTx:input.sourceTx,targetTx:input.targetTx,sourceEmitter,targetController,eventId,risk:Number(risk),sourceBlock:src.receipt.blockNumber,targetBlock:dst.receipt.blockNumber,stateReadBlock:dst.head.number,paused:true,consumed:true,limits:"Public RPC observation only; deployed bytecode identity and actual Reactive callback origin are not independently authenticated."};
}
export {keccak,sig,hashId};
