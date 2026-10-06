(() => {
  'use strict';
  const WIDTH=1188,HEIGHT=840,BLUE='#d6eaf1',INK='#111';
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const date=value=>IDEngine.gregorian(value).split('/').reverse().join('/');
  function render(data,assets) {
    const elements=[];
    const rect=(x,y,w,h,fill='white',stroke='#343a3b',line=1)=>elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${line}"/>`);
    function text(value,x,y,{size=16,weight=500,anchor='middle',direction='rtl',width,color=INK}={}){
      elements.push(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" direction="${direction}" fill="${color}"${width?` data-fit="${width}"`:''}>${escape(value)}</text>`);
    }
    function cell(value,x,y,w,h,{fill='white',size=16,weight=500,direction='rtl',width=w-12}={}){
      rect(x,y,w,h,fill);const rows=String(value).split('\n');
      rows.forEach((row,index)=>text(row,x+w/2,y+h/2+(index-(rows.length-1)/2)*(size+3)+size*.32,{size,weight,direction,width}));
    }
    const signature=(index,x,y,scale=1,rotate=0)=>elements.push(`<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="none" stroke="#244b7b" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" opacity=".87" aria-hidden="true"><path d="${LedgerSignatures[index]}"/></g>`);
    elements.push('<rect width="1188" height="840" fill="white"/>');
    rect(34,30,1120,774,'none','#252a2b',1.7);
    // The three-box header is deliberately compact and centered, as in the source.
    cell(`رقم / تاريخ الإصدار الأول: ${date(data.issueDate)}`,270,49,270,38,{size:13});
    cell(`رقم / تاريخ التعديل: ${data.revision} / —`,270,87,270,36,{size:13});
    cell('إدارة الأمن الصناعي',540,49,140,74,{fill:'#3c9bc8',size:14});
    rect(680,49,240,74);elements.push(`<image x="691" y="61" width="218" height="49" href="${escape(assets.logo)}" preserveAspectRatio="xMidYMid meet"/>`);
    text('عام / Public',800,119,{size:10,color:'#687573'});
    cell('نموذج رقم (1)\nتصريح دخول أفراد للمقاول',480,143,230,53,{fill:BLUE,size:17,weight:500});
    const x=66,w=1074,top=207;
    // Paired metadata fields preserve the source's uneven column widths.
    const widths=[220,148,202,138,208,158];let px=x;
    [date(data.issueDate),'تاريخ الإصدار',new Intl.DateTimeFormat('ar-SA',{timeZone:'UTC',weekday:'long'}).format(data.issueDate),'يوم الإصدار',data.permitNumber,'رقم تصريح الدخول'].forEach((value,index)=>{cell(value,px,top,widths[index],34,{fill:index%2?BLUE:'white',direction:index===0||index===4?'ltr':'rtl',size:16});px+=widths[index];});
    const middle=top+34;
    cell(data.project,66,middle,220,63,{size:14});cell('اسم المشروع',286,middle,148,63,{fill:BLUE});
    cell(date(data.approvalDate),434,middle,106,63,{size:14,direction:'ltr'});cell('تاريخه',540,middle,49,63,{size:13});
    cell(data.approvalNumber,589,middle,90,63,{size:14,direction:'ltr'});cell('رقم التعميد',679,middle,95,63,{size:14});
    cell(data.contractor,774,middle,208,63,{size:16});cell('اسم مقاول المشروع',982,middle,158,63,{fill:BLUE,size:15});
    px=x;
    [date(data.endDate),'تاريخ نهاية العمل',date(data.startDate),'تاريخ بداية العمل',data.site,'موقع عمل المقاول'].forEach((value,index)=>{cell(value,px,middle+63,widths[index],31,{fill:index%2?BLUE:'white',direction:index===0||index===2?'ltr':'rtl',size:15});px+=widths[index];});
    const tableTop=middle+94,halfRows=Math.ceil(data.count/2),headerHeight=25,rowHeight=25,halfWidth=w/2;
    const columns=[98,137,83,175,44],headings=['ملاحظات','رقم الإقامة / الجواز','الجنسية','الاسم','م'];
    for(let side=0;side<2;side++){
      const start=x+side*halfWidth;let cx=start;
      headings.forEach((label,index)=>{cell(label,cx,tableTop,columns[index],headerHeight,{fill:BLUE,size:14});cx+=columns[index];});
      for(let row=0;row<halfRows;row++){
        const entryIndex=side===1?row:halfRows+row,entry=data.entries[entryIndex];
        const values=entry?[entry.notes,entry.idNumber,entry.nationality,entry.name,entryIndex+1]:['','','','',''];cx=start;
        values.forEach((value,index)=>{cell(value,cx,tableTop+headerHeight+row*rowHeight,columns[index],rowHeight,{size:index===3?16:14,direction:index===1||index===4?'ltr':'rtl'});cx+=columns[index];});
      }
    }
    const approvalY=tableTop+headerHeight+halfRows*rowHeight+15;
    const approvalWidths=[301,156,75,116,62,250,114];px=x;
    ['وموافقة مدير إدارة الأمن الصناعي على ذلك',date(data.issueDate),'وتاريخ','—','برقم',`خطاب ${data.requester.name}`,'بناءً على خطاب'].forEach((value,index)=>{cell(value,px,approvalY,approvalWidths[index],26,{fill:[0,2,4,6].includes(index)?BLUE:'white',size:index===0||index===5?13:14,direction:index===1||index===3?'ltr':'rtl'});px+=approvalWidths[index];});
    text('يسمح للأشخاص الموضحة أسماؤهم وجنسياتهم وبياناتهم أعلاه بالدخول إلى الموقع المشار إليه حسب الفترة المذكورة أعلاه.',1139,approvalY+46,{size:14,anchor:'start',width:1058});
    text('فترة العمل: من 07:00 ص إلى 04:30 م',1139,approvalY+67,{size:14,anchor:'start'});
    const signerTop=approvalY+85;
    text('مسؤول إصدار التصاريح',970,signerTop,{size:16});
    const signerRows=[['الاسم',data.issuer.name],['الوظيفة',data.issuer.role],['التوقيع','................................'],['التاريخ',date(data.issueDate)]];
    signerRows.forEach(([label,value],index)=>{text(`${label} :`,1130,signerTop+26+index*22,{size:14,anchor:'start'});text(value,1050,signerTop+26+index*22,{size:14,anchor:index===3?'end':'start',width:244,direction:index===3?'ltr':'rtl'});});
    text('مدير إدارة الأمن الصناعي',275,signerTop,{size:16});
    [['الاسم',`م / ${data.manager.name}`],['الوظيفة',data.manager.role],['التوقيع','................................'],['التاريخ',date(data.issueDate)]].forEach(([label,value],index)=>{text(`${label} :`,423,signerTop+26+index*22,{size:14,anchor:'start'});text(value,350,signerTop+26+index*22,{size:14,anchor:index===3?'end':'start',width:258,direction:index===3?'ltr':'rtl'});});
    signature(data.issuerSignature,807,signerTop+37,.95,-7);signature(data.managerSignature,92,signerTop+49,.93,-8);
    rect(520,signerTop+9,168,96,'none','#365d85',1.3);rect(524,signerTop+13,160,88,'none','#365d85',.65);
    elements.push(`<image x="532" y="${signerTop+24}" width="144" height="32" href="${escape(assets.logo)}" filter="url(#stamp-ink)" preserveAspectRatio="xMidYMid meet"/>`);
    text('إدارة الأمن الصناعي',604,signerTop+70,{size:12,color:'#365d85'});text('تصريح دخول تدريبي',604,signerTop+88,{size:11,color:'#365d85'});
    signature(data.stampSignature,526,signerTop+54,.67,-3);
    text('00_IWC_FM_009.01',51,790,{size:11,anchor:'start',direction:'ltr',weight:400});
    text('نموذج تدريبي · بيانات وتوقيعات تخيلية · غير صالح للاستخدام الرسمي',594,791,{size:11,color:'#777',weight:400});
    return `<svg class="paper" xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="تصريح دخول تدريبي لعدد ${data.count} من الأفراد"><defs><filter id="stamp-ink" color-interpolation-filters="sRGB"><feFlood flood-color="#365d85"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs><style>text{font-family:"IBM Plex Sans Arabic",Plex,Arial,sans-serif}</style>${elements.join('')}</svg>`;
  }
  globalThis.LedgerRenderer=Object.freeze({render,WIDTH,HEIGHT});
})();
