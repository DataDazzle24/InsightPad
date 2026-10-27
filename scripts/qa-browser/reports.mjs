import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Existing app + browser executor. All originals stay beneath the sealed private directory.
export async function reports({page,output,sha}){
 const dir=output+'/reports';mkdirSync(dir,{recursive:true});const cases=[];
 try{
  for(const theme of ['light','dark'])for(const view of ['Vendas','Estoque','Categorias','Canais','Clientes']){
   const name=view+'-'+theme;await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4174/qa/application.html?report='+name+'#/dashboards/operacional');await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.getByRole('button',{name:view,exact:true}).click();await page.locator('.finance-kpis article').first().waitFor();await page.locator('.catalog-loader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>{window.__reportPrints=0;window.print=()=>window.__reportPrints++});await page.getByRole('button',{name:'PDF',exact:true}).click();assert.equal(await page.evaluate(()=>window.__reportPrints),1);await page.emulateMedia({media:'print'});assert.equal(await page.locator('html').getAttribute('data-theme'),theme,'Print must not change the interface theme');
   const measured=await page.locator('.finance-dashboard,.analytics-page').evaluate(root=>{
    const rgba=s=>{const a=s.match(/[\d.]+/g)?.map(Number);if(!a||a.length<3)throw Error('unparsed color '+s);return [...a.slice(0,3),a[3]??1]};
    const over=(a,b)=>a.slice(0,3).map((c,i)=>c*a[3]+b[i]*(1-a[3]));const lum=a=>a.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),rows=[];let node;
    while(node=walker.nextNode()){
     const e=node.parentElement,text=node.textContent.trim();if(!text||!e||e.closest('script,style,.material-symbols-rounded'))continue;const style=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||style.visibility==='hidden'||style.display==='none')continue;
     const chain=[];for(let p=e;p;p=p.parentElement)chain.push(p);let bg=[255,255,255];for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);const fg=over(rgba(style.color),bg),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(style.fontSize),large=size>=24||size>=18.66&&Number(style.fontWeight)>=700;
     rows.push({text:text.slice(0,140),tag:e.tagName,foreground:fg,background:bg,ratio,minimum:large?3:4.5,fontSize:size,fontWeight:style.fontWeight});
    }return rows;
   });assert.ok(measured.length>50);writeFileSync(dir+'/'+name+'-contrast.json',JSON.stringify({sha,view,theme,method:'computed print text, alpha composited against actual ancestor backgrounds',measured},null,2));const failures=measured.filter(x=>x.ratio+.001<x.minimum);assert.deepEqual(failures,[],name+' print contrast');
   const pdf=dir+'/'+name+'.pdf';await page.pdf({path:pdf,format:'A4',landscape:true,printBackground:true});const text=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'}),pages=text.split('\f');if(!pages.at(-1).trim())pages.pop();assert.ok(pages.length>0&&pages.at(-1).trim().length>30);assert.doesNotMatch(text,/\b(?:NaN|undefined)\b/);
   const selected=new Set([1,pages.length]);const sections={};
   if(view==='Clientes')for(const [label,count]of [['CLIENTE ATIVO QA',65],['ANIVERSARIANTE QA',51],['SEM COMPRAR QA',1201]]){
    const ids=[...text.matchAll(new RegExp(label+'\\s+(\\d+)','g'))].map(x=>Number(x[1]));assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));sections[label]={expected:count,occurrences:ids.length};
    for(const edge of [pages.findIndex(p=>p.includes(label+' 1')),pages.findLastIndex(p=>p.includes(label+' '+count))]){assert.ok(edge>=0);selected.add(edge+1);if(edge>0)selected.add(edge)}
   }
   if(view==='Clientes')assert.match(pages.at(-1),/SEM COMPRAR QA 1201/);
   for(const p of selected)execFileSync('pdftoppm',['-f',String(p),'-l',String(p),'-scale-to','1600','-png',pdf,dir+'/'+name]);
   // Poppler independently parses actual PDF font colors/text, not the JS serializer.
   const xml=execFileSync('pdftohtml',['-xml','-i','-stdout',pdf],{encoding:'utf8',maxBuffer:30*1024*1024});writeFileSync(dir+'/'+name+'.xml',xml);assert.ok(xml.includes('<text'));
   cases.push({name,result:'passed',pages:pages.length,printTextSamples:measured.length,minRatio:Math.min(...measured.map(x=>x.ratio)),sections,rasterizedPages:[...selected].sort((a,b)=>a-b),source:sha});await page.emulateMedia({media:'screen'});
  }
 }finally{await page.emulateMedia({media:'screen'});writeFileSync(dir+'/results.json',JSON.stringify({sha,browser:page.context().browser().version(),auth:'mock',api:'memory',printMethod:'UI print handler + Chromium PDF renderer; native print dialog not exercised',cases},null,2))}
 assert.equal(cases.length,10);
}
