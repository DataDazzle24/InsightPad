import { compareRaw } from './geometry';
import { type ReactNode } from 'react';
import type { FinancialDashboardData, FinancialProduct, FinancialDay } from '../../pages/DailyProfitDashboardPage';
import type { Stock, Customer, Category } from '../../pages/DashboardHubPage';
import type { ChannelDashboardData } from '../../pages/ChannelDashboardPage';
import { heatmapStyle } from '../../utils/dashboardExport';
import { money } from './adapters';
import './dashboard-print.css';
const num = (value: unknown) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value ?? 0));
const number = (value: unknown) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value ?? 0));
/** Print-only identity and managerial context. Data always comes from the applied query. */
export function AnalysisReport({title,from,to,summary,children}:{title:string;from:string;to:string;summary:ReactNode;children:ReactNode}){
 return <section className="ip-analysis-report"><header className="ip-report-heading"><div><img src="/brand/insight-pad-logo-compact.png" alt="Insight Pad"/><p>Dados para o presente. Insights para o futuro.</p></div><div><span>RELATÓRIO GERENCIAL</span><h1>{title}</h1><p>{from} — {to}</p></div></header><aside className="ip-report-summary"><h2>Resumo gerencial e recorte</h2><p>{summary}</p><p>Indicadores e detalhes refletem a consulta aplicada. Seleções locais de classe ABC e ordem da tabela afetam o CSV da tabela; o PDF mantém o detalhamento completo do recorte.</p></aside>{children}<footer className="ip-report-footer">Insight Pad · Fim do relatório · Valores monetários em reais (R$).</footer></section>;
}
/** Complete original report content, with presentation controls/events removed. */
export function SalesPrintReport({ data, products, series, metrics, group, sort, from, to, summary }: {
    data: FinancialDashboardData;
    products: FinancialProduct[];
    series: FinancialDay[];
    metrics: Array<'volume' | 'revenue' | 'profit'>;
    group: 'day' | 'month' | 'year';
    sort: keyof FinancialProduct;
    from: string;
    to: string;
    summary: string;
}) {
    const c = data.cards, m = data.monthly;
    const categoryRows=new Map<string,{revenue:bigint;profit:bigint}>();
    for(const item of products){const name=item.category||'Não informada',prior=categoryRows.get(name)??{revenue:0n,profit:0n};categoryRows.set(name,{revenue:prior.revenue+BigInt(item.revenueCents),profit:prior.profit+BigInt(item.profitCents)})}
    const categories=[...categoryRows].sort(([an,a],[bn,b])=>a.revenue===b.revenue?an.localeCompare(bn,'pt-BR'):a.revenue>b.revenue?-1:1);
    return <AnalysisReport title="Vendas" from={from} to={to} summary={<>{summary} · {products.length} produto(s) · Faturamento {money(c.revenueCents)} · Lucro após taxas {money(c.profitCents)}.</>}><section className="finance-dashboard"><header className="finance-heading"><div><span className="eyebrow">DASHBOARD</span><h1>INDICADORES FINANCEIROS</h1><p>{from} — {to} · {summary}</p></div></header>
      {c.deliveryFeeCents&&BigInt(c.deliveryFeeCents)>0n&&<p className="finance-reconciliation-note">Taxas de entrega: {money(c.deliveryFeeCents)} incluídos no faturamento e repasse; excluídos da margem dos produtos. Resultado da entrega depende dos custos de transporte.</p>}
      {c.financialPendingSales > 0 && <p className="finance-reconciliation-note" role="status"><span className="material-symbols-rounded">schedule</span>{c.financialPendingSales} venda(s) do iFood ainda aguardam a conciliação oficial. Até lá, taxas e repasse aparecem como provisórios.</p>}
      {c && m && (<>
          <div className="finance-kpis">
            <article>
              <span>Volume de vendas</span>
              <strong>{num(c.volume)}</strong>
              <small>Vendas concluídas</small>
            </article>
            <article>
              <span>Faturamento bruto</span>
              <strong>{money(c.revenueCents)}</strong>
              <small>Antes das taxas do canal</small>
            </article>
            <article>
              <span>Taxas do iFood</span>
              <strong>{money(c.providerFeeCents)}</strong>
              <small>Valores conciliados pelo parceiro</small>
            </article>
            <article>
              <span>Repasse líquido</span>
              <strong>{money(c.netRevenueCents)}</strong>
              <small>Faturamento bruto − taxas</small>
            </article>
            <article>
              <span>Lucro após taxas</span>
              <strong>{money(c.profitCents)}</strong>
              <small>Margem {num(c.marginPercent)}%</small>
            </article>
            <article>
              <span>Ticket médio</span>
              <strong>{money(c.ticketCents)}</strong>
              <small>Faturamento ÷ vendas</small>
            </article>
          </div><div className="finance-comparisons">
            <article className="finance-comparison">
              <span>Último mês fechado · volume</span>
              <strong>{num(m.lastVolume)}</strong>
              <small className={m.volumeGrowth >= 0 ? "positive" : "negative"}>
                {m.volumeGrowth >= 0 ? "▲" : "▼"}{" "}
                {num(Math.abs(m.volumeGrowth))}% vs. média de {m.months} mês(es)
                · {num(m.averageVolume)}
              </small>
            </article>
            <article className="finance-comparison">
              <span>Último mês fechado · lucro após taxas</span>
              <strong>{money(m.lastProfitCents)}</strong>
              <small className={m.profitGrowth >= 0 ? "positive" : "negative"}>
                {m.profitGrowth >= 0 ? "▲" : "▼"}{" "}
                {num(Math.abs(m.profitGrowth))}% vs. média ·{" "}
                {money(m.averageProfitCents)}
              </small>
            </article>
          </div>
          <Table title="Comparação por categoria · faturamento e lucro" headers={['Categoria','Faturamento','Lucro após taxas']} rows={categories.map(([name,value])=>[name,money(value.revenue.toString()),money(value.profit.toString())])}/>
          <div className="finance-workspace"><Table title={`Evolução financeira · ${group==='day'?'diária':group==='month'?'mensal':'anual'}`} headers={['Período',...metrics.map(metric=>({volume:'Volume',revenue:'Faturamento',profit:'Lucro após taxas'})[metric])]} rows={series.map(day=>[date(day.date),...metrics.map(metric=>metric==='volume'?num(day.volume):money(metric==='revenue'?day.revenueCents:day.profitCents))])}/>
          <article className="finance-table-card">
            <header>
              <div>
                <span>Análise por produto</span>
                <strong>Receita, custo e rentabilidade</strong>
              </div>
        <small>{products.length} produto(s) · Detalhamento do recorte aplicado</small>
            </header>
            <div tabIndex={0} role="region" aria-label="Produtos: tabela completa com rolagem horizontal">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Subcategoria</th>
                    {([
                ["quantity", "Volume"],
                ["revenueCents", "Fat. bruto"],
                ["providerFeeCents", "Taxas iFood"],
                ["netRevenueCents", "Repasse líquido"],
                ["costCents", "Custo"],
                ["profitCents", "Lucro após taxas"],
                ["marginPercent", "Margem"],
            ] as Array<[
                keyof FinancialProduct,
                string
            ]>).map(([key, label]) => (<th key={key}>
                        <span>
                          {label}
                          {sort === key ? " •" : ""}
                        </span>
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (<tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.category || "—"}</td>
                      <td>{item.subcategory || "—"}</td>
                      <td style={heatmapStyle(Number(item.quantity), products.map(p => Number(p.quantity)))}>{num(item.quantity)}</td>
                      <td style={heatmapStyle(Number(item.revenueCents), products.map(p => Number(p.revenueCents)))}>{money(item.revenueCents)}</td>
                      <td style={heatmapStyle(Number(item.providerFeeCents), products.map(p => Number(p.providerFeeCents)))}>{money(item.providerFeeCents)}</td>
                      <td style={heatmapStyle(Number(item.netRevenueCents), products.map(p => Number(p.netRevenueCents)))}>{money(item.netRevenueCents)}</td>
                      <td style={heatmapStyle(Number(item.costCents), products.map(p => Number(p.costCents)))}>{money(item.costCents)}</td>
                      <td className={Number(item.profitCents) >= 0
                    ? "positive"
                    : "negative"} style={heatmapStyle(Number(item.profitCents), products.map(p => Number(p.profitCents)))}>
                        {money(item.profitCents)}
                      </td>
                      <td style={heatmapStyle(Number(item.marginPercent), products.map(p => Number(p.marginPercent)))}>{num(item.marginPercent)}%</td>
                    </tr>))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>TOTAL</th>
                    <th>
                      {num(products.reduce((s, i) => s + Number(i.quantity), 0))}
                    </th>
                    <th>
                      {money(products.reduce((s, i) => s + BigInt(i.revenueCents), 0n).toString())}
                    </th>
                    <th>
                      {money(products.reduce((s, i) => s + BigInt(i.providerFeeCents), 0n).toString())}
                    </th>
                    <th>
                      {money(products.reduce((s, i) => s + BigInt(i.netRevenueCents), 0n).toString())}
                    </th>
                    <th>
                      {money(products.reduce((s, i) => s + BigInt(i.costCents), 0n).toString())}
                    </th>
                    <th>
                      {money(products.reduce((s, i) => s + BigInt(i.profitCents), 0n).toString())}
                    </th>
                    <th>{num(c.marginPercent)}%</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </article></div>
        </>)}
    </section></AnalysisReport>;
}
export function ChannelPrintReport({ data, from, to, summary }: {
    data: ChannelDashboardData;
    from: string;
    to: string;
    summary?: string;
}) {
    const cards = data.cards;
    return <AnalysisReport title="Canais de venda" from={from} to={to} summary={<>{summary} · {number(cards.sales)} venda(s) concluída(s) · Venda contabilizada {money(cards.grossRevenueCents)} · Repasse líquido {money(cards.netRevenueCents)} · {number(cards.financialPendingSales)} venda(s) com valor estimado.</>}><section className="catalog-page analytics-page channel-dashboard"><header className="finance-heading"><div><h1>Canais de venda</h1><p>{date(from)} — {date(to)}</p></div></header>
    {data && <>
      <div className="finance-kpis analytics-kpis channel-dashboard__kpis">
        <Metric label="Pedidos recebidos" value={number(cards.orders)} detail={`${number(cards.cancelledOrders)} cancelado(s)`}/>
        <Metric label="Vendas concluídas" value={number(cards.sales)} detail={`Ticket ${money(cards.averageTicketCents)}`}/>
        <Metric label="Venda contabilizada" value={money(cards.grossRevenueCents)} detail={`Cliente pagou ${money(cards.customerPaidCents)}`}/>
        <Metric label="Subsídio do parceiro" value={money(cards.partnerSubsidyCents)} detail="Descontos não custeados pela loja" tone="positive"/>
        <Metric label="Desconto da loja" value={money(cards.merchantDiscountCents)} detail="Campanhas custeadas pelo estabelecimento"/>
        <Metric label="Taxas do canal" value={money(cards.providerFeeCents)} detail="Somente lançamentos financeiros confirmados" tone="negative"/>
        <Metric label="Outros ajustes" value={money(cards.financialAdjustmentsCents)} detail="Créditos e débitos além das taxas identificadas"/>
        <Metric label="Repasse líquido" value={money(cards.netRevenueCents)} detail={`${number(cards.financialPendingSales)} venda(s) ainda com valor estimado`}/>
        <Metric label="Resultado após canal" value={money(cards.profitCents)} detail={`Custo registrado ${money(cards.costCents)}`} tone={Number(cards.profitCents ?? 0) < 0 ? "negative" : "positive"}/>
      </div>
      <Table title="Evolução diária · venda contabilizada e repasse líquido" headers={['Período','Venda contabilizada','Repasse líquido']} rows={data.daily.map(item=>[date(item.date),money(item.grossRevenueCents),money(item.netRevenueCents)])}/>
      <div className="analytics-grid channel-dashboard__grid">
        <DashboardTable title="Resultado por loja" columns={["Loja", "Pedidos", "Vendas", "Venda", "Taxas", "Outros ajustes", "Repasse", "Resultado"]} rows={data.byChannel.map((row) => [<><strong>{String(row.name ?? "—")}</strong><small>{String(row.branchName ?? "")}</small></>, number(row.orders), number(row.sales), money(row.grossRevenueCents), money(row.providerFeeCents), money(row.financialAdjustmentsCents), money(row.netRevenueCents), money(row.profitCents)])}/>
        <DashboardTable title="Taxas confirmadas pelo iFood" columns={["Lançamento", "Ocorrências", "Valor"]} rows={data.fees.map((row) => [<><strong>{String(row.description ?? row.name ?? "—")}</strong><small>{String(row.name ?? "")}</small></>, number(row.entries), money(row.amountCents)])} empty="Nenhuma taxa financeira confirmada no período."/>
        <DashboardTable title="Formas de pagamento" columns={["Forma", "Pedidos", "Valor"]} rows={data.payments.map((row) => [<><strong>{String(row.method ?? "Não informada")}</strong><small>{[row.paymentType, row.cardBrand, row.walletName].filter(Boolean).join(" · ")}</small></>, number(row.orders), money(row.amountCents)])} empty="Nenhum pagamento recebido no período."/>
        <DashboardTable title="Produtos mais vendidos nos canais" columns={["Produto", "Quantidade", "Venda", "Repasse rateado", "Resultado após canal"]} rows={data.topProducts.map((row) => [String(row.name ?? "—"), number(row.quantity), money(row.revenueCents), money(row.netRevenueCents), money(row.profitCents)])} empty="Nenhum produto vendido no período."/>
      </div>
    </>}
    </section></AnalysisReport>;
}
function Metric({ label, value, detail, tone }: {
    label: string;
    value: string;
    detail: string;
    tone?: "positive" | "negative";
}) {
    return <article><span>{label}</span><strong className={tone}>{value}</strong><small>{detail}</small></article>;
}
function DashboardTable({ title, columns, rows, empty = "Nenhum registro no período." }: {
    title: string;
    columns: string[];
    rows: ReactNode[][];
    empty?: string;
}) {
    return <article className="finance-table-card analytics-table"><header><div><span>Análise</span><strong>{title}</strong></div><></></header><div tabIndex={0} role="region" aria-label={`${title}: tabela completa com rolagem horizontal`}><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={`${rowIndex}:${columnIndex}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="channel-dashboard__empty">{empty}</p>}</div></article>;
}
const Cards = ({ items }: {
    items: Array<[
        string,
        string,
        string?
    ]>;
}) => (<div className="finance-kpis analytics-kpis">
    {items.map((i) => (<article key={i[0]}>
        <span>{i[0]}</span>
        <strong>{i[1]}</strong>
        <small>{i[2] ?? "Período selecionado"}</small>
      </article>))}
  </div>);
export function StockPrintView({ data }: {
    data: Stock;
}) {
    const c = data.cards;
    return (<>
      <Cards items={[
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
        ]}/>
      <Table title="Evolução mensal · entradas, vendas e perdas" headers={['Período','Entradas','Vendas','Perdas']} rows={data.monthly.map(item=>[date(item.date),num(item.inboundQuantity),num(item.saleQuantity),num(item.lossQuantity)])}/>
      <Table title="Movimentação por produto" headers={["Produto", "Entradas", "Saídas", "Saldo", "Valor"]} rows={data.products.map((i) => [
            i.name,
            num(i.inQuantity),
            num(i.outQuantity),
            num(i.netQuantity),
            money(i.valueCents),
        ])}/>
    </>);
}
export function CustomerPrintView({ data }: {
    data: Customer;
}) {
    const c = data.cards;
    return (<>
      <Cards items={[
            [`Clientes ativos`, num(c.active)],
            ["Novos clientes", num(c.new)],
            ["Sem compras", num(c.withoutPurchase)],
            ["Ticket médio", money(c.ticketCents)],
            ["Frequência", num(c.frequency), "Compras por cliente"],
        ]}/>
      <div className="analytics-grid">
        <Table title="Curva ABC" headers={[
            "Cliente",
            "Classe",
            "Compras",
            "Faturamento",
            "Última compra",
        ]} rows={data.abc.map((i) => [
            i.name,
            i.class,
            i.purchases,
            money(i.revenueCents),
            date(i.lastPurchase),
        ])}/>
        <Table title="Clientes por região" headers={["Região", "Clientes", "Faturamento"]} rows={data.regions.map((i) => [
            i.region || "Não informada",
            i.customers,
            money(i.revenueCents),
        ])}/>
        <Table title="Aniversariantes" headers={["Cliente", "Nascimento"]} rows={data.birthdays
            .map((i) => [i.name, date(i.birthDate)])}/>
        <Table title="Clientes sem comprar" headers={["Cliente", "Última compra", "Histórico"]} rows={data.dormant
            .map((i) => [i.name, date(i.lastPurchase), money(i.revenueCents)])}/>
      </div>
    </>);
}
export function CategoryPrintView({ data }: {
    data: Category[];
}) {
    const cat = data.filter((i) => i.level === "Categoria"), sub = data.filter((i) => i.level === "Subcategoria"), margin = [...data].sort((a, b) => b.marginPercent - a.marginPercent)[0], profit = [...data].sort((a, b) => compareRaw(b.profitCents, a.profitCents))[0], growth = [...data].sort((a, b) => b.growthPercent - a.growthPercent)[0];
    return (<>
      <Cards items={[
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
        ]}/>
      <div className="analytics-grid">
        <Table title="Categorias" headers={[
            "Categoria",
            "Volume",
            "Faturamento",
            "Custo",
            "Lucro",
            "Margem",
            "Crescimento",
        ]} rows={cat.map((i) => [
            i.name,
            num(i.quantity),
            money(i.revenueCents),
            money(i.costCents),
            money(i.profitCents),
            `${num(i.marginPercent)}%`,
            `${num(i.growthPercent)}%`,
        ])}/>
        <Table title="Subcategorias" headers={[
            "Subcategoria",
            "Volume",
            "Faturamento",
            "Custo",
            "Lucro",
            "Margem",
            "Crescimento",
        ]} rows={sub.map((i) => [
            i.name,
            num(i.quantity),
            money(i.revenueCents),
            money(i.costCents),
            money(i.profitCents),
            `${num(i.marginPercent)}%`,
            `${num(i.growthPercent)}%`,
        ])}/>
      </div>
    </>);
}
const date = (v: unknown) => v ? new Date(`${String(v)}T12:00:00`).toLocaleDateString("pt-BR") : "Nunca";
function Table({ title, headers, rows, }: {
    title: string;
    headers: string[];
    rows: unknown[][];
}) {
    return (<article className="finance-table-card analytics-table">
      <header>
        <div>
          <span>{title}</span>
          <strong>{rows.length} registro(s)</strong>
        </div><></>
      </header>
      <div tabIndex={0} role="region" aria-label={`${title}: tabela completa com rolagem horizontal`}>
        <table>
          <thead>
            <tr>
              {headers.map((h) => (<th key={h}>{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (rows.map((r, i) => (<tr key={i}>
                  {r.map((c, n) => (<td key={n} style={typeof c === 'number' ? heatmapStyle(c, rows.map(row => Number(row[n]))) : undefined}>{String(c ?? "—")}</td>))}
                </tr>))) : (<tr>
                <td colSpan={headers.length}>Nenhum dado no período.</td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </article>);
}
