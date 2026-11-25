import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs'

export const financeBase='dcb03f18a49bf267eb44a8fecbebeea641c9984a'
const policy=JSON.parse(readFileSync('scripts/reconciliation-scope.json','utf8'))
export const financePaths=new Set(Object.entries(policy.paths)
  .filter(([,value])=>value.ids.includes('FINANCEIRO-20261125')).map(([path])=>path))
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim()
const operation=/^(?:mutation|query) Financial(?:Prepare|Execute|Read)\b[\s\S]*?^}\s*/gm
export const stripFinancialOperations=source=>source.replace(operation,'').trim()

export function verifyFinanceiro() {
  git('merge-base','--is-ancestor',financeBase,'HEAD')
  const paths=[...git('diff','--name-only',financeBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean)
  for(const path of paths)assert.ok(financePaths.has(path),'Financeiro alterou caminho fora do escopo: '+path)
  for(const [path,names] of [
    ['dataconnect/app/queries.gql',['FinancialRead']],
    ['dataconnect/app/mutations.gql',['FinancialPrepare','FinancialExecute']],
  ]) {
    const source=readFileSync(path,'utf8')
    assert.equal(stripFinancialOperations(source),git('show',financeBase+':'+path),'Contrato legado alterado: '+path)
    const additions=[...source.matchAll(operation)].map(m=>m[0])
    assert.equal(additions.length,names.length)
    for(const name of names)assert.ok(additions.some(added=>added.includes(name+'(')&&added.includes('@auth(level: USER)')))
  }
  for(const path of paths.filter(p=>/^dataconnect\/migrations\/20261125-fin-.+\.sql$/.test(p))) {
    const sql=readFileSync(path,'utf8').replace(/^--.*$/gm,'')
    assert.doesNotMatch(sql,/\b(?:TRUNCATE|DELETE\s+FROM|DROP\s+(?:TABLE|SCHEMA)|INSERT\s+INTO\s+(?:role|user)_page_permissions)\b/i,path)
    assert.doesNotMatch(sql,/\bSECURITY\s+DEFINER\b/i,path)
  }
  const styles=postcss.parse(readFileSync('frontend/src/financeiro/styles.css','utf8'))
  styles.walkRules(rule=>{
    if(rule.parent?.type==='atrule'&&rule.parent.name==='keyframes')return
    for(const selector of postcss.list.comma(rule.selector))
      assert.match(selector,/^\[data-finance-ui\]/,'Seletor fora do Financeiro')
  })
  console.log('Escopo Financeiro verificado. Contratos P59, permissões legadas e escopo visual preservados.')
}
if (process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) verifyFinanceiro()
