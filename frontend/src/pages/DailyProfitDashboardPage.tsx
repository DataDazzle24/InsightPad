import {AnalysisDetails} from '../components/dashboard-v3/AnalysisDetails';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { useDashboardExport } from '../utils/dashboardAuthorization';
import { useNavigate } from 'react-router-dom';
import {useTheme} from '../theme/theme-context';
import {DashboardSurface} from '../components/dashboard-v3/DashboardSurface';
import {buildSalesModel} from '../components/dashboard-v3/adapters';
import {compareRaw} from '../components/dashboard-v3/geometry';
import {SalesPrintReport} from '../components/dashboard-v3/DashboardPrintReport';
import {dashboardViews,waitingModel,type DashboardViewProps} from '../components/dashboard-v3/integration';
import { financialCsv } from '../utils/dashboardExport';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  financialIndicatorsDashboard,
} from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import {
  AppLoading,
  AppToast,
  DateRangePicker,
  SearchableMultiSelect,
  type Notice,
  type SelectOption,
} from "../components/SalesUi";
import { aggregateFinancialDays } from "../utils/stock";
type Option = { id: string; name: string };
type Filters = {
  branches: string[];
  products: string[];
  categories: string[];
  subcategories: string[];
  suppliers: string[];
  sources: string[];
};
type Cards = {
  volume: number;
  revenueCents: string;
  providerFeeCents: string;
  netRevenueCents: string;
  costCents: string;
  grossProfitCents: string;
  profitCents: string;
  marginPercent: number;
  ticketCents: string;
  financialPendingSales: number;
};
type Monthly = {
  lastVolume: number;
  averageVolume: number;
  volumeGrowth: number;
  lastProfitCents: string;
  averageProfitCents: string;
  profitGrowth: number;
  months: number;
};
type Day = {
  date: string;
  volume: number;
  revenueCents: string;
  providerFeeCents: string;
  netRevenueCents: string;
  profitCents: string;
};
type Product = {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  quantity: number;
  revenueCents: string;
  providerFeeCents: string;
  netRevenueCents: string;
  costCents: string;
  grossProfitCents: string;
  profitCents: string;
  marginPercent: number;
  lineCount: number;
};
type Data = {
  options: Record<keyof Filters, Option[]>;
  cards: Cards;
  monthly: Monthly;
  daily: Day[];
  products: Product[];
};
const dc = getDataConnect(firebaseApp, connectorConfig),
  iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  blank: Filters = {
    branches: [],
    products: [],
    categories: [],
    subcategories: [],
    suppliers: [],
    sources: [],
  },
  opts = (items: Option[] = []): SelectOption[] =>
    items.map((i) => ({ value: i.id, label: i.name }));
export function DailyProfitDashboardPage({onViewChange}:DashboardViewProps) {
  const navigate=useNavigate(),{theme}=useTheme();
  const [visualReset,setVisualReset]=useState(0),[generatedAt,setGeneratedAt]=useState<Date|null>(null);
  const canExport=useDashboardExport();
  const today = new Date(),
    initial = new Date(today.getFullYear(), today.getMonth(), 1),
    [from, setFrom] = useState(iso(initial)),
    [to, setTo] = useState(iso(today)),
    [filters, setFilters] = useState<Filters>(blank),
    [draft, setDraft] = useState<Filters>(blank),
    [range, setRange] = useState({ from: iso(initial), to: iso(today) }),
    [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState<Notice | null>(null),
    [filterOpen, setFilterOpen] = useState(false),
    [info, setInfo] = useState(false),
    [group, setGroup] = useState<"day" | "month" | "year">("day"),
    [metrics, setMetrics] = useState<Array<"volume" | "revenue" | "profit">>([
      "revenue",
      "profit",
    ]),
    [sort, setSort] = useState<keyof Product>("revenueCents"),
    [selected, setSelected] = useState(false);
  useDialogAccessibility(filterOpen,()=>setFilterOpen(false));
  useDialogAccessibility(info,()=>setInfo(false));
  const sequence=useRef(0);
  const load = useCallback(async () => {
    const request=++sequence.current;
    setBusy(true);
    try {
      const result = await financialIndicatorsDashboard(dc, {
          from,
          to,
          filters,
          requestKey: crypto.randomUUID(),
        }),
        box = ((result.data._select ?? [])[0] as { data?: Data } | undefined)
          ?.data;
      if (!box) throw new Error();
      if(request!==sequence.current)return;setData(box);setGeneratedAt(new Date());
    } catch (error) {
      if(request!==sequence.current)return;console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível calcular os indicadores financeiros.",
      });
    } finally {
      if(request===sequence.current)setBusy(false);
    }
  }, [from, to, filters]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const series = useMemo(
      () => aggregateFinancialDays(data?.daily ?? [], group),
      [data, group],
    ),
    products = useMemo(
      () =>
        [...(data?.products ?? [])].sort(
          (a, b) => compareRaw(b[sort], a[sort]),
        ),
      [data, sort],
    );
  function toggle(metric: "volume" | "revenue" | "profit") {
    setMetrics((v) =>
      v.includes(metric)
        ? v.length === 1
          ? v
          : v.filter((i) => i !== metric)
        : [...v, metric],
    );
  }
  function apply() {
    setFilters(draft);
    setFrom(range.from);
    setTo(range.to || range.from);
    setFilterOpen(false);
    setSelected(false);
  }
  function clear() {
    setVisualReset(value=>value+1);
    const fresh = { from: iso(initial), to: iso(today) };
    setDraft(blank);
    setFilters(blank);
    setRange(fresh);
    setFrom(fresh.from);
    setTo(fresh.to);
    setSelected(false);
  }
  function choosePeriod(day: Day) {
    const start = day.date,
      end =
        group === "day"
          ? day.date
          : group==='year'?`${day.date.slice(0,4)}-12-31`:iso(
              new Date(
                Number(day.date.slice(0, 4)),
                Number(day.date.slice(5, 7)),
                0,
              ),
            );
    setFrom(start<from?from:start);
    setTo(end>to?to:end);
    setSelected(true);
  }
  function csv(rows:Product[] = products) {
    if(!canExport||!data||busy)return;
    const blob = new Blob([financialCsv(rows)],{type:'text/csv;charset=utf-8'}),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `indicadores-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const c = data?.cards;
  const filterSummary=Object.entries(filters).filter(([,ids])=>ids.length).map(([key,ids])=>ids.map(id=>data?.options[key as keyof Filters]?.find(option=>option.id===id)?.name??id).join(', ')).join(' · ')||'Todos os filtros';
  const groupControls=<div className="dv-segment" role="group" aria-label="Agrupar período">{(['day','month','year']as const).map((value,index)=><button type="button" key={value} aria-pressed={group===value} onClick={()=>setGroup(value)}>{['Dia','Mês','Ano'][index]}</button>)}</div>;
  const model=data?buildSalesModel(data,series,groupControls,{keys:metrics,onToggle:key=>{if(key==='volume'||key==='revenue'||key==='profit')toggle(key)}}):waitingModel('sales');
  const columns:Array<keyof Product>=['name','category','subcategory','quantity','revenueCents','providerFeeCents','netRevenueCents','costCents','profitCents','marginPercent'];
  const table=model.pages.flatMap(page=>page.panels).find(panel=>panel.id==='sales-products');
  if(table?.kind==='table')table.sorting={column:columns.indexOf(sort),onChange:index=>setSort(columns[index])};
  return <section className="finance-dashboard dashboard-v3-controller" data-theme={theme}>
    <DashboardSurface model={model} view="sales" views={dashboardViews} theme={theme} busy={busy} canExport={canExport&&!!data} filterResetToken={visualReset}
      actions={{onViewChange,onBack:()=>navigate('/modulos/dashboards'),onClear:clear,onDetails:()=>setInfo(true),onFilters:()=>{setDraft(filters);setRange({from,to});setFilterOpen(true)},onPrint:()=>{if(canExport&&data&&!busy)window.print()},
        onSelectPeriod:id=>{const day=series.find(item=>item.date===id);if(day)choosePeriod(day)},
        onSelectProduct:(id,{additive})=>{const ids=additive?(filters.products.includes(id)?filters.products.filter(value=>value!==id):[...filters.products,id]):[id];const next={...filters,products:ids};setFilters(next);setDraft(next)},
        onExportTable:(id,ordered)=>{if(!canExport||!data||busy||id!=='sales-products')return;const byId=new Map(data.products.map(row=>[row.id,row]));csv(ordered.flatMap(key=>{const row=byId.get(key);return row?[row]:[]}))}}}
      selectionSummary={<><span>{filterSummary}</span>      {selected && (
        <button
          className="period-chip"
          onClick={() => {
            setFrom(range.from);
            setTo(range.to);
            setSelected(false);
          }}
        >
          Período selecionado · remover ×
        </button>
      )}
</>}
      notice={c&&c.financialPendingSales>0?<p className="dv-provisional" role="status">Valores provisórios · {c.financialPendingSales} venda(s) aguardam conciliação. Consulte Detalhes da análise.</p>:undefined}
      emptySlot={!data&&!busy?<p role="status">Os indicadores ainda não estão disponíveis para esta consulta.</p>:undefined}
      printSlot={data?<SalesPrintReport data={data} products={products} series={series} metrics={metrics} group={group} sort={sort} from={from} to={to} summary={`${filterSummary} · Atualizado em ${generatedAt?.toLocaleString('pt-BR')??'—'}`}/>:null}/>
    <AppToast notice={notice} onClose={()=>setNotice(null)}/>
      {filterOpen && (
        <div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}>
          <section className="catalog-modal finance-filter-modal dashboard-v3-modal" role="dialog" aria-modal="true" aria-label="Filtros do dashboard financeiro">
            <header>
              <div>
                <span className="eyebrow">PESQUISA</span>
                <h2>FILTROS DO DASHBOARD</h2>
              </div>
              <button aria-label="Fechar filtros" onClick={() => setFilterOpen(false)}>×</button>
            </header>
            <div className="finance-filter-grid">
              <DateRangePicker
                from={range.from}
                to={range.to}
                onChange={(a, b) => setRange({ from: a, to: b })}
              />
              {data &&
                Object.entries(data.options).map(([key, items]) => (
                  <SearchableMultiSelect
                    key={key}
                    label={
                      (
                        {
                          branches: "Filiais",
                          products: "Produtos",
                          categories: "Categorias",
                          subcategories: "Subcategorias",
                          suppliers: "Fornecedores",
                          sources: "Origem da venda",
                        } as Record<string, string>
                      )[key]
                    }
                    options={opts(items)}
                    value={draft[key as keyof Filters]}
                    onChange={(value) =>
                      setDraft((v) => ({ ...v, [key]: value }))
                    }
                  />
                ))}
            </div>
            <footer>
              <button onClick={clear}>Limpar</button>
              <button
                className="catalog-modal-cancel"
                onClick={() => setFilterOpen(false)}
              >
                Cancelar
              </button>
              <button className="catalog-primary" onClick={apply}>
                Aplicar
              </button>
            </footer>
          </section>
        </div>
      )}
    {info&&<div className="catalog-backdrop dashboard-v3-modal-backdrop" data-theme={theme}><AnalysisDetails onClose={()=>setInfo(false)}>
      <p><strong>Período aplicado:</strong> {from} — {to}</p><p><strong>Filtros:</strong> {filterSummary}</p>
      <p><strong>Atualizado em:</strong> {generatedAt?.toLocaleString('pt-BR')??'—'}</p>
      <h3>Como os indicadores são calculados</h3>
            <p>
              <strong>Faturamento bruto:</strong> total das vendas concluídas
              elegíveis. <strong>Taxas iFood:</strong> comissões, tarifas e taxas
              com impacto no repasse, recebidas pela API financeira oficial. {" "}
              <strong>Repasse líquido:</strong> faturamento bruto − taxas. {" "}
              <strong>Custo:</strong> quantidade vendida × custo unitário
              registrado na venda. <strong>Lucro após taxas:</strong> faturamento
              bruto − taxas − custo. <strong>Margem:</strong> lucro após taxas ÷
              faturamento bruto × 100. <strong>Ticket médio:</strong> faturamento
              bruto ÷ vendas. Filtros por produto, categoria e fornecedor
              rateiam o total e as taxas da venda entre os itens, evitando
              duplicar o faturamento. Os comparativos usam até 12 meses fechados
              e respeitam todos os filtros selecionados.
            </p>

      <p>Cor: intensidade relativa da coluna; valores negativos em âmbar. Moeda e quantidade usam eixos separados.</p>
      {!!c?.financialPendingSales&&<p>{c.financialPendingSales} venda(s) do iFood ainda aguardam a conciliação oficial. Até lá, taxas e repasse aparecem como provisórios.</p>}
    </AnalysisDetails></div>}
    {busy&&<AppLoading text="Calculando indicadores financeiros..."/>}
  </section>;
}
export type {Data as FinancialDashboardData,Product as FinancialProduct,Day as FinancialDay};
