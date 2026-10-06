(() => {
  'use strict';
  const $=id=>document.getElementById(id),engine=LedgerEngine.createEngine();
  const countMode=$('count-mode'),container=$('paper-container');let current;
  const countLabel=count=>`${count} ${count===1?'شخص':count===2?'شخصان':count<=10?'أشخاص':'شخصاً'}`;
  for(let count=1;count<=16;count++){const option=document.createElement('option');option.value=count;option.textContent=countLabel(count);countMode.append(option);}
  // Measure the actual loaded Arabic font, keeping long compound names in their cells.
  function fitText(root){
    root.querySelectorAll('text[data-fit]').forEach(node=>{
      const maxWidth=Number(node.dataset.fit),size=Number(node.getAttribute('font-size'));
      node.removeAttribute('textLength');node.removeAttribute('lengthAdjust');
      node.style.fontSize='';
      const measured=node.getComputedTextLength();
      if(measured>maxWidth){
        node.style.fontSize=`${Math.max(12,size*maxWidth/measured)}px`;
        if(node.getComputedTextLength()>maxWidth){node.setAttribute('textLength',maxWidth);node.setAttribute('lengthAdjust','spacingAndGlyphs');}
      }
    });
  }
  function generate(){
    current=engine.generate(countMode.value==='auto'?{}:{count:Number(countMode.value)});
    container.innerHTML=LedgerRenderer.render(current,LedgerAssets);fitText(container);
    $('count-label').textContent=countLabel(current.count);
    $('permit-label').textContent=current.permitNumber;
    const rows=document.createDocumentFragment();
    current.entries.forEach((entry,index)=>{const row=document.createElement('tr');[index+1,entry.name,entry.idNumber,entry.nationality].forEach((value,column)=>{const cell=document.createElement('td');cell.textContent=value;if(column===0||column===2)cell.className='number';row.append(cell);});rows.append(row);});
    $('entry-list').replaceChildren(rows);
    $('announcement').textContent=`تم توليد تصريح جديد لعدد ${current.count} من الأشخاص.`;
  }
  $('ledger-form').addEventListener('submit',event=>{event.preventDefault();generate();});
  countMode.addEventListener('change',generate);
  $('theme-button').addEventListener('click',()=>{
    const dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'light':'dark';try{localStorage.setItem('tuwaiq-theme',dark?'light':'dark');}catch{}
  });
  $('about-button').addEventListener('click',()=>$('about-dialog').showModal());
  $('close-about').addEventListener('click',()=>$('about-dialog').close());
  $('zoom-button').addEventListener('click',()=>{
    const copy=container.querySelector('svg').cloneNode(true);
    copy.querySelector('#stamp-ink').id='zoom-stamp-ink';copy.querySelector('image[filter]').setAttribute('filter','url(#zoom-stamp-ink)');
    $('zoom-content').replaceChildren(copy);$('zoom-dialog').showModal();fitText(copy);
  });
  $('close-zoom').addEventListener('click',()=>$('zoom-dialog').close());
  $('print-button').addEventListener('click',async()=>{await document.fonts.ready;fitText(container);window.print();});
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
  generate();document.fonts.ready.then(()=>fitText(container));
})();
