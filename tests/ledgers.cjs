const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context=vm.createContext({});
for(const file of ['src/shared/name-engine.js','src/features/person/id-engine.js','assets/signatures/demo-signatures.js','src/features/person/ledger-engine.js','src/features/person/ledger-renderer.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
let seed=1127;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const {LedgerEngine:ledgers,IDEngine:ids,LedgerRenderer:renderer}=context,engine=ledgers.createEngine(random);
const frequencies=Object.fromEntries(Array.from({length:16},(_,i)=>[i+1,0]));
for(let i=0;i<100000;i++)frequencies[engine.chooseCount()]++;
for(const [count,probability] of Object.entries(ledgers.countProbabilities))assert(Math.abs(frequencies[count]/100000-probability)<.006,`Bad count frequency ${count}`);
let people=0,females=0;const today=new Date('2026-10-06T00:00:00Z');
for(let i=0;i<1200;i++){
  const data=engine.generate({count:i%16+1,today});assert.equal(data.entries.length,data.count);
  assert.equal(new Set(data.entries.map(entry=>entry.idNumber)).size,data.count);
  assert.equal(new Set(data.entries.map(entry=>entry.name)).size,data.count);
  assert(data.issueDate<data.startDate&&data.startDate<=today&&data.endDate>today);
  assert(data.approvalDate<data.issueDate);assert.match(data.permitNumber,/^R\/\d{5}$/);
  for(const entry of data.entries){
    assert.equal(entry.name,[entry.person.firstName,entry.person.fatherName,entry.person.familyName].join(' '));
    assert.match(entry.idNumber,/^(101|102|111)\d{7}$/);assert.equal(entry.idNumber[9],String(ids.checkDigit(entry.idNumber.slice(0,9))));
    assert.equal(entry.nationality,entry.person.gender==='female'?'سعودية':'سعودي');
    assert(!entry.name.includes('آل سعود'));people++;females+=entry.person.gender==='female';
  }
  assert.equal(new Set([...data.entries.map(entry=>entry.name),data.issuer.name,data.manager.name,data.requester.name]).size,data.count+3);
  const signatures=[data.issuerSignature,data.managerSignature,data.stampSignature];
  assert.equal(new Set(signatures).size,3);for(const index of signatures)assert(context.LedgerSignatures[index]);
}
assert(females/people>.04&&females/people<.06);
for(const count of [0,17,1.5,NaN])assert.throws(()=>engine.generate({count}),{name:'RangeError'});
const data=engine.generate({count:16,today});
const svg=renderer.render({...data,contractor:'شركة <تجريبية> & أخرى'},{logo:'data:image/png;base64,test'});
assert(svg.includes('width="297mm" height="210mm"'));assert(svg.includes('شركة &lt;تجريبية&gt; &amp; أخرى'));
for(const entry of data.entries)assert.equal(svg.split(entry.idNumber).length-1,1);
const one=renderer.render(engine.generate({count:1,today}),{logo:''});assert.equal((one.match(/رقم الإقامة \/ الجواز/g)||[]).length,2);
console.log(JSON.stringify({result:'passed',ledgers:1200,people,femalePercentage:(females/people*100).toFixed(2),countSamples:100000,countPercentages:Object.fromEntries(Object.entries(frequencies).map(([count,total])=>[count,(total/1000).toFixed(2)])),uniqueEntriesAndSigners:'passed',dates:'passed',signatures:'passed'},null,2));
