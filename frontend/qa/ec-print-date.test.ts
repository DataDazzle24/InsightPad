import {afterEach,expect,it,vi} from 'vitest'
import {inspectFixtures,qaOperation,qaState,useFinePrintFixtures} from './api'

afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs()})
for(const [instant,day]of [
 ['2026-11-19T02:30:00Z','2026-11-18'],
 ['2026-11-19T03:00:00Z','2026-11-19'],
 ['2026-12-01T02:30:00Z','2026-11-30'],
 ['2026-12-01T03:00:00Z','2026-12-01'],
])it(`keeps all 65 PDF stress products in the local dashboard range at ${instant}`,async()=>{
 vi.stubEnv('TZ','America/Sao_Paulo');vi.useFakeTimers();vi.setSystemTime(new Date(instant));
 qaState.empty=false;qaState.fail=false;qaState.delay=0;qaState.allowedBranches=[];
 useFinePrintFixtures();
 const rows=inspectFixtures().ledger;
 expect(rows).toHaveLength(65);expect(new Set(rows.map(row=>row.date))).toEqual(new Set([day]));
 const result=await qaOperation('FinancialIndicatorsDashboard',{from:day.slice(0,7)+'-01',to:day});
 const data=(result.data as {_select:Array<{data:{products:Array<{name:string}>}}>})._select[0]!.data;
 expect(data.products).toHaveLength(65);
 expect(new Set(data.products.map(row=>row.name.match(/PRODUTO SINTÉTICO (\d{3})/)?.[1]))).toEqual(new Set(Array.from({length:65},(_,i)=>String(i+1).padStart(3,'0'))));
})
