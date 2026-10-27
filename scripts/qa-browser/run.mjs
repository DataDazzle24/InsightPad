import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {coverage} from './coverage.mjs';
import {reports} from './reports.mjs';
import {consolidated} from './consolidated.mjs';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const meta=JSON.parse(readFileSync('artifacts/recovery-qa/qa-source.json','utf8'));assert.equal(meta.commit,sha);assert.equal(meta.auth,'mock');
const output='artifacts/browser-private';mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve-recovery-qa.mjs','--entry','application','--port','4174'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('QA server startup timeout')),15000);server.stdout.once('data',()=>{clearTimeout(timer);resolve()});server.once('exit',()=>reject(Error('QA server exited')))});
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'pt-BR'});
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4174'?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:4174/qa/application.html#/cadastros/categorias');assert.equal(response.status(),200);assert.match(response.headers()['content-security-policy'],/connect-src 'none'/);
 await page.evaluate(()=>document.fonts.ready);
 await page.getByText('CATEGORIA QA 001',{exact:true}).first().waitFor();
 await page.locator('.qa-controls').evaluate(e=>{e.open=true});await page.getByText(sha,{exact:true}).waitFor();
 await page.screenshot({path:output+'/route.png',fullPage:true});assert.deepEqual(errors,[]);
 writeFileSync(output+'/proof.json',JSON.stringify({sha,browser:browser.version(),headless:true,server:'same-process-executor/loopback',route:'/cadastros/categorias',auth:'mock',api:'synthetic',viewport:{width:1440,height:1000},scope:'single route rendering proof; no integrated acceptance'},null,2));
 console.log('Synthetic application route rendered at source '+sha);
 if(process.argv.includes('--reports')||process.argv.includes('--full'))await reports({page,output,sha});
 if(process.argv.includes('--consolidated')||process.argv.includes('--full'))await consolidated({page,output,sha});
 if(process.argv.includes('--full')){await page.locator('.qa-controls').evaluate(e=>{e.open=false});await coverage({page,context,output,sha})}
}finally{await browser?.close();server.kill();}
