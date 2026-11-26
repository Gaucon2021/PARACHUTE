export function assess(config,events){
 if(!config||!Number.isSafeInteger(config.chain)||typeof config.emitter!=="string"||!Number.isFinite(config.threshold)||config.threshold<0||!Array.isArray(events)||events.length>500)return {status:"UNKNOWN",trace:[]};
 const seen=new Set(),trace=[];let paused=false;
 for(const e of events){let result;
  if(!e||e.chain!==config.chain||e.emitter!==config.emitter)result="REJECT_ORIGIN";
  else if(typeof e.id!=="string"||!e.id||!Number.isFinite(e.risk)||e.risk<0)result="INVALID";
  else if(e.finalized!==true)result="WAIT_FINALITY";
  else if(seen.has(e.id))result="REPLAY_REJECTED";
  else{seen.add(e.id);if(e.risk>=config.threshold){paused=true;result="WOULD_PAUSE"}else result="BELOW_THRESHOLD";}
  trace.push({id:e?.id??"?",risk:e?.risk??null,result});
 }
 return {status:paused?"SIMULATED_PAUSE":"SIMULATED_ACTIVE",trace,verifiedOnChain:false};
}
export const fixture={config:{chain:11155111,emitter:"fixture:monitor",threshold:80},events:[{id:"a",chain:11155111,emitter:"fixture:monitor",risk:50,finalized:true},{id:"b",chain:11155111,emitter:"fixture:monitor",risk:95,finalized:false},{id:"b",chain:11155111,emitter:"fixture:monitor",risk:95,finalized:true},{id:"b",chain:11155111,emitter:"fixture:monitor",risk:95,finalized:true},{id:"c",chain:11155111,emitter:"fixture:impostor",risk:100,finalized:true}]};
