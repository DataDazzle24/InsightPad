import { useCallback, useEffect, useMemo, useState } from "react";
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
type View = "sales" | "stock" | "customers" | "categories";
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
  money = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v ?? 0) / 100),
  num = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
      Number(v ?? 0),
    ),
  iso = (d: Date) => d.toISOString().slice(0, 10),
  views: Array<{ key: View; label: string; icon: string }> = [
    { key: "sales", label: "Vendas", icon: "monitoring" },
    { key: "stock", label: "Estoque", icon: "inventory_2" },
    { key: "customers", label: "Clientes", icon: "groups" },
    { key: "categories", label: "Categorias", icon: "category" },
  ];
export function DashboardHubPage() {
  const [view, setView] = useState<View>("sales");
  return (
    <section className="dashboard-hub">
      <nav className="dashboard-hub__nav" aria-label="Painéis operacionais">
        {views.map((i) => (
          <button
            key={i.key}
            className={view === i.key ? "active" : ""}
            onClick={() => setView(i.key)}
          >
            <span className="material-symbols-rounded">{i.icon}</span>
            {i.label}
          </button>
        ))}
      </nav>
      <div className="dashboard-hub__content">
        {view === "sales" ? (
          <DailyProfitDashboardPage />
        ) : (
          <Operational view={view} />
        )}
      </div>
    </section>
  );
}
function Operational({ view }: { view: Exclude<View, "sales"> }) {
  const now = new Date(),
    start = new Date(now.getFullYear(), now.getMonth(), 1),
    [from, setFrom] = useState(iso(start)),
    [to, setTo] = useState(iso(now)),
    [draft, setDraft] = useState({ from: iso(start), to: iso(now) }),
    [filter, setFilter] = useState(false),
    [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState<Notice | null>(null);
  const load = useCallback(async () => {
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
      setData(box);
    } catch (e) {
      console.error(e);
      setNotice({
        type: "error",
        text: "Não foi possível calcular este painel.",
      });
    } finally {
      setBusy(false);
    }
  }, [from, to]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <section className="catalog-page analytics-page">
      <header className="finance-heading">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <h1>
            {view === "stock"
              ? "ESTOQUE"
              : view === "customers"
                ? "CLIENTES"
                : "CATEGORIAS E SUBCATEGORIAS"}
          </h1>
          <p>
            {new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} —{" "}
            {new Date(`${to}T12:00:00`).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <button
          className="catalog-primary"
          onClick={() => {
            setDraft({ from, to });
            setFilter(true);
          }}
        >
          <span className="material-symbols-rounded">tune</span>Período
        </button>
      </header>
      <AppToast notice={notice} onClose={() => setNotice(null)} />
      {data && view === "stock" && <StockView data={data.stock} />}{" "}
      {data && view === "customers" && <CustomerView data={data.customers} />}{" "}
      {data && view === "categories" && <CategoryView data={data.categories} />}{" "}
      {filter && (
        <div className="catalog-backdrop">
          <section className="catalog-modal finance-filter-modal">
            <header>
              <div>
                <span className="eyebrow">PESQUISA</span>
                <h2>PERÍODO DE ANÁLISE</h2>
              </div>
              <button onClick={() => setFilter(false)}>×</button>
            </header>
            <div className="finance-filter-grid">
              <DateRangePicker
                from={draft.from}
                to={draft.to}
                onChange={(a, b) => setDraft({ from: a, to: b })}
              />
            </div>
            <footer>
              <button onClick={() => setFilter(false)}>Cancelar</button>
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
      {busy && <AppLoading text="Calculando indicadores..." />}
    </section>
  );
}
const Cards = ({ items }: { items: Array<[string, string, string?]> }) => (
  <div className="finance-kpis analytics-kpis">
    {items.map((i) => (
      <article key={i[0]}>
        <span>{i[0]}</span>
        <strong>{i[1]}</strong>
        <small>{i[2] ?? "Período selecionado"}</small>
      </article>
    ))}
  </div>
);
function StockView({ data }: { data: Stock }) {
  const c = data.cards,
    max = useMemo(
      () =>
        Math.max(
          1,
          ...data.monthly.map((i) =>
            Math.max(
              Number(i.inboundQuantity),
              Number(i.saleQuantity),
              Number(i.lossQuantity),
            ),
          ),
        ),
      [data],
    );
  return (
    <>
      <Cards
        items={[
          [`Entradas`, num(c.inboundQuantity), money(c.inboundValueCents)],
          ["Frete", money(c.freightCents)],
          ["Outras custas", money(c.extraCostsCents)],
          [
            "Saídas por venda",
            num(c.saleQuantity),
            `Custo ${money(c.saleCostCents)}`,
          ],
          ["Lucro", money(c.saleProfitCents)],
          ["Perdas", num(c.lossQuantity), money(c.lossValueCents)],
        ]}
      />
      <article className="finance-chart-card">
        <header>
          <div>
            <span>Evolução mensal</span>
            <strong>Entradas, vendas e perdas</strong>
          </div>
        </header>
        <div className="finance-chart analytics-chart">
          {data.monthly.map((i) => (
            <div key={String(i.date)}>
              <span className="chart-bars">
                <i
                  className="volume"
                  style={{
                    height: `${(Number(i.inboundQuantity) * 100) / max}%`,
                  }}
                />
                <i
                  className="revenue"
                  style={{ height: `${(Number(i.saleQuantity) * 100) / max}%` }}
                />
                <i
                  className="profit"
                  style={{ height: `${(Number(i.lossQuantity) * 100) / max}%` }}
                />
              </span>
              <small>
                {new Date(`${i.date}T12:00:00`).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "2-digit",
                })}
              </small>
            </div>
          ))}
        </div>
      </article>
      <Table
        title="Movimentação por produto"
        headers={["Produto", "Entradas", "Saídas", "Saldo", "Valor"]}
        rows={data.products.map((i) => [
          i.name,
          num(i.inQuantity),
          num(i.outQuantity),
          num(i.netQuantity),
          money(i.valueCents),
        ])}
      />
    </>
  );
}
function CustomerView({ data }: { data: Customer }) {
  const c = data.cards;
  return (
    <>
      <Cards
        items={[
          [`Clientes ativos`, num(c.active)],
          ["Novos clientes", num(c.new)],
          ["Sem compras", num(c.withoutPurchase)],
          ["Ticket médio", money(c.ticketCents)],
          ["Frequência", num(c.frequency), "Compras por cliente"],
        ]}
      />
      <div className="analytics-grid">
        <Table
          title="Curva ABC"
          headers={[
            "Cliente",
            "Classe",
            "Compras",
            "Faturamento",
            "Última compra",
          ]}
          rows={data.abc.map((i) => [
            i.name,
            i.class,
            i.purchases,
            money(i.revenueCents),
            date(i.lastPurchase),
          ])}
        />
        <Table
          title="Clientes por região"
          headers={["Região", "Clientes", "Faturamento"]}
          rows={data.regions.map((i) => [
            i.region || "Não informada",
            i.customers,
            money(i.revenueCents),
          ])}
        />
        <Table
          title="Aniversariantes"
          headers={["Cliente", "Nascimento"]}
          rows={data.birthdays
            .slice(0, 50)
            .map((i) => [i.name, date(i.birthDate)])}
        />
        <Table
          title="Clientes sem comprar"
          headers={["Cliente", "Última compra", "Histórico"]}
          rows={data.dormant
            .slice(0, 100)
            .map((i) => [i.name, date(i.lastPurchase), money(i.revenueCents)])}
        />
      </div>
    </>
  );
}
function CategoryView({ data }: { data: Category[] }) {
  const cat = data.filter((i) => i.level === "Categoria"),
    sub = data.filter((i) => i.level === "Subcategoria"),
    margin = [...data].sort((a, b) => b.marginPercent - a.marginPercent)[0],
    profit = [...data].sort(
      (a, b) => Number(b.profitCents) - Number(a.profitCents),
    )[0],
    growth = [...data].sort((a, b) => b.growthPercent - a.growthPercent)[0];
  return (
    <>
      <Cards
        items={[
          [`Categoria líder`, cat[0]?.name ?? "—", money(cat[0]?.revenueCents)],
          [
            "Subcategoria líder",
            sub[0]?.name ?? "—",
            money(sub[0]?.revenueCents),
          ],
          [
            "Maior margem",
            margin?.name ?? "—",
            `${num(margin?.marginPercent)}%`,
          ],
          [
            "Maior crescimento",
            growth?.name ?? "—",
            `${num(growth?.growthPercent)}%`,
          ],
          ["Maior lucro", profit?.name ?? "—", money(profit?.profitCents)],
        ]}
      />
      <div className="analytics-grid">
        <Table
          title="Categorias"
          headers={[
            "Categoria",
            "Volume",
            "Faturamento",
            "Custo",
            "Lucro",
            "Margem",
            "Crescimento",
          ]}
          rows={cat.map((i) => [
            i.name,
            num(i.quantity),
            money(i.revenueCents),
            money(i.costCents),
            money(i.profitCents),
            `${num(i.marginPercent)}%`,
            `${num(i.growthPercent)}%`,
          ])}
        />
        <Table
          title="Subcategorias"
          headers={[
            "Subcategoria",
            "Volume",
            "Faturamento",
            "Custo",
            "Lucro",
            "Margem",
            "Crescimento",
          ]}
          rows={sub.map((i) => [
            i.name,
            num(i.quantity),
            money(i.revenueCents),
            money(i.costCents),
            money(i.profitCents),
            `${num(i.marginPercent)}%`,
            `${num(i.growthPercent)}%`,
          ])}
        />
      </div>
    </>
  );
}
const date = (v: unknown) =>
  v ? new Date(`${String(v)}T12:00:00`).toLocaleDateString("pt-BR") : "Nunca";
function Table({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: unknown[][];
}) {
  return (
    <article className="finance-table-card analytics-table">
      <header>
        <div>
          <span>{title}</span>
          <strong>{rows.length} registro(s)</strong>
        </div>
      </header>
      <div>
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, n) => (
                    <td key={n}>{String(c ?? "—")}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length}>Nenhum dado no período.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
