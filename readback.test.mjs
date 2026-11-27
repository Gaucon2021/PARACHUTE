import {test} from "node:test";
import assert from "node:assert/strict";
import {verify,sig,hashId} from "./readback.mjs";
const input={sourceEmitter:"0x"+"11".repeat(20),targetController:"0x"+"22".repeat(20),sourceTx:"0x"+"33".repeat(32),targetTx:"0x"+"44".repeat(32)};
const id=hashId(11155111,input.sourceEmitter,input.sourceTx,0),block="0x"+"55".repeat(32),w=x=>"0x"+BigInt(x).toString(16).padStart(64,"0");
function mock(alter={}){return async(side,method,params)=>{
 if(method==="eth_chainId")return side==="source"?(alter.wrongChain?"0x1":"0xaa36a7"):"0x14a34";
 if(method==="eth_getBlockByNumber")return {number:params[0]==="finalized"?(alter.unfinalized?"0x9":"0x20"):params[0],hash:alter.noncanonical&&params[0]!=="finalized"?"0x"+"77".repeat(32):block};
 if(method==="eth_getTransactionReceipt"){const src=side==="source";return {transactionHash:src?input.sourceTx:input.targetTx,blockNumber:"0x10",blockHash:block,status:"0x1",logs:src?[{address:input.sourceEmitter,topics:[sig("RiskObserved(uint256,uint256)"),w(1)],data:w(95),logIndex:"0x0"}]:[{address:input.targetController,topics:[sig("SafetyTriggered(bytes32,uint256)"),alter.forged?"0x"+"66".repeat(32):id],data:w(95)}]};}
 if(method==="eth_getCode")return "0x6000";
 if(method==="eth_call"){const s=params[0].data.slice(0,10);if(s===sig("paused()").slice(0,10))return w(alter.unpaused?0:1);if(s===sig("consumed(bytes32)").slice(0,10))return w(1);if(s===sig("emitter()").slice(0,10))return w(input.sourceEmitter);if(s===sig("threshold()").slice(0,10))return w(80);}
 throw Error("unexpected RPC");
};}
test("Keccak empty known vector",()=>assert.equal(sig(""),"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"));
test("Keccak abc known vector",()=>assert.equal(sig("abc"),"0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"));
test("paused selector",()=>assert.equal(sig("paused()").slice(0,10),"0x5c975abb"));
test("matching fixture readback",async()=>assert.equal((await verify(input,mock())).status,"MATCHED_RPC_EVIDENCE"));
for(const [name,options] of [["wrong chain",{wrongChain:true}],["unfinalized",{unfinalized:true}],["noncanonical",{noncanonical:true}],["forged target",{forged:true}],["unpaused",{unpaused:true}]])test(name,async()=>assert.rejects(verify(input,mock(options))));

test("all target state reads use the same finalized block",async()=>{const base=mock(),blocks=[];const result=await verify(input,async(side,method,params)=>{if(method==="eth_call"||method==="eth_getCode")blocks.push(params[1]);return base(side,method,params)});assert.equal(blocks.length,5);assert.deepEqual([...new Set(blocks)],["0x20"]);assert.equal(result.stateReadBlock,"0x20");});
