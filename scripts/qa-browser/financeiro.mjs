import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const root = new URL('../../',import.meta.url).pathname
const out = root+'artifacts/browser-private/financeiro'
mkdirSync(out,{recursive:true})
const report = {
  sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  environment:'Chromium, Auth sintético, SQL Connect e PostgreSQL 18 descartáveis',
  cases:[],
}
const runtime=spawn('python3',['-B','scripts/financeiro/browser_runtime.py'],{cwd:root,stdio:['ignore','pipe','pipe']})
let browser
let page
let loseAck=false
try {
  const endpoint=await new Promise((resolve,reject)=>{
    let output='', error=''
    const timeout=setTimeout(()=>reject(Error('Runtime local expirou '+error.slice(-1500))),45000)
    runtime.stderr.on('data',data=>{error+=data})
    runtime.stdout.on('data',data=>{
      output+=data
      try {const info=JSON.parse(output.split('\n')[0]);clearTimeout(timeout);resolve(info.url)} catch { /* wait for the full line */ }
    })
    runtime.once('exit',code=>{clearTimeout(timeout);reject(Error('Runtime local encerrou '+code+' '+error.slice(-1500)))})
  })
  const info=await fetch(endpoint+'/__finance/info').then(r=>r.json())
  browser=await chromium.launch({headless:true,...(process.env.FIN_CHROMIUM?{executablePath:process.env.FIN_CHROMIUM}:{})})
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:'pt-BR',deviceScaleFactor:1,acceptDownloads:true})
  await context.route('**/*',route=>new URL(route.request().url()).origin===endpoint?route.continue():route.abort())
  await context.exposeBinding('__financeRpc',async(_source,body)=>{
    const response=await fetch(endpoint+'/__finance/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const result=await response.json()
    if(body.name==='FinancialExecute'&&loseAck){loseAck=false;throw Error('Transporte sintético perdeu o ACK após commit')}
    return result
  })
  await context.addInitScript(profile=>{
    window.__ecRuntime=profile
    let qa
    Object.defineProperty(window,'__insightpadQa',{configurable:true,get:()=>qa,set(value){
      qa=value
      qa.state.ecHarness=async(name,variables)=>{
        const result=await window.__financeRpc({name,variables})
        if(result.errors?.length)throw Error(result.errors.map(e=>e.message).join('; '))
        return {data:result.data}
      }
    }})
  },info)
  page=await context.newPage()
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const go=async(path,theme='dark')=>{
    await page.goto(endpoint+'/qa/application.html?qa-ec#'+path)
    await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme)
    await page.reload()
    await page.locator('.qa-controls').evaluate(element=>element.style.display='none')
    await page.locator('[data-finance-ui] h1').waitFor()
    await page.getByText('Carregando informações financeiras…').waitFor({state:'hidden'})
    const alerts=await page.locator('[data-finance-ui] [role="alert"]').allTextContents()
    assert.deepEqual(alerts,[])
  }
  for(const theme of ['dark','light']){
    for(const [width,height] of [[1440,900],[390,844]]){
      await page.setViewportSize({width,height})
      await go('/financeiro/contas-a-receber',theme)
      await page.getByText('Título sintético',{exact:true}).waitFor()
      const {bodyWidth,viewWidth,zoom,scale}=await page.evaluate(()=>({
        bodyWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,
        zoom:getComputedStyle(document.querySelector('[data-finance-ui]')).zoom,scale:visualViewport.scale,
      }))
      assert.ok(bodyWidth<=viewWidth+1,JSON.stringify({bodyWidth,viewWidth}))
      assert.equal(zoom,'1');assert.equal(scale,1)
      const filter=page.getByRole('button',{name:'Filtros',exact:true})
      await filter.focus();await page.keyboard.press('Enter')
      await page.getByRole('dialog',{name:'Filtros financeiros'}).waitFor()
      await page.keyboard.press('Escape')
      await page.getByRole('dialog',{name:'Filtros financeiros'}).waitFor({state:'hidden'})
      assert.equal(await filter.evaluate(el=>el===document.activeElement),true)
      await page.screenshot({path:out+'/'+theme+'-'+width+'-receber.png'})
      report.cases.push({theme,width,height,focusRestored:true,zoom,scale})
    }
  }
  await page.setViewportSize({width:1440,height:900})
  const destinations=['visao','contas-a-pagar','contas-e-movimentacoes','conciliacao','fluxo-de-caixa','relatorios-e-fechamento','configuracoes']
  for(const destination of destinations)await go('/financeiro/'+destination)
  report.cases.push({routes:8})
  await go('/financeiro/contas-a-receber')
  await page.getByRole('button',{name:'Receber',exact:true}).click()
  const dialog=page.getByRole('dialog',{name:'Registrar recebimento',exact:true})
  await dialog.getByLabel('Conta',{exact:true}).selectOption(info.accountId)
  await dialog.getByLabel('Meio de pagamento',{exact:true}).selectOption(info.ids.method)
  await dialog.getByRole('button',{name:'Revisar',exact:true}).click()
  await dialog.getByRole('button',{name:'Confirmar lançamento',exact:true}).waitFor()
  loseAck=true
  await dialog.getByRole('button',{name:'Confirmar lançamento',exact:true}).click()
  await dialog.getByRole('button',{name:'Consultar resultado',exact:true}).waitFor()
  await page.reload()
  await page.getByRole('button',{name:'Consultar referência',exact:true}).click()
  const recovery=page.getByRole('dialog',{name:'Recuperar operação',exact:true})
  await recovery.getByRole('button',{name:'Consultar resultado',exact:true}).click()
  await recovery.getByText('Operação confirmada.',{exact:true}).waitFor()
  await recovery.getByRole('button',{name:'Fechar',exact:true}).last().click()
  await page.getByRole('button',{name:'Recebidas',exact:true}).click()
  await page.getByText('Título sintético',{exact:true}).waitFor()
  const downloaded=page.waitForEvent('download')
  await page.getByRole('button',{name:'Exportar CSV',exact:true}).click()
  assert.match((await downloaded).suggestedFilename(),/\.csv$/)
  const persisted=await fetch(endpoint+'/__finance/stats').then(r=>r.json())
  assert.deepEqual(persisted,{settlements:1,residualCents:'0',movementCents:'12345'})
  assert.deepEqual(errors,[])
  report.cases.push({ackLost:true,reloaded:true,persisted,csv:true})
  report.passed=true
} catch(error) {
  report.passed=false
  report.error=String(error.stack??error)
  await page?.screenshot({path:out+'/failure.png'}).catch(()=>{})
  throw error
} finally {
  await browser?.close()
  runtime.kill('SIGINT')
  writeFileSync(out+'/results.json',JSON.stringify(report,null,2)+'\n')
}
