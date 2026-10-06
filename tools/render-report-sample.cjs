// Filesystem QA using the actual Canvas report painter. No browser is launched.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),destination=path.join(root,'artifacts');fs.mkdirSync(destination,{recursive:true});
const {createCanvas,GlobalFonts}=require(process.argv[2]||'@napi-rs/canvas');
for(const weight of ['Regular','Medium'])GlobalFonts.registerFromPath(path.join(root,'font/IBM_Plex_Sans_Arabic',`IBMPlexSansArabic-${weight}.ttf`),'Plex');
const context=vm.createContext({TextEncoder});vm.runInContext(fs.readFileSync(path.join(root,'src/shared/performance-report.js'),'utf8'),context);
const data={n:'متدرّب — نموذج معاينة',l:{s:12,p:105,c:[150,138,5,7,105,33]},p:{at:new Date('2026-10-06T07:00:00Z').getTime(),people:16,c:[24,22,1,1,16,6]},w:null};
const report=context.PerformanceReport,canvas=createCanvas(report.WIDTH,report.HEIGHT);
report.paint(canvas.getContext('2d'),data,new Date('2026-10-06T08:00:00Z').getTime());
fs.writeFileSync(path.join(destination,'performance-report-sample.png'),canvas.toBuffer('image/png'));
const jpeg=canvas.toBuffer('image/jpeg',94);fs.writeFileSync(path.join(destination,'performance-report-sample.pdf'),report.pdf(jpeg));
console.log(JSON.stringify({image:'artifacts/performance-report-sample.png',pdf:'artifacts/performance-report-sample.pdf',fixture:'fictional preview data',jpegBytes:jpeg.length}));
