import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {chromium} from './node_modules/playwright/index.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const {values}=parseArgs({options:{qa:{type:'string',default:'http://127.0.0.1:4188'},reference:{type:'string'},out:{type:'string'},'zoom-only':{type:'boolean',default:false}}});
for(const address of [values.qa,values.reference].filter(Boolean))assert.ok(['127.0.0.1','localhost'].includes(new URL(address).hostname),'Use a local server in the same cloud executor');
const output=resolve(values.out||join(root,'artifacts/login-visual-private',new Date().toISOString().replace(/[:.]/g,'-')));
mkdirSync(output,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const tracked=['frontend/src/pages/LoginPage.tsx','frontend/src/pages/LoginPage.visual.css','frontend/public/brand/login-flow-dark.svg','frontend/public/brand/login-flow-light.svg','frontend/src/components/ModalDialog.tsx','frontend/src/auth/AuthProvider.tsx'];
const report={candidateSHA:git('rev-parse','HEAD'),workingTree:git('status','--porcelain'),sourceSHA256:Object.fromEntries(tracked.map(p=>[p,createHash('sha256').update(readFileSync(join(root,p))).digest('hex')])),startedUTC:new Date().toISOString(),origin:'real React App/LoginPage in existing isolated QA build; Auth/API fixtures only, not deployed authentication',browser:null,comparisons:[],interactions:[],nativeZoom:[],requestsBlocked:[],pageErrors:[],failures:[],captures:[],physicalDevice:false,virtualKeyboard:false};
const allowed=new Set([new URL(values.qa).origin,...(values.reference?[new URL(values.reference).origin]:[])]);
async function protect(context){await context.route('**/*',r=>{if(allowed.has(new URL(r.request().url()).origin))return r.continue();report.requestsBlocked.push(r.request().url());return r.abort()})}
async function ready(page){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(180);await page.evaluate(()=>document.querySelectorAll('.qa-controls,.preview-tools').forEach(e=>e.style.visibility='hidden'))}
async function screenshot(page,name){await page.screenshot({path:join(output,name),animations:'disabled'});report.captures.push(name)}
async function reachable(locator){
 await locator.scrollIntoViewIfNeeded();
 const result=await locator.evaluate(e=>{const r=e.getBoundingClientRect();let top=0,left=0,right=innerWidth,bottom=innerHeight;for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),box=p.getBoundingClientRect();if(['auto','scroll','hidden','clip'].includes(s.overflowY)){top=Math.max(top,box.top);bottom=Math.min(bottom,box.bottom)}if(['auto','scroll','hidden','clip'].includes(s.overflowX)){left=Math.max(left,box.left);right=Math.min(right,box.right)}if(p.matches('dialog[open]'))break}return{box:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},clip:{top,bottom,left,right},fullyVisible:r.top>=top&&r.bottom<=bottom&&r.left>=left&&r.right<=right}});
 assert.ok(result.fullyVisible,'Control remains clipped after scrolling: '+JSON.stringify(result));return result;
}
async function geometry(page){return page.evaluate(()=>{
 const selectors=['.brand-login','.brand-login__hero','.login-logo-frame','.brand-login__logo','.brand-login__hero>footer','.login-hud','.login-hud header h2','#email','#password','.login-submit','.login-hud>footer','dialog[open]','.recovery-modal','.recovery-body','.recovery-modal form>footer'];
 return selectors.flatMap(selector=>{const e=document.querySelector(selector);if(!e)return[];const r=e.getBoundingClientRect(),s=getComputedStyle(e);return[{selector,box:{x:r.x,y:r.y,width:r.width,height:r.height},style:Object.fromEntries(['display','padding','fontSize','fontFamily','lineHeight','borderTopWidth','backgroundColor','color','maxHeight','overflow','objectFit','backdropFilter','textRendering','webkitFontSmoothing'].map(k=>[k,s[k]]))}]});
})}
async function loginPage(browser,viewport,theme,recovery=false){
 const context=await browser.newContext({viewport,locale:'pt-BR',deviceScaleFactor:1,colorScheme:theme});await protect(context);
 await context.addInitScript(theme=>{if(!localStorage.getItem('insightpad.theme'))localStorage.setItem('insightpad.theme',theme)},theme);
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(values.qa+(recovery?'/qa/recovery.html':'/qa/application.html?qa-login#/login'));await ready(page);return{context,page};
}
async function check(name,fn){try{await fn();report.interactions.push({name,passed:true})}catch(error){report.failures.push({name,error:error.message});report.interactions.push({name,passed:false});}}

const browser=values['zoom-only']?null:await chromium.launch({headless:true});if(browser)report.browser='Chromium '+browser.version();
if(browser)try{
 const viewports=[{width:1440,height:900},{width:1366,height:768},{width:1280,height:800},{width:1024,height:600},{width:1024,height:400},{width:390,height:844},{width:320,height:568}];
 for(const viewport of viewports)for(const theme of ['dark','light']){
  const {context,page}=await loginPage(browser,viewport,theme);let reference;
  if(values.reference){reference=await context.newPage();await reference.goto(values.reference+'/?theme='+theme);await ready(reference)}
  for(const state of ['login','recovery-email','recovery-sms']){
   if(state==='recovery-email'){await page.getByRole('button',{name:'Esqueci minha senha',exact:true}).click();if(reference)await reference.getByRole('button',{name:'Esqueci minha senha',exact:true}).click()}
   if(state==='recovery-sms'){await page.locator('.recovery-methods button').nth(1).click();if(reference)await reference.locator('.recovery-methods button').nth(1).click()}
   await ready(page);if(reference)await ready(reference);
   const name=`${state}-${theme}-${viewport.width}x${viewport.height}`;
   await screenshot(page,'react-'+name+'.png');const actual=await geometry(page);
   if(reference){await screenshot(reference,'reference-'+name+'.png');const expected=await geometry(reference);const differences=actual.flatMap(a=>{const e=expected.find(e=>e.selector===a.selector);return e&&JSON.stringify(e)!==JSON.stringify(a)?[{selector:a.selector,actual:a,expected:e}]:[]});report.comparisons.push({name,viewport,theme,state,differences});if(differences.length)report.failures.push({name,error:'Visual geometry/computed styles differ from supplied preview',selectors:differences.map(d=>d.selector)})}
   const metrics=await page.evaluate(()=>{const main=document.querySelector('.brand-login');return{documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth,mainWidth:main.clientWidth,mainScrollWidth:main.scrollWidth,inputFont:getComputedStyle(document.querySelector('#email')).fontSize,slogan:!!document.querySelector('.brand-login__statement'),logosLoaded:[...document.querySelectorAll('.brand-login__hero img')].every(e=>e.complete&&e.naturalWidth),localFont:document.fonts.check('16px IPLogin')}});
   assert.ok(metrics.documentScrollWidth<=metrics.documentWidth&&metrics.mainScrollWidth<=metrics.mainWidth,name+': horizontal overflow');assert.equal(metrics.inputFont,'16px');assert.equal(metrics.slogan,false);assert.ok(metrics.logosLoaded&&metrics.localFont);
   if(state==='login'){await reachable(page.locator('.login-hud>footer'));assert.ok(await page.locator('.login-submit').isVisible());if(viewport.height<=600)await screenshot(page,'react-end-'+name+'.png');await page.locator('.brand-login').evaluate(e=>e.scrollTop=0)}
   if(state==='recovery-sms')assert.ok(await page.getByRole('button',{name:'Indisponível',exact:true}).isDisabled());
  }
  await context.close();console.log('Viewport compared',viewport.width,viewport.height,theme);
 }
 await check('login theme, persistence, field values, password and Enter submit to existing fixture',async()=>{
  const{context,page}=await loginPage(browser,{width:1280,height:800},'dark');
  await page.locator('#email').fill('designer@example.invalid');await page.locator('#password').fill('SenhaFicticia!123');
  await page.locator('.login-theme').click();assert.equal(await page.locator('main').getAttribute('data-theme'),'light');assert.equal(await page.locator('#email').inputValue(),'designer@example.invalid');
  await page.getByRole('button',{name:'Mostrar senha',exact:true}).click();assert.equal(await page.locator('#password').getAttribute('type'),'text');assert.equal(await page.getByRole('button',{name:'Ocultar senha',exact:true}).getAttribute('aria-pressed'),'true');await screenshot(page,'state-filled-visible-password.png');
  await page.reload();await ready(page);assert.equal(await page.locator('main').getAttribute('data-theme'),'light');
  await page.locator('#email').fill('designer@example.invalid');await page.locator('#password').fill('SenhaFicticia!123');await page.locator('#password').press('Enter');await page.locator('.app-frame').waitFor();assert.equal(await page.evaluate(()=>location.hash),'#/');await context.close();
 });
 await check('native required validation leaves login unchanged',async()=>{const{context,page}=await loginPage(browser,{width:1280,height:800},'dark');await page.locator('.login-submit').click();assert.equal(await page.locator('#email').evaluate(e=>e.validity.valueMissing),true);assert.equal(await page.evaluate(()=>location.hash),'#/login');await screenshot(page,'state-native-validation.png');await context.close()});
 await check('native modal initial focus, Tab/Shift+Tab, Escape and opener return',async()=>{
  const{context,page}=await loginPage(browser,{width:1280,height:800},'dark');const opener=page.getByRole('button',{name:'Esqueci minha senha',exact:true});await opener.click();assert.ok(await page.locator('dialog input').evaluate(e=>e===document.activeElement));
  const close=page.getByRole('button',{name:'Fechar',exact:true}),send=page.getByRole('button',{name:'Enviar instruções',exact:true});await send.focus();await page.keyboard.press('Tab');assert.ok(await close.evaluate(e=>e===document.activeElement));await page.keyboard.press('Shift+Tab');assert.ok(await send.evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0);assert.ok(await opener.evaluate(e=>e===document.activeElement));
  await opener.click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.ok(await opener.evaluate(e=>e===document.activeElement));await opener.click();await close.click();assert.ok(await opener.evaluate(e=>e===document.activeElement));await context.close();
 });
 await check('controlled loading/error contexts and long feedback remain reachable',async()=>{
  const{context,page}=await loginPage(browser,{width:320,height:568},'light',true);await page.evaluate(()=>{const q=document.querySelector('.qa-controls');q.style.visibility='visible';q.open=true});
  const select=page.getByLabel('Contexto visual de autenticação (QA, sem login real)');await select.selectOption('error');await ready(page);assert.equal(await page.locator('.form-feedback--error').textContent(),'E-mail ou senha inválidos.');await page.locator('.login-submit').scrollIntoViewIfNeeded();await screenshot(page,'state-controlled-error-320.png');
  await page.evaluate(()=>{const q=document.querySelector('.qa-controls');q.style.visibility='visible';q.open=true});await select.selectOption('loading');await ready(page);assert.ok(await page.locator('#email').isDisabled()&&await page.locator('#password').isDisabled()&&await page.locator('.login-submit').isDisabled());await screenshot(page,'state-controlled-loading-320.png');await context.close();
 });
 await check('recovery pending guards, duplicate submit and generic success/failure',async()=>{
  const{context,page}=await loginPage(browser,{width:1280,height:800},'dark',true);await page.locator('#email').fill('designer@example.invalid');
  await page.getByRole('button',{name:'Esqueci minha senha',exact:true}).click();await page.locator('dialog form').evaluate(form=>{for(let i=0;i<2;i++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});
  assert.ok(await page.locator('dialog').getAttribute('aria-busy')==='true');assert.ok(await page.getByRole('button',{name:'Fechar',exact:true}).isDisabled());await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),1);assert.match(await page.locator('.qa-controls').textContent(),/Requisições simuladas: 1/);await screenshot(page,'state-recovery-busy.png');
  await page.locator('dialog').waitFor({state:'detached',timeout:20000});const generic='Se o e-mail estiver cadastrado, uma mensagem segura de recuperação será enviada.';assert.equal(await page.locator('.form-feedback--info').textContent(),generic);await screenshot(page,'state-recovery-generic-success.png');
  await page.evaluate(()=>{const q=document.querySelector('.qa-controls');q.style.visibility='visible';q.open=true});await page.getByLabel('Resultado sintético').selectOption('failure');await page.getByLabel('Tempo pendente').selectOption('1');await ready(page);await page.getByRole('button',{name:'Esqueci minha senha',exact:true}).click();await page.getByRole('button',{name:'Enviar instruções',exact:true}).click();await page.locator('dialog').waitFor({state:'detached'});assert.equal(await page.locator('.form-feedback--info').textContent(),generic);assert.match(await page.locator('.qa-controls').textContent(),/Requisições simuladas: 2/);await screenshot(page,'state-recovery-generic-failure.png');await page.setViewportSize({width:320,height:568});await reachable(page.locator('.form-feedback--info'));await reachable(page.locator('.login-hud>footer'));await screenshot(page,'state-long-feedback-320-end.png');await context.close();
 });
}catch(error){report.failures.push({name:'runner',error:error.message})}
finally{await browser.close()}

// Chromium tabs.setZoom is native page zoom. It is not CSS zoom, pinch scale or a DPR override.
let zoomContext;
try{
 const extension=mkdtempSync(join(tmpdir(),'insightpad-native-zoom-'));
 writeFileSync(join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Isolated layout zoom proof',version:'1.0',permissions:['tabs'],host_permissions:[values.qa+'/*'],background:{service_worker:'worker.js'}}));
 writeFileSync(join(extension,'worker.js'),"chrome.runtime.onInstalled.addListener(()=>{});\n");
 const context=await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(),'insightpad-zoom-profile-')),{headless:true,channel:'chromium',viewport:{width:1280,height:800},deviceScaleFactor:1,args:['--disable-extensions-except='+extension,'--load-extension='+extension]});zoomContext=context;report.browser='Chromium '+context.browser().version();await protect(context);
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const page=await context.newPage();await page.goto(values.qa+'/qa/application.html?qa-login#/login');await ready(page);
 for(const factor of [2,4]){
  const zoom=await worker.evaluate(async factor=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.includes('/qa/application.html'));if(!tab)throw Error('QA tab not found');await chrome.tabs.setZoom(tab.id,factor);return await chrome.tabs.getZoom(tab.id)},factor);
  await ready(page);const metrics=await page.evaluate(()=>{const e=document.querySelector('.brand-login');return{innerWidth,innerHeight,devicePixelRatio,visualViewportScale:visualViewport.scale,cssZoom:getComputedStyle(e).zoom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}});assert.equal(Math.round(zoom*100),factor*100);assert.equal(metrics.visualViewportScale,1);assert.equal(metrics.cssZoom,'1');
  assert.ok(metrics.scrollWidth<=metrics.clientWidth);const loginEnd=await reachable(page.locator('.login-hud>footer'));await screenshot(page,`native-zoom-${factor*100}-login-end.png`);await page.getByRole('button',{name:'Esqueci minha senha',exact:true}).click();const recoveryInput=await reachable(page.locator('dialog input'));await screenshot(page,`native-zoom-${factor*100}-recovery-input.png`);const recoveryEnd=await reachable(page.getByRole('button',{name:'Enviar instruções',exact:true}));await screenshot(page,`native-zoom-${factor*100}-recovery.png`);await page.keyboard.press('Escape');report.nativeZoom.push({factor,reportedFactor:zoom,api:'chrome.tabs.setZoom/getZoom',metrics,loginEnd,recoveryInput,recoveryEnd,passed:true});
 }
 await context.close();
}catch(error){report.nativeZoom.push({passed:false,error:error.message});report.failures.push({name:'native zoom unavailable or failed',error:error.message})}
finally{await zoomContext?.close().catch(()=>{})}
report.endedUTC=new Date().toISOString();writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,browser:report.browser,comparisons:report.comparisons.length,interactions:report.interactions,nativeZoom:report.nativeZoom,failures:report.failures,pageErrors:report.pageErrors,requestsBlocked:report.requestsBlocked},null,2));
if(report.failures.length||report.pageErrors.length||report.requestsBlocked.length)process.exitCode=1;
