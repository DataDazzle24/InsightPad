import {chromium} from 'playwright';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
// Run from the repository root after build:qa. Evidence stays in ignored artifacts.
process.umask(0o077);
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const meta=JSON.parse(readFileSync('artifacts/recovery-qa/qa-source.json','utf8'));
assert.equal(meta.commit,sha);assert.equal(meta.auth,'mock');assert.equal(meta.api,'in-memory fixtures; no real backend');
const server=spawn(process.execPath,['scripts/serve-recovery-qa.mjs','--entry','application','--port','4175'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('QA startup timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);resolve()});server.once('exit',()=>{clearTimeout(t);reject(Error('QA server exited'))})});
const out=`artifacts/browser-private/empty-sales-${Date.now()}`;
mkdirSync(out,{recursive:true,mode:0o700});
browser=await chromium.launch({headless:true});assert.equal(browser.version(),'151.0.7922.34');
const results=[];
for(const theme of ['light','dark'])for(const width of [320,360,375,1440])for(const scenario of ['initial','filtered']){
const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage(),errors=[];
await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4175'?r.continue():r.abort());
await page.addInitScript(t=>localStorage.setItem('insightpad.theme',t),theme);
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4175/qa/application.html#/vendas/registros');
await page.locator('.qa-controls').evaluate(e=>e.open=true);
await page.getByLabel('Dados vazios',{exact:true}).check();
await page.locator('.catalog-empty strong').waitFor();
await page.locator('.qa-controls').evaluate(e=>e.open=false);
if(scenario==='filtered'){await page.getByPlaceholder('ID ou cliente...').fill('sem resultado');await page.getByRole('button',{name:'Limpar pesquisa e filtros'}).waitFor();}
await page.evaluate(()=>document.fonts.ready);
await page.locator('.catalog-empty').scrollIntoViewIfNeeded();
const metrics=await page.locator('.catalog-empty').evaluate(e=>{
 const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
 const bg=x=>{while(x){const c=getComputedStyle(x).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return c;x=x.parentElement}return 'rgb(255, 255, 255)'};
 return {background:bg(e),box:rect(e),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,children:[...e.children].map(x=>({tag:x.tagName,text:x.textContent,color:getComputedStyle(x).color,fontSize:getComputedStyle(x).fontSize,lineHeight:getComputedStyle(x).lineHeight,box:rect(x),scrollWidth:x.scrollWidth,clientWidth:x.clientWidth})),theme:document.documentElement.dataset.theme,sha:document.querySelector('.qa-controls code').textContent,mocks:document.querySelector('.qa-controls').textContent.includes('Auth/API mockados')};
});
const lum=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
for(const c of metrics.children){const a=lum(c.color),b=lum(metrics.background);c.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
await page.screenshot({path:`${out}/${theme}-${width}-${scenario}.png`,fullPage:true});
results.push({theme,width,scenario,emulation:true,browser:browser.version(),metrics,errors});
await context.close();
}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2),{mode:0o600});
for(const r of results){
 assert.deepEqual(r.errors,[],`${r.theme}/${r.width}/${r.scenario}: JavaScript errors`);
 assert.equal(r.metrics.theme,r.theme);assert.equal(r.metrics.mocks,true);assert.equal(r.metrics.sha,sha);
 assert.equal(r.metrics.scrollWidth,r.metrics.clientWidth,'Empty state must not overflow horizontally');
 for(const c of r.metrics.children){
   assert.ok(c.contrast>=4.5,`${r.theme}/${r.width}/${c.tag}: contrast ${c.contrast}`);
   assert.ok(c.box.x>=r.metrics.box.x-1 && c.box.right<=r.metrics.box.right+1,'Text/control must fit empty state');
   assert.ok(c.scrollWidth<=c.clientWidth+1,'Text must wrap without clipping');
 }
 for(let i=1;i<r.metrics.children.length;i++)assert.ok(r.metrics.children[i].box.y>=r.metrics.children[i-1].box.bottom-1,'Empty state content must not overlap');
}
console.log(`Passed ${results.length} sales empty-state scenarios with Chromium ${browser.version()}; private evidence: ${out}`);
}finally{await browser?.close();server.kill()}
