(() => {
  'use strict';
  const DAY=86400000,MODES=['stranger','number','name','expired'];
  const serialize=value=>JSON.parse(JSON.stringify(value));
  const reviveLedger=ledger=>({...ledger,...Object.fromEntries(['today','issueDate','startDate','endDate','approvalDate'].map(key=>[key,new Date(ledger[key])]))});
  const reviveCard=card=>({...card,...Object.fromEntries(['today','birthDate','expiryDate'].map(key=>[key,new Date(card[key])]))});
  function createEngine(random=Math.random){
    const ledgerEngine=LedgerEngine.createEngine(random),ids=IDEngine.createEngine(random),names=NameEngine.createEngine(random);
    const pick=list=>list[Math.floor(random()*list.length)];
    function create(options={}){
      const ledger=ledgerEngine.generate(options);
      const session={ledger:serialize(ledger),admitted:[],current:null,streak:0,started:Date.now(),finished:0,counts:[0,0,0,0,0,0],reviewed:false};
      next(session);return session;
    }
    function matches(person,entry){return ['firstName','fatherName','familyName'].every(key=>NameEngine.normalize(person[key])===NameEngine.normalize(entry.person[key]));}
    function eligible(session,card){return new Date(card.expiryDate)>=new Date(session.ledger.today)&&session.ledger.entries.some(entry=>entry.idNumber===card.idNumber&&matches(card.person,entry));}
    function next(session){
      const remaining=session.ledger.entries.map((_,index)=>index).filter(index=>!session.admitted.includes(index));
      if(!remaining.length){session.current=null;return;}
      // Usually two to five real matches between mismatches, never consecutive
      // mismatches. A one-person permit can also start with a wrong card.
      const valid=!session.counts[0]?random()<.7:session.streak<0||(session.streak<5&&(session.streak<2||random()<.26));
      const index=pick(remaining),entry=session.ledger.entries[index],today=new Date(session.ledger.today);
      let card,kind='valid';
      if(valid){card=ids.generate({person:entry.person,idNumber:entry.idNumber,expiryMode:'valid',today});session.streak=Math.max(0,session.streak)+1;}
      else{
        kind=pick(MODES);session.streak=-1;
        if(kind==='stranger'){
          do{card=ids.generate({expiryMode:'valid',today});}while(session.ledger.entries.some(item=>item.idNumber===card.idNumber||matches(card.person,item)));
        }else if(kind==='number'){
          do{card=ids.generate({person:entry.person,expiryMode:'valid',today});}while(session.ledger.entries.some(item=>item.idNumber===card.idNumber));
        }else if(kind==='name'){
          const key=pick(['firstName','fatherName','familyName']);let person;
          do{
            const alternate=names.generate({gender:entry.person.gender});person={...entry.person,[key]:alternate[key]};
          }while(matches(person,entry)||NameEngine.normalize(person.firstName)===NameEngine.normalize(person.fatherName)||NameEngine.normalize(person.fatherName)===NameEngine.normalize(person.grandfatherName));
          person.fullName=[person.firstName,person.fatherName,person.grandfatherName,person.familyName].join(' ');
          person.ledgerName=[person.firstName,person.fatherName,person.familyName].join(' ');
          card=ids.generate({person,idNumber:entry.idNumber,expiryMode:'valid',today});
        }else card=ids.generate({person:entry.person,idNumber:entry.idNumber,expiryMode:'expired',today});
      }
      if(kind!=='stranger'){
        const details=entry.details||(entry.details={b:card.birthDate.toISOString(),p:card.birthPlace,v:card.version});
        card={...card,birthDate:new Date(details.b),birthPlace:details.p,version:details.v,age:IDEngine.ageOn(new Date(details.b),today)};
      }
      session.current={card:serialize(card),index,kind};
    }
    function decide(session,allow,now=Date.now()){
      if(!session.current||session.finished)throw new Error('No active card');
      if(typeof allow!=='boolean')throw new TypeError('Decision must be boolean');
      const expected=eligible(session,session.current.card),correct=allow===expected;
      // [decisions, correct, wrong admissions, wrong refusals, correct admissions, correct refusals]
      session.counts[0]++;if(correct)session.counts[1]++;
      session.counts[correct?(allow?4:5):(allow?2:3)]++;
      if(correct&&allow&&!session.admitted.includes(session.current.index))session.admitted.push(session.current.index);
      const kind=session.current.kind;
      if(session.admitted.length===session.ledger.count){session.finished=now;session.current=null;}
      else next(session);
      return {correct,allow,expected,kind,done:!!session.finished};
    }
    return Object.freeze({create,next,decide,eligible,matches});
  }
  globalThis.TrainingEngine=Object.freeze({createEngine,reviveLedger,reviveCard});
})();
