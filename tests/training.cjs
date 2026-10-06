const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context=vm.createContext({});
for(const file of ['src/shared/name-engine.js','src/features/person/id-engine.js','src/features/person/ledger-engine.js','src/features/person/training-engine.js','src/shared/training-store.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const {TrainingEngine:training,TrainingStore:storage,NameEngine:names,IDEngine:ids}=context;
let seed=2217;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const engine=training.createEngine(random),backing=new Map(),memory={getItem:key=>backing.get(key)||null,setItem:(key,value)=>backing.set(key,value)};
let store=storage.create(memory),cards=0,valid=0,wrong=0,totalCorrect=0,types=new Set(),completed=0;
const today=new Date('2026-10-06T00:00:00Z');
for(let run=0;run<400;run++){
  store.data.a=engine.create({count:run%16+1,today});store.data.a.reviewed=true;store.save();let seen=0,previousWrong=false;
  while(store.data.a){
    assert(seen++<140,'Session failed to finish');const active=store.data.a,current=active.current;
    const expected=engine.eligible(active,current.card);assert.equal(expected,current.kind==='valid');
    assert(!(previousWrong&&!expected),'Consecutive wrong IDs');previousWrong=!expected;
    if(current.kind==='number'){assert.equal(current.card.person.ledgerName,active.ledger.entries[current.index].name);assert.notEqual(current.card.idNumber,active.ledger.entries[current.index].idNumber);}
    if(current.kind==='name'){assert.equal(current.card.idNumber,active.ledger.entries[current.index].idNumber);assert(!engine.matches(current.card.person,active.ledger.entries[current.index]));}
    if(current.kind==='expired'){assert(engine.matches(current.card.person,active.ledger.entries[current.index]));assert(new Date(current.card.expiryDate)<today);}
    const before=active.admitted.length,makeMistake=seen%7===0;const result=store.decide(engine,makeMistake?!expected:expected,Date.now());
    assert.equal(result.correct,!makeMistake);if(makeMistake){wrong++;if(store.data.a)assert.equal(store.data.a.admitted.length,before);}
    else totalCorrect++;
    cards++;valid+=expected;types.add(current.kind);completed+=result.done;
    // Reload on every decision: same card, ledger, progress, and last result.
    const saved=JSON.stringify(store.data);store=storage.create(memory);assert.equal(JSON.stringify(store.data),saved);
    assert(store.available);assert.equal(store.corrupt,false);
  }
  assert.equal(store.data.p.people,run%16+1);
}
assert.equal(completed,400);assert.equal(store.data.l.s,400);assert.equal(store.data.l.c[0],cards);assert.equal(store.data.l.c[1],totalCorrect);assert.equal(store.data.l.c[2]+store.data.l.c[3],wrong);assert.equal(store.data.l.p,3400);
assert.equal(types.size,5);assert(valid/cards>.65&&valid/cards<.8);
assert.equal(backing.size,1);assert(backing.get(storage.KEY).length<1500,'Completed record should stay compact');assert.equal(store.data.w,null);
// Adjacent names and connectors do not alter the matching rule; expiry today is valid.
const active=engine.create({count:1,today}),entry=active.ledger.entries[0];
const card=ids.createEngine(random).generate({person:entry.person,idNumber:entry.idNumber,today,expiryMode:'valid'});
assert(engine.eligible(active,{...card,expiryDate:today}));
const hiddenChange={...card.person,grandfatherName:names.pools.male.find(name=>name!==card.person.grandfatherName)};
assert(engine.eligible(active,{...card,person:hiddenChange}));
for(const key of ['firstName','fatherName','familyName']){const changed={...card.person,[key]:'مختلف'};assert(!engine.eligible(active,{...card,person:changed}));}
assert(!engine.eligible(active,{...card,idNumber:'1110000000'}));
assert(!engine.eligible(active,{...card,expiryDate:new Date(today.getTime()-86400000)}));
assert.throws(()=>storage.parse('{bad json'));
assert.throws(()=>storage.parse(JSON.stringify({...store.data,l:{s:0,p:0,c:[2,1,0,0,0,0]}})));
const full=engine.create({count:16,today});store.data.a=full;store.save();const activeBytes=backing.get(storage.KEY).length;assert(activeBytes<25000);
const denied=storage.create({getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}});assert.equal(denied.available,false);assert.equal(denied.save(),false);
console.log(JSON.stringify({result:'passed',completedSessions:completed,decisions:cards,correct:totalCorrect,mistakes:wrong,eligiblePercentage:(valid/cards*100).toFixed(1),scenarioTypes:[...types],lifetimeAdmissions:store.data.l.p,compactSaveBytes:activeBytes,reloadAfterEveryDecision:'passed',singleStorageKey:'passed',expiryTodayAndShortNames:'passed',storageUnavailable:'passed'},null,2));
