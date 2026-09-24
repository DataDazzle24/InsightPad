import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
const money = (value: unknown) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0) / 100);
const number = (value: unknown) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value ?? 0));
const periodLabel = (from: string, to: string) => `${new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} — ${new Date(`${to}T12:00:00`).toLocaleDateString("pt-BR")}`;
function box<T>(value: unknown): T | undefined { return ((value as { data?: { _select?: Array<{ data?: T }> } }).data?._select ?? [])[0]?.data; }

export function ChannelDashboardPage() {
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
      setData(next);
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: error instanceof Error && error.message === "CHANNEL_DASHBOARD_RANGE" ? "Escolha um período válido de até 367 dias." : "Não foi possível calcular os indicadores dos canais." });
    } finally { setBusy(false); }
  }, [branchId, connectionId, from, to]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const maxDaily = useMemo(() => Math.max(1, ...(data?.daily ?? []).map((item) => Math.max(Number(item.grossRevenueCents ?? 0), Number(item.netRevenueCents ?? 0)))), [data?.daily]);
  const cards = data?.cards ?? {};

  return <section className="catalog-page analytics-page channel-dashboard">
    <header className="finance-heading"><div><span className="eyebrow">Dashboard</span><h1>Canais de venda</h1><p>{periodLabel(from, to)}</p></div><div className="finance-actions"><button onClick={() => void load()} disabled={busy}><span className="material-symbols-rounded">refresh</span>Atualizar</button><button className="catalog-primary" onClick={() => { setDraft({ from, to, branchId, connectionId }); setFilterOpen(true); }}><span className="material-symbols-rounded">tune</span>Filtros</button></div></header>
    <AppToast notice={notice} onClose={() => setNotice(null)} />
    {data && <>
      <div className="finance-kpis analytics-kpis channel-dashboard__kpis">
        <Metric label="Pedidos recebidos" value={number(cards.orders)} detail={`${number(cards.cancelledOrders)} cancelado(s)`} />
        <Metric label="Vendas concluídas" value={number(cards.sales)} detail={`Ticket ${money(cards.averageTicketCents)}`} />
        <Metric label="Venda contabilizada" value={money(cards.grossRevenueCents)} detail={`Cliente pagou ${money(cards.customerPaidCents)}`} />
        <Metric label="Subsídio do parceiro" value={money(cards.partnerSubsidyCents)} detail="Descontos não custeados pela loja" tone="positive" />
        <Metric label="Desconto da loja" value={money(cards.merchantDiscountCents)} detail="Campanhas custeadas pelo estabelecimento" />
        <Metric label="Taxas do canal" value={money(cards.providerFeeCents)} detail="Somente lançamentos financeiros confirmados" tone="negative" />
        <Metric label="Outros ajustes" value={money(cards.financialAdjustmentsCents)} detail="Créditos e débitos além das taxas identificadas" />
        <Metric label="Repasse líquido" value={money(cards.netRevenueCents)} detail={`${number(cards.financialPendingSales)} venda(s) ainda com valor estimado`} />
        <Metric label="Resultado após canal" value={money(cards.profitCents)} detail={`Custo registrado ${money(cards.costCents)}`} tone={Number(cards.profitCents ?? 0) < 0 ? "negative" : "positive"} />
      </div>
      <article className="finance-chart-card channel-dashboard__chart"><header><div><span>Evolução diária</span><strong>Venda contabilizada e repasse líquido</strong></div></header><div className="finance-chart analytics-chart">{data.daily.map((item) => <div key={String(item.date)} title={`${String(item.date)} · ${money(item.grossRevenueCents)} · líquido ${money(item.netRevenueCents)}`}><span className="chart-bars"><i className="revenue" style={{ height: `${Math.max(2, Number(item.grossRevenueCents ?? 0) * 100 / maxDaily)}%` }} /><i className="profit" style={{ height: `${Math.max(2, Number(item.netRevenueCents ?? 0) * 100 / maxDaily)}%` }} /></span><small>{new Date(`${String(item.date).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</small></div>)}</div></article>
      <div className="analytics-grid channel-dashboard__grid">
        <DashboardTable title="Resultado por loja" columns={["Loja", "Pedidos", "Vendas", "Venda", "Taxas", "Outros ajustes", "Repasse", "Resultado"]} rows={data.byChannel.map((row) => [<><strong>{String(row.name ?? "—")}</strong><small>{String(row.branchName ?? "")}</small></>, number(row.orders), number(row.sales), money(row.grossRevenueCents), money(row.providerFeeCents), money(row.financialAdjustmentsCents), money(row.netRevenueCents), money(row.profitCents)])} />
        <DashboardTable title="Taxas confirmadas pelo iFood" columns={["Lançamento", "Ocorrências", "Valor"]} rows={data.fees.map((row) => [<><strong>{String(row.description ?? row.name ?? "—")}</strong><small>{String(row.name ?? "")}</small></>, number(row.entries), money(row.amountCents)])} empty="Nenhuma taxa financeira confirmada no período." />
        <DashboardTable title="Formas de pagamento" columns={["Forma", "Pedidos", "Valor"]} rows={data.payments.map((row) => [<><strong>{String(row.method ?? "Não informada")}</strong><small>{[row.paymentType, row.cardBrand, row.walletName].filter(Boolean).join(" · ")}</small></>, number(row.orders), money(row.amountCents)])} empty="Nenhum pagamento recebido no período." />
        <DashboardTable title="Produtos mais vendidos nos canais" columns={["Produto", "Quantidade", "Venda", "Repasse rateado", "Resultado após canal"]} rows={data.topProducts.map((row) => [String(row.name ?? "—"), number(row.quantity), money(row.revenueCents), money(row.netRevenueCents), money(row.profitCents)])} empty="Nenhum produto vendido no período." />
      </div>
    </>}
    {filterOpen && <div className="catalog-backdrop"><section className="catalog-modal finance-filter-modal" role="dialog" aria-modal="true" aria-label="Filtros do dashboard de canais"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros dos canais</h2></div><button onClick={() => setFilterOpen(false)} aria-label="Fechar">×</button></header><div className="finance-filter-grid"><DateRangePicker from={draft.from} to={draft.to} onChange={(nextFrom, nextTo) => setDraft({ ...draft, from: nextFrom, to: nextTo })} /><label><span>Filial</span><select value={draft.branchId} onChange={(event) => setDraft({ ...draft, branchId: event.target.value, connectionId: "" })}><option value="">Todas as filiais</option>{data?.options.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Loja / conexão</span><select value={draft.connectionId} onChange={(event) => setDraft({ ...draft, connectionId: event.target.value })}><option value="">Todas as lojas</option>{data?.options.connections.filter((item) => !draft.branchId || item.branchId === draft.branchId).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.branchName}</option>)}</select></label></div><footer><button className="catalog-modal-cancel" onClick={() => setFilterOpen(false)}>Cancelar</button><button className="catalog-primary" onClick={() => { setFrom(draft.from); setTo(draft.to || draft.from); setBranchId(draft.branchId); setConnectionId(draft.connectionId); setFilterOpen(false); }}>Aplicar</button></footer></section></div>}
    {busy && <AppLoading text="Calculando canais..." />}
  </section>;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "positive" | "negative" }) {
  return <article><span>{label}</span><strong className={tone}>{value}</strong><small>{detail}</small></article>;
}

function DashboardTable({ title, columns, rows, empty = "Nenhum registro no período." }: { title: string; columns: string[]; rows: ReactNode[][]; empty?: string }) {
  return <article className="finance-table-card analytics-table"><header><div><span>Análise</span><strong>{title}</strong></div></header><div><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={`${rowIndex}:${columnIndex}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="channel-dashboard__empty">{empty}</p>}</div></article>;
}
