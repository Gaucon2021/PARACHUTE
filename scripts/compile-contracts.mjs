import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const require=createRequire(resolve(process.env.SOLC_ROOT,'package.json')),solc=require('solc'),lib=resolve(process.env.REACTIVE_LIB);
if(!solc.version().startsWith('0.8.29+'))throw Error('Unexpected compiler version');
const names=['RiskEmitter','ParachuteReactive','OmniSafetyController','SafetyController'];
const sources=Object.fromEntries(names.map(n=>['contracts/'+n+'.sol',{content:readFileSync('contracts/'+n+'.sol','utf8')}]));
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input),{import:p=>{try{if(!p.startsWith('@reactive/'))return {error:'Unsupported import: '+p};const target=resolve(lib,p.slice('@reactive/'.length));if(!target.startsWith(lib+'/'))return {error:'Invalid import'};return {contents:readFileSync(target,'utf8')}}catch(e){return {error:e.message}}}}));
for(const e of out.errors||[])console.log(e.formattedMessage);
if((out.errors||[]).some(e=>e.severity==='error'))throw Error('Solidity compile failed');
for(const n of names){const item=out.contracts?.['contracts/'+n+'.sol']?.[n],bytecode=item?.evm?.bytecode?.object;if(!bytecode||!item.abi.length)throw Error('Missing artifact '+n);console.log('COMPILED '+n+' bytecode bytes '+bytecode.length/2+' SHA256 '+createHash('sha256').update(Buffer.from(bytecode,'hex')).digest('hex'))}
