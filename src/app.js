(() => {
  'use strict';
  const $=id=>document.getElementById(id),engine=TrainingEngine.createEngine();
  let storage;try{storage=localStorage;}catch{storage={getItem(){throw new Error('Storage unavailable');},setItem(){throw new Error('Storage unavailable');}};}
  const store=TrainingStore.create(storage);let locked=false,toastTimer,nameTimer,zoom=1,viewerKind='ledger',reportData,exportBusy=false;
  const theme=matchMedia('(prefers-color-scheme: dark)'),accuracy=counts=>counts[0]?`${PerformanceReport.accuracy(counts)}%`:'—';
  const formatDate=value=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}).format(new Date(value));
  function storageNotice(){
    const warning=$('storage-warning');warning.hidden=store.available&&!store.corrupt;
    warning.textContent=!store.available?'تعذّر الحفظ على هذا المتصفّح. يمكنك متابعة التدريب وتصدير التقرير، لكن التقدّم قد لا يبقى عند إغلاق الصفحة.':'تعذّر قراءة الحفظ السابق. بدأت الأداة بسجل جديد على هذا الجهاز.';
  }
  function save(){store.save();storageNotice();}
  function toast(message,neutral=false){clearTimeout(toastTimer);const node=$('toast');node.textContent=message;node.classList.toggle('neutral',neutral);node.hidden=false;toastTimer=setTimeout(()=>{node.hidden=true;},2500);}
  function setThemeLabel(){const dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':theme.matches;$('theme-button').setAttribute('aria-label',dark?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن');}
  if(store.data.t)document.documentElement.dataset.theme=store.data.t;setThemeLabel();theme.addEventListener('change',setThemeLabel);
  $('theme-button').addEventListener('click',()=>{store.data.t=(document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&theme.matches))?'light':'dark';document.documentElement.dataset.theme=store.data.t;setThemeLabel();save();});
  function fitLedger(root){root.querySelectorAll('text[data-fit]').forEach(node=>{const max=Number(node.dataset.fit),size=Number(node.getAttribute('font-size'));node.style.fontSize='';node.removeAttribute('textLength');node.removeAttribute('lengthAdjust');const measured=node.getComputedTextLength();if(measured>max){node.style.fontSize=`${Math.max(12,size*max/measured)}px`;if(node.getComputedTextLength()>max){node.setAttribute('textLength',max);node.setAttribute('lengthAdjust','spacingAndGlyphs');}}});}
  function updateHome(){const data=store.data;$('person-action').textContent=data.a?'استكمال التدريب':'ابدأ التدريب';$('resume-note').hidden=!data.a;$('home-sessions').textContent=data.l.s;$('home-accuracy').textContent=accuracy(data.l.c);}
  function renderLedger(){const active=store.data.a;if(!active)return;$('ledger-count').textContent=`${active.ledger.count} في الكشف`;$('ledger-paper').innerHTML=LedgerRenderer.render(TrainingEngine.reviveLedger(active.ledger),LedgerAssets);fitLedger($('ledger-paper'));}
  function renderCard(){
    const active=store.data.a;if(!active?.current)return;
    IDCardRenderer.update($('training-card'),TrainingEngine.reviveCard(active.current.card));
    $('progress-label').textContent=`${active.admitted.length} / ${active.ledger.count}`;
    $('progress-fill').style.width=`${active.admitted.length/active.ledger.count*100}%`;
    $('progress').setAttribute('aria-valuemax',active.ledger.count);$('progress').setAttribute('aria-valuenow',active.admitted.length);
    $('session-date').textContent=`تاريخ التدريب: ${formatDate(active.ledger.today)}`;
    $('card-counter').textContent=`البطاقة ${active.counts[0]+1}`;
    $('allow-button').disabled=locked;$('refuse-button').disabled=locked;
  }
  function pair(label,value){const row=document.createElement('div');row.className='stat-pair';const key=document.createElement('span'),number=document.createElement('strong');key.textContent=label;number.textContent=value;number.className='number';row.append(key,number);return row;}
  function renderStats(){
    const data=store.data;$('trainee-name').value=data.n;
    Object.entries({'lifetime-accuracy':accuracy(data.l.c),'lifetime-sessions':data.l.s,'lifetime-decisions':data.l.c[0],'lifetime-correct':data.l.c[1],'lifetime-false-allow':data.l.c[2],'lifetime-false-refuse':data.l.c[3]}).forEach(([id,value])=>$(id).textContent=value);
    const last=$('last-person');last.replaceChildren();
    if(!data.p){last.textContent='لم يكتمل تدريب بعد.';return;}
    for(const [label,value] of [['دقّة القرارات',accuracy(data.p.c)],['الأشخاص المصرّح لهم',data.p.people],['القرارات غير الصحيحة',data.p.c[2]+data.p.c[3]]])last.append(pair(label,value));
    const note=document.createElement('p');note.className='quiet';note.textContent=`اكتمل في ${formatDate(new Date(data.p.at).toISOString())}`;last.append(note);
  }
  function renderResult(){const result=store.data.p;if(!result)return;$('result-accuracy').textContent=accuracy(result.c);$('result-decisions').textContent=result.c[0];$('result-mistakes').textContent=result.c[2]+result.c[3];}
  function route(){
    let target=location.hash.slice(1)||'home';if(target==='training'&&!store.data.a)target=store.data.p?'result':'home';if(target==='result'&&!store.data.p)target='home';if(!['home','training','stats','result'].includes(target))target='home';
    const screen=target==='training'?(store.data.a.reviewed?'training':'ledger'):target;
    for(const node of document.querySelectorAll('.screen'))node.hidden=node.id!==`${screen}-screen`;
    if(target==='home')updateHome();else if(screen==='ledger')renderLedger();else if(screen==='training')renderCard();else if(target==='stats')renderStats();else renderResult();
    storageNotice();window.scrollTo(0,0);
  }
  function navigate(hash){if(location.hash===`#${hash}`)route();else{history.pushState(null,'',`#${hash}`);route();}}
  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);
  function start(){if(!store.data.a){store.data.a=engine.create();save();}navigate('training');}
  $('person-start').addEventListener('click',start);$('again-button').addEventListener('click',start);
  $('begin-cards').addEventListener('click',()=>{if(!store.data.a)return;store.data.a.reviewed=true;save();route();});
  function decide(allow){
    if(locked||!store.data.a?.current)return;locked=true;$('allow-button').disabled=true;$('refuse-button').disabled=true;
    const result=store.decide(engine,allow);storageNotice();
    if(!result.correct)toast(allow?'سماح غير صحيح':'رفض غير صحيح');
    if(result.done){navigate('result');$('announcement').textContent='اكتمل التدريب. دخل جميع الأشخاص المصرّح لهم.';}
    else{renderCard();$('announcement').textContent='بطاقة جديدة للمراجعة.';}
    setTimeout(()=>{locked=false;$('allow-button').disabled=false;$('refuse-button').disabled=false;},500);
  }
  $('allow-button').addEventListener('click',()=>decide(true));$('refuse-button').addEventListener('click',()=>decide(false));
  $('trainee-name').addEventListener('input',()=>{store.data.n=$('trainee-name').value;clearTimeout(nameTimer);nameTimer=setTimeout(save,300);});
  $('trainee-name').addEventListener('change',()=>{clearTimeout(nameTimer);save();});
  window.addEventListener('pagehide',()=>{clearTimeout(nameTimer);if(store.data.a||store.data.n)save();});
  function showDialog(id){$(id).showModal();document.body.classList.add('dialog-open');}
  $('about-button').addEventListener('click',()=>showDialog('about-dialog'));
  for(const node of document.querySelectorAll('[data-close]'))node.addEventListener('click',()=>$(node.dataset.close).close());
  for(const dialog of document.querySelectorAll('dialog')){
    dialog.addEventListener('close',()=>{document.body.classList.toggle('dialog-open',!!document.querySelector('dialog[open]'));});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  }
  function updateZoom(value,keepCenter=true){
    const scroll=$('viewer-scroll'),documentNode=$('viewer-document'),previous=Number.parseFloat(documentNode.style.width)||1;
    zoom=Math.min(6,Math.max(.75,value));const width=Math.max(200,scroll.clientWidth-28)*zoom;
    documentNode.style.width=`${width}px`;$('zoom-value').textContent=`${Math.round(zoom*100)}%`;
    if(keepCenter){scroll.scrollLeft=(scroll.scrollLeft+scroll.clientWidth/2)*width/previous-scroll.clientWidth/2;scroll.scrollTop=(scroll.scrollTop+scroll.clientHeight/2)*width/previous-scroll.clientHeight/2;}
    $('zoom-out').disabled=zoom<=.75;$('zoom-in').disabled=zoom>=6;
  }
  function openViewer(kind){
    if(!store.data.a)return;viewerKind=kind;const active=store.data.a;
    const source=kind==='ledger'?LedgerRenderer.render(TrainingEngine.reviveLedger(active.ledger),LedgerAssets):IDCardRenderer.render(TrainingEngine.reviveCard(active.current.card),'viewer-card');
    $('viewer-document').innerHTML=kind==='ledger'?IDCardRenderer.prefixIds(source,'viewer-ledger'):source;
    $('viewer-title').textContent=kind==='ledger'?'كشف الدخول':'تفاصيل الهوية';$('viewer-dialog').querySelector('.viewer-return').textContent=active.reviewed?'العودة إلى القرار':'العودة إلى الكشف';
    showDialog('viewer-dialog');
    const available=Math.max(200,$('viewer-scroll').clientWidth-28);updateZoom(Math.max(1,(kind==='ledger'?1000:700)/available),false);
    if(kind==='ledger')fitLedger($('viewer-document'));else IDCardRenderer.fit($('viewer-document'));
    $('viewer-scroll').scrollTop=0;$('viewer-scroll').scrollLeft=$('viewer-scroll').scrollWidth;
  }
  $('ledger-preview-button').addEventListener('click',()=>openViewer('ledger'));$('open-ledger').addEventListener('click',()=>openViewer('ledger'));
  $('id-preview-button').addEventListener('click',()=>openViewer('id'));$('open-id').addEventListener('click',()=>openViewer('id'));
  $('zoom-in').addEventListener('click',()=>updateZoom(zoom*1.25));$('zoom-out').addEventListener('click',()=>updateZoom(zoom/1.25));$('zoom-fit').addEventListener('click',()=>updateZoom(1));
  window.addEventListener('resize',()=>{if($('viewer-dialog').open)updateZoom(zoom);});
  document.fonts.ready.then(()=>{IDCardRenderer.fit($('training-card'));fitLedger($('ledger-paper'));if($('viewer-dialog').open){if(viewerKind==='ledger')fitLedger($('viewer-document'));else IDCardRenderer.fit($('viewer-document'));}});
  $('report-button').addEventListener('click',async()=>{
    reportData=JSON.parse(JSON.stringify(store.data));reportData.a=null;showDialog('report-dialog');$('report-preview').textContent='جارٍ إعداد التقرير…';
    try{const canvas=await PerformanceReport.canvas(reportData);canvas.setAttribute('role','img');canvas.setAttribute('aria-label','تقرير إحصاءات المتدرّب: الإحصاءات التراكمية وآخر تدريب للأفراد والمركبات.');$('report-preview').replaceChildren(canvas);}catch{$('report-preview').textContent='تعذّر إعداد التقرير. يرجى المحاولة مجدداً.';}
    $('share-report').hidden=!navigator.share;
  });
  function download(blob,name){const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function exportReport(format,share=false){
    if(exportBusy||!reportData)return;exportBusy=true;for(const id of ['export-pdf','export-image','share-report'])$(id).disabled=true;
    try{
      const blob=await PerformanceReport.exportReport(reportData,format),name=`تقرير-تدريب-طويق-${new Date().toISOString().slice(0,10)}.${format==='png'?'png':'pdf'}`;
      const file=new File([blob],name,{type:blob.type});
      if(share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'تقرير أداء المتدرّب'});else download(blob,name);
    }catch(error){if(error.name!=='AbortError')toast('تعذّر التصدير. يرجى المحاولة مجدداً.',true);}
    finally{exportBusy=false;for(const id of ['export-pdf','export-image','share-report'])$(id).disabled=false;}
  }
  $('export-pdf').addEventListener('click',()=>exportReport('pdf'));$('export-image').addEventListener('click',()=>exportReport('png'));$('share-report').addEventListener('click',()=>exportReport('pdf',true));
  async function prepareOffline(){
    const label=$('offline-status');
    if(location.protocol==='file:'){label.textContent='تشغيل محلي · جميع الملفات على جهازك';$('offline-dot').classList.add('ready');return;}
    if(!('serviceWorker' in navigator)||!window.isSecureContext){label.textContent='التشغيل دون اتصال متاح عند فتح الموقع عبر اتصال آمن.';return;}
    let timer;
    try{await navigator.serviceWorker.register('./sw.js');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Cache installation timeout')),20000);})]);clearTimeout(timer);label.textContent='جاهز دون اتصال';$('offline-dot').classList.add('ready');}
    catch{label.textContent='لم يكتمل التجهيز دون اتصال. افتح الموقع مجدداً مع توفر الإنترنت.';}
  }
  route();prepareOffline();
})();
