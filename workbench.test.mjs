import {test} from "node:test";import assert from "node:assert/strict";import{assess,fixture}from "./workbench.mjs";
test("finality and duplicates",()=>assert.deepEqual(assess(fixture.config,fixture.events).trace.map(x=>x.result),["BELOW_THRESHOLD","WAIT_FINALITY","WOULD_PAUSE","REPLAY_REJECTED","REJECT_ORIGIN"]));
test("unfinalized event cannot pause",()=>assert.equal(assess(fixture.config,[fixture.events[1]]).status,"SIMULATED_ACTIVE"));
test("wrong source cannot pause",()=>assert.equal(assess(fixture.config,[fixture.events[4]]).status,"SIMULATED_ACTIVE"));
test("invalid threshold",()=>assert.equal(assess({...fixture.config,threshold:-1},[]).status,"UNKNOWN"));
test("no real chain claim",()=>assert.equal(assess(fixture.config,fixture.events).verifiedOnChain,false));
