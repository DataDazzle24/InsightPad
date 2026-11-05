import {AnalysisDetails} from '../components/dashboard-v3/AnalysisDetails';
import { useDashboardExport } from '../utils/dashboardAuthorization';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../theme/theme-context';
import {DashboardSurface} from '../components/dashboard-v3/DashboardSurface';
import {buildChannelModel} from '../components/dashboard-v3/adapters';
import {ChannelPrintReport} from '../components/dashboard-v3/DashboardPrintReport';
import {dashboardViews,waitingModel,type DashboardViewProps} from '../components/dashboard-v3/integration';
import { downloadDashboardCsv } from '../utils/dashboardExport';
import { useCallback, useEffect, useState } from "react";
import { executeQuery, getDataConnect, queryRef } from "firebase/data-connect";
import { connectorConfig } from "@insightpad/dataconnect";
import { AppLoading, AppToast, DateRangePicker, type Notice } from "../components/SalesUi";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";

type Option = { id: string; name: string; provider?: string; branchId?: string; branchName?: string };
type Row = Record<string, string | number | null | undefined>;
type ChannelDashboardData = {
  options: { branches: Option[]; connections: Option[] };
  cards: Record<string, string | number>;
  daily: Row[];
  byChannel: Row[];
  fees: Row[];
  payments: Row[];
  topProducts: Row[];
};

const dc = getDataConnect(firebaseApp, connectorConfig);
const iso = (value: Date) => value.toISOString().slice(0, 10);
const periodLabel = (from: string, to: string) => `${new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} — ${new Date(`${to}T12:00:00`).toLocaleDateString("pt-BR")}`;
function box<T>(value: unknown): T | undefined { return ((value as { data?: { _select?: Array<{ data?: T }> } }).data?._select ?? [])[0]?.data; }

export function ChannelDashboardPage({onViewChange}:DashboardViewProps) {
  const navigate=useNavigate(),{theme}=useTheme();
  const [info,setInfo]=useState(false),[visualReset,setVisualReset]=useState(0),[generatedAt,setGeneratedAt]=useState<Date|null>(null);
  useDialogAccessibility(info,()=>setInfo(false));
  const canExport=useDashboardExport();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(iso(start));
  const [to, setTo] = useState(iso(now));
  const [branchId, setBranchId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [draft, setDraft] = useState({ from: iso(start), to: iso(now), branchId: "", connectionId: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<ChannelDashboardData | null>(null);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  useDialogAccessibility(filterOpen, () => setFilterOpen(false));

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const rangeDays = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
      if (!Number.isFinite(rangeDays) || rangeDays < 0 || rangeDays > 366) throw new Error("CHANNEL_DASHBOARD_RANGE");
      const result = await executeQuery(queryRef(dc, "SalesChannelAnalyticsDashboard", {
        from, to, filters: { branchId, connectionId }, requestKey: crypto.randomUUID(),
      }));
      const next = box<ChannelDashboardData>(result);
      if (!next) throw new Error("Painel sem dados");
      setData(next);setGeneratedAt(new Date());
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: error instanceof Error && error.message === "CHANNEL_DASHBOARD_RANGE" ? "Escolha um período válido de até 367 dias." : "Não foi possível calcular os indicadores dos canais." });
    } finally { setBusy(false); }
  }, [branchId, connectionId, from, to]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  function clear(){setFrom(iso(start));setTo(iso(now));setBranchId('');setConnectionId('');setDraft({from:iso(start),to:iso(now),branchId:'',connectionId:''});setVisualReset(value=>value+1)}
  const model=data?buildChannelModel(data):waitingModel('channels');
  return <section className="catalog-page analytics-page channel-dashboard dashboard-v3-controller" data-theme={theme}>
    <DashboardSurface model={model} view="channels" views={dashboardViews} theme={theme} busy={busy} canExport={canExport&&!!data} filterResetToken={visualReset}
      actions={{onViewChange,onBack:()=>navigate('/modulos/dashboards'),onClear:clear,onRefresh:()=>void load(),onDetails:()=>setInfo(true),onFilters:()=>{setDraft({from,to,branchId,connectionId});setFilterOpen(true)},onPrint:()=>{if(canExport&&data&&!busy)window.print()},
        onExportTable:(id,ordered)=>{if(!canExport||!data||busy)return;const panel=model.pages.flatMap(page=>page.panels).find(item=>item.id===id);if(panel?.kind!=='table')return;const byId=new Map(panel.rows.map(row=>[row.id,row]));const rows=ordered.flatMap(key=>{const row=byId.get(key);return row?[row.csv??row.cells.map(cell=>cell.text)]:[]});if(rows.length)downloadDashboardCsv(panel.title,panel.columns.map(column=>column.label),rows)}}}
      selectionSummary="Filtros de filial e conexão aplicados à consulta"
      emptySlot={!data&&!busy?<p role="status">Os indicadores ainda não estão disponíveis para esta consulta.</p>:undefined} printSlot={data?<ChannelPrintReport data={data} from={from} to={to}/>:null}/>
    <AppToast notice={notice} onClose={()=>setNotice(null)}/>
    {filterOpen && <div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}><section className="catalog-modal finance-filter-modal dashboard-v3-modal" role="dialog" aria-modal="true" aria-label="Filtros do dashboard de canais"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros dos canais</h2></div><button onClick={() => setFilterOpen(false)} aria-label="Fechar">×</button></header><div className="finance-filter-grid"><DateRangePicker from={draft.from} to={draft.to} onChange={(nextFrom, nextTo) => setDraft({ ...draft, from: nextFrom, to: nextTo })} /><label><span>Filial</span><select value={draft.branchId} onChange={(event) => setDraft({ ...draft, branchId: event.target.value, connectionId: "" })}><option value="">Todas as filiais</option>{data?.options.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Loja / conexão</span><select value={draft.connectionId} onChange={(event) => setDraft({ ...draft, connectionId: event.target.value })}><option value="">Todas as lojas</option>{data?.options.connections.filter((item) => !draft.branchId || item.branchId === draft.branchId).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.branchName}</option>)}</select></label></div><footer><button className="catalog-modal-cancel" onClick={() => setFilterOpen(false)}>Cancelar</button><button className="catalog-primary" onClick={() => { setFrom(draft.from); setTo(draft.to || draft.from); setBranchId(draft.branchId); setConnectionId(draft.connectionId); setFilterOpen(false); }}>Aplicar</button></footer></section></div>}
    {info&&<div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}><AnalysisDetails onClose={()=>setInfo(false)}>
      <p><strong>Período aplicado:</strong> {periodLabel(from,to)}</p><p><strong>Filial:</strong> {data?.options.branches.find(item=>item.id===branchId)?.name??'Todas as filiais'}</p><p><strong>Loja / conexão:</strong> {data?.options.connections.find(item=>item.id===connectionId)?.name??'Todas as lojas'}</p><p><strong>Atualizado em:</strong> {generatedAt?.toLocaleString('pt-BR')??'—'}</p>
      <p>Venda contabilizada, subsídio do parceiro, desconto da loja, taxas, outros ajustes, repasse e resultado mantêm os valores recebidos do sistema. O resultado após canal usa o custo registrado e não representa lucro líquido contábil.</p><p>Taxas: somente lançamentos financeiros confirmados. O repasse identifica vendas ainda com valor estimado. O período continua limitado a 367 dias, com uma filial e uma conexão por filtro.</p>
    </AnalysisDetails></div>}
    {busy&&<AppLoading text="Calculando canais..."/>}
  </section>;
}
export type {ChannelDashboardData};
