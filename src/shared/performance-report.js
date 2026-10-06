(() => {
  'use strict';
  const WIDTH=1240,HEIGHT=1754;
  const accuracy=c=>c[0]?Math.round(c[1]/c[0]*100):0;
  const date=value=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'Asia/Riyadh',year:'numeric',month:'long',day:'numeric'}).format(new Date(value));
  function paint(ctx,data,now=Date.now()){
    ctx.fillStyle='#fff';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.textBaseline='middle';
    const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const text=(value,x,y,size=24,color='#253326',align='right',weight=400)=>{ctx.font=`${weight} ${size}px Plex`;ctx.fillStyle=color;ctx.textAlign=align;ctx.direction='rtl';ctx.fillText(String(value),x,y);};
    const fit=(value,x,y,maxWidth,size=30)=>{ctx.font=`500 ${size}px Plex`;const measured=ctx.measureText(value).width;text(value,x,y,Math.min(size,size*maxWidth/Math.max(measured,1)),'#253326','right',500);};
    box(0,0,WIDTH,18,'#81b866');box(80,84,8,80,'#81b866');
    text('تدريب طويق',1160,106,27,'#527740','right',500);text('تقرير أداء المتدرّب',1160,166,46,'#253326','right',500);
    fit(data.n.trim()||'متدرّب',1160,249,1050,32);text(`تاريخ التقرير: ${date(now)}`,1160,294,20,'#758073');
    text('الإحصاءات التراكمية',1160,385,28,'#253326','right',500);
    const metrics=[['دقّة القرارات',data.l.c[0]?`${accuracy(data.l.c)}%`:'—'],['قرارات صحيحة',data.l.c[1]],['تدريبات مكتملة',data.l.s]];
    metrics.forEach(([label,value],index)=>{const x=80+(2-index)*370;box(x,425,340,166,'#f1f6ed');text(value,x+170,483,50,'#385a27','center',500);text(label,x+170,548,22,'#62705c','center');});
    const rows=[['إجمالي القرارات',data.l.c[0]],['سماح غير صحيح',data.l.c[2]],['رفض غير صحيح',data.l.c[3]],['أشخاص أُدخلوا بصورة صحيحة',data.l.p]];
    rows.forEach(([label,value],index)=>{const y=656+index*57;box(80,y+27,1080,1,'#e7ece3');text(label,1160,y,23);text(value,86,y,27,'#253326','left',500);});
    function latest(result,title,y){
      text(title,1160,y,28,'#253326','right',500);box(80,y+42,1080,172,'#f8f9f6');
      if(!result){text(title.includes('مركبات')?'قريباً':'لم يكتمل تدريب بعد',1128,y+127,24,'#758073');return;}
      text(`اكتمل في ${date(result.at)}`,1128,y+77,21,'#758073');
      text(`${result.people} أشخاص  ·  ${result.c[0]} قرارات`,1128,y+121,25);
      text(`دقّة القرارات ${accuracy(result.c)}%  ·  ${result.c[2]+result.c[3]} قرارات غير صحيحة`,1128,y+165,25);
    }
    latest(data.p,'آخر تدريب مكتمل لدخول الأفراد',968);latest(data.w,'آخر تدريب لدخول المركبات',1250);
    text('تقرير تدريبي للتطوير، دون تصنيف للنجاح أو الرسوب.',1160,1560,21,'#758073');
    box(80,1630,1080,1,'#dfe6d9');text('تصميم وإعداد: سامي ناصر الغامدي',1160,1669,21,'#527740');text('بيانات محفوظة على جهاز المتدرّب',80,1669,18,'#758073','left');
  }
  // One-page PDF containing the rendered report. JPEG keeps Arabic shaping and
  // typography identical to PNG across PDF viewers; no library or font embed.
  function pdf(jpeg,width=WIDTH,height=HEIGHT){
    const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;
    const append=bytes=>{chunks.push(bytes);length+=bytes.length;};const write=value=>append(encoder.encode(value));
    const object=(index,body)=>{offsets[index]=length;write(`${index} 0 obj\n${body}\nendobj\n`);};
    write('%PDF-1.4\n');append(new Uint8Array([37,226,227,207,211,10]));
    object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4]=length;write(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);append(jpeg);write('\nendstream\nendobj\n');
    const commands='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';object(5,`<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
    const xref=length;write('xref\n0 6\n0000000000 65535 f \n');for(let index=1;index<=5;index++)write(`${String(offsets[index]).padStart(10,'0')} 00000 n \n`);
    write(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const output=new Uint8Array(length);let position=0;for(const chunk of chunks){output.set(chunk,position);position+=chunk.length;}return output;
  }
  async function canvas(data){await document.fonts.load('500 30px Plex');await document.fonts.load('400 24px Plex');const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;paint(canvas.getContext('2d'),data);return canvas;}
  const toBlob=(canvas,type,quality)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed')),type,quality));
  async function exportReport(data,format){const image=await canvas(data);if(format==='png')return toBlob(image,'image/png');const jpeg=await toBlob(image,'image/jpeg',.94);return new Blob([pdf(new Uint8Array(await jpeg.arrayBuffer()))],{type:'application/pdf'});}
  globalThis.PerformanceReport=Object.freeze({paint,pdf,canvas,exportReport,accuracy,WIDTH,HEIGHT});
})();
