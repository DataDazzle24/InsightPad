// @vitest-environment jsdom
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {SalesPrintReport,AnalysisReport,CustomerPrintView} from './DashboardPrintReport';
import type {FinancialDashboardData,FinancialProduct} from '../../pages/DailyProfitDashboardPage';
import type {Customer} from '../../pages/DashboardHubPage';
const product=(id:string,revenue:string,profit:string):FinancialProduct=>({id,name:`PRODUTO SINTÉTICO ${id}`,category:id==='1'?'Categoria B':'Categoria A',subcategory:'Subcategoria',quantity:1,revenueCents:revenue,providerFeeCents:'0',netRevenueCents:revenue,costCents:(BigInt(revenue)-BigInt(profit)).toString(),grossProfitCents:profit,profitCents:profit,marginPercent:0,lineCount:1});
it('DB08/09 retains every operational row and exact Int64 totals and category subtotals',()=>{
 const products=[product('1','9007199254740993','-1'),product('2','102','100')];
 const data:FinancialDashboardData={options:{branches:[],products:[],categories:[],subcategories:[],suppliers:[],sources:[]},cards:{volume:2,revenueCents:'9007199254741095',providerFeeCents:'0',netRevenueCents:'9007199254741095',costCents:'9007199254740996',grossProfitCents:'99',profitCents:'99',marginPercent:0,ticketCents:'1',financialPendingSales:0},monthly:{lastVolume:0,averageVolume:0,volumeGrowth:0,lastProfitCents:'0',averageProfitCents:'0',profitGrowth:0,months:0},daily:[],products};
 const document=new DOMParser().parseFromString(renderToStaticMarkup(<SalesPrintReport data={data} products={products} series={[]} metrics={['revenue','profit']} group="day" sort="revenueCents" from="2026-11-01" to="2026-11-16" summary="Todas as filiais"/>),'text/html');
 const reports=[...document.querySelectorAll('article')],detail=reports.find(article=>article.textContent?.includes('Receita, custo e rentabilidade'))!;
 expect(detail.querySelectorAll('tbody tr')).toHaveLength(2);expect(detail.querySelectorAll('th')).toHaveLength(18);expect(detail.querySelector('tfoot')?.textContent).toContain('R$ 90.071.992.547.410,95');
 for(const p of products)expect(detail.textContent).toContain(p.name);
 const category=reports.find(article=>article.textContent?.includes('Comparação por categoria'))!;expect(category.querySelectorAll('tbody tr')).toHaveLength(2);expect(category.textContent).toContain('−R$ 0,01');
 expect(document.body.textContent).toContain('Fim do relatório');expect(document.querySelector('.ip-report-summary')?.textContent).toContain('Todas as filiais');
});
it('DB08 keeps all long customer lists and explicitly explains the local ABC/CSV scope',()=>{
 const data:Customer={cards:{},abc:[],regions:[],birthdays:Array.from({length:51},(_,i)=>({name:'ANIVERSARIANTE '+i,birthDate:'2000-01-01'})),dormant:Array.from({length:1201},(_,i)=>({name:'SEM COMPRAR '+i,lastPurchase:null,revenueCents:'0'}))};
 const markup=renderToStaticMarkup(<AnalysisReport title="Clientes" from="2026-11-01" to="2026-11-16" summary="Todos os clientes"><CustomerPrintView data={data}/></AnalysisReport>),document=new DOMParser().parseFromString(markup,'text/html');
 const rows=[...document.querySelectorAll('tbody tr')];expect(rows.filter(row=>row.textContent?.startsWith('ANIVERSARIANTE '))).toHaveLength(51);expect(rows.filter(row=>row.textContent?.startsWith('SEM COMPRAR '))).toHaveLength(1201);expect(markup).toContain('SEM COMPRAR 1200');expect(document.body.textContent).toContain('o PDF mantém o detalhamento completo do recorte');
});
