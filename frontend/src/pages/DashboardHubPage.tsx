import {AnalysisDetails} from '../components/dashboard-v3/AnalysisDetails';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { useDashboardExport } from '../utils/dashboardAuthorization';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../theme/theme-context';
import {DashboardSurface} from '../components/dashboard-v3/DashboardSurface';
import {buildStockModel,buildCustomerModel,buildCategoryModel} from '../components/dashboard-v3/adapters';
import {StockPrintView,CustomerPrintView,CategoryPrintView} from '../components/dashboard-v3/DashboardPrintReport';
import {dashboardViews,waitingModel,type DashboardViewProps} from '../components/dashboard-v3/integration';
import { downloadDashboardCsv } from '../utils/dashboardExport';
import { useCallback, useEffect, useRef, useState } from "react";
import { executeQuery, getDataConnect, queryRef } from "firebase/data-connect";
import { connectorConfig } from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import {
  AppLoading,
  AppToast,
  DateRangePicker,
  type Notice,
} from "../components/SalesUi";
import { DailyProfitDashboardPage } from "./DailyProfitDashboardPage";
import { ChannelDashboardPage } from "./ChannelDashboardPage";
type View = "sales" | "channels" | "stock" | "customers" | "categories";
type Stock = {
  cards: Record<string, string | number>;
  monthly: Array<Record<string, string | number>>;
  products: Array<Record<string, string | number>>;
};
type Customer = {
  cards: Record<string, string | number>;
  abc: Array<Record<string, string | number | null>>;
  regions: Array<Record<string, string | number>>;
  birthdays: Array<Record<string, string | null>>;
  dormant: Array<Record<string, string | number | null>>;
};
type Category = {
  id: string;
  name: string;
  level: string;
  quantity: number;
  revenueCents: string;
  costCents: string;
  profitCents: string;
  marginPercent: number;
  growthPercent: number;
};
type Data = { stock: Stock; customers: Customer; categories: Category[] };
const dc = getDataConnect(firebaseApp, connectorConfig),
  iso = (d: Date) => d.toISOString().slice(0, 10);
export function DashboardHubPage() {
  const [view,setView]=useState<View>('sales');
  return <section className="dashboard-hub"><div className="dashboard-hub__content">
    {view==='sales'?<DailyProfitDashboardPage key={view} onViewChange={setView}/>:view==='channels'?<ChannelDashboardPage key={view} onViewChange={setView}/>:<Operational key={view} view={view} onViewChange={setView}/>}
  </div></section>;
}
function Operational({view,onViewChange}:DashboardViewProps&{view:Exclude<View,"sales"|"channels">}) {
  const navigate=useNavigate(),{theme}=useTheme();
  const [info,setInfo]=useState(false),[visualReset,setVisualReset]=useState(0),[generatedAt,setGeneratedAt]=useState<Date|null>(null);
  useDialogAccessibility(info,()=>setInfo(false));
  const canExport=useDashboardExport();
  const now = new Date(),
    start = new Date(now.getFullYear(), now.getMonth(), 1),
    [from, setFrom] = useState(iso(start)),
    [to, setTo] = useState(iso(now)),
    [draft, setDraft] = useState({ from: iso(start), to: iso(now) }),
    [filter, setFilter] = useState(false),
    [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState<Notice | null>(null);
  useDialogAccessibility(filter,()=>setFilter(false));
  const sequence=useRef(0);
  const load = useCallback(async () => {
    const request=++sequence.current;
    setBusy(true);
    try {
      const r = await executeQuery(
          queryRef(dc, "OperationalAnalyticsDashboard", {
            from,
            to,
            filters: {},
            requestKey: crypto.randomUUID(),
          }),
        ),
        box = ((r.data as { _select?: Array<{ data?: Data }> })._select ??
          [])[0]?.data;
      if (!box) throw new Error();
      if(request!==sequence.current)return;setData(box);setGeneratedAt(new Date());
    } catch (e) {
      if(request!==sequence.current)return;console.error(e);
      setNotice({
        type: "error",
        text: "Não foi possível calcular este painel.",
      });
    } finally {
      if(request===sequence.current)setBusy(false);
    }
  }, [from, to]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  function clear(){setFrom(iso(start));setTo(iso(now));setDraft({from:iso(start),to:iso(now)});setVisualReset(value=>value+1)}
  const model=!data?waitingModel(view):view==='stock'?buildStockModel(data.stock):view==='customers'?buildCustomerModel(data.customers):buildCategoryModel(data.categories);
  const printReport=!data?null:<section className="catalog-page analytics-page"><header className="finance-heading"><div><h1>{model.title}</h1><p>{new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} — {new Date(`${to}T12:00:00`).toLocaleDateString("pt-BR")} · Atualizado em {generatedAt?.toLocaleString('pt-BR')??'—'}</p></div></header>{view==='stock'?<StockPrintView data={data.stock}/>:view==='customers'?<CustomerPrintView data={data.customers}/>:<CategoryPrintView data={data.categories}/>}</section>;
  return <section className="catalog-page analytics-page dashboard-v3-controller" data-theme={theme}>
    <DashboardSurface model={model} view={view} views={dashboardViews} theme={theme} busy={busy} canExport={canExport&&!!data} filterResetToken={visualReset}
      actions={{onViewChange,onBack:()=>navigate('/modulos/dashboards'),onClear:clear,onDetails:()=>setInfo(true),onFilters:()=>{setDraft({from,to});setFilter(true)},onPrint:()=>{if(canExport&&data&&!busy)window.print()},
        onExportTable:(id,ordered)=>{if(!canExport||!data||busy)return;const panel=model.pages.flatMap(page=>page.panels).find(item=>item.id===id);if(panel?.kind!=='table')return;const byId=new Map(panel.rows.map(row=>[row.id,row]));const rows=ordered.flatMap(key=>{const row=byId.get(key);return row?[row.csv??row.cells.map(cell=>cell.text)]:[]});if(rows.length)downloadDashboardCsv(panel.title,panel.columns.map(column=>column.label),rows)}}}
      selectionSummary="Todos os filtros do período aplicado"
      emptySlot={!data&&!busy?<p role="status">Os indicadores ainda não estão disponíveis para esta consulta.</p>:undefined} printSlot={printReport}/>
    <AppToast notice={notice} onClose={()=>setNotice(null)}/>
      {filter && (
        <div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}>
          <section className="catalog-modal finance-filter-modal dashboard-v3-modal" role="dialog" aria-modal="true" aria-label="Período de análise">
            <header>
              <div>
                <span className="eyebrow">PESQUISA</span>
                <h2>PERÍODO DE ANÁLISE</h2>
              </div>
              <button aria-label="Fechar período" onClick={() => setFilter(false)}>×</button>
            </header>
            <div className="finance-filter-grid">
              <DateRangePicker
                from={draft.from}
                to={draft.to}
                onChange={(a, b) => setDraft({ from: a, to: b })}
              />
            </div>
            <footer>
              <button
                className="catalog-modal-cancel"
                onClick={() => setFilter(false)}
              >
                Cancelar
              </button>
              <button
                className="catalog-primary"
                onClick={() => {
                  setFrom(draft.from);
                  setTo(draft.to || draft.from);
                  setFilter(false);
                }}
              >
                Aplicar
              </button>
            </footer>
          </section>
        </div>
      )}
    {info&&<div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}><AnalysisDetails onClose={()=>setInfo(false)}>
      <p><strong>Período aplicado:</strong> {from} — {to}</p><p><strong>Atualizado em:</strong> {generatedAt?.toLocaleString('pt-BR')??'—'}</p>
      {view==='stock'?<><p>Saldo: movimentação no período, não posição atual de estoque.</p><p>Lucro mantém o indicador recebido do sistema para as saídas por venda.</p></>:view==='customers'?<><p>A Curva ABC usa as classes recebidas do sistema. Selecionar A, B ou C filtra somente essa tabela e seu CSV; os indicadores gerais permanecem iguais.</p><p>Frequência: compras por cliente, conforme o cálculo do sistema.</p></>:<p>Categorias e subcategorias são níveis do mesmo faturamento e não são somados como receitas independentes. Margem, crescimento e líderes mantêm os valores e a ordem recebidos.</p>}
    </AnalysisDetails></div>}
    {busy&&<AppLoading text="Calculando indicadores..."/>}
  </section>;
}
export type {Stock,Customer,Category};
