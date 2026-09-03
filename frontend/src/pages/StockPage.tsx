/* eslint-disable react-hooks/preserve-manual-memoization */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  postStockTransfer,
  reverseStockOperation,
  saveStockBatch,
  stockOperationDetails,
  stockWorkspace,
} from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import {
  AppLoading,
  AppToast,
  DateRangePicker,
  SearchableMultiSelect,
  type Notice,
} from "../components/SalesUi";
import { allocateInvoiceCosts, maskMoney, parseMoney } from "../utils/stock";
type Branch = { id: string; name: string };
type Supplier = { id: string; name: string };
type Balance = {
  branchId: string;
  branchName: string;
  quantity: number;
  averageCostCents: string;
};
type Product = {
  id: string;
  name: string;
  internalCode?: string;
  ean?: string;
  categoryName?: string;
  minimumStock: number;
  maximumStock: number;
  allowNegativeStock: boolean;
  costPriceCents: string;
  balances: Balance[];
};
type Movement = {
  id: string;
  operationId: string;
  occurredAt: string;
  quantity: number;
  unitCostCents: string;
  status: string;
  typeCode: string;
  typeName: string;
  direction: string;
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
};
type Transfer = {
  id: string;
  operationId: string;
  status: string;
  requestedAt: string;
  sourceBranch: string;
  destinationBranch: string;
  totalQuantity: number;
  itemCount: number;
};
type Workspace = {
  branches: Branch[];
  suppliers: Supplier[];
  products: Product[];
  movements: Movement[];
  transfers: Transfer[];
};
type Item = {
  productId: string;
  quantity: number;
  gross: string;
  replaceCost: boolean;
};
type Form = {
  direction: "IN" | "OUT";
  branchId: string;
  occurredAt: string;
  notes: string;
  items: Item[];
  fiscalEnabled: boolean;
  fiscal: {
    supplierId: string;
    documentType: string;
    documentNumber: string;
    accessKey: string;
    issuedAt: string;
    total: string;
    freight: string;
    insurance: string;
    icms: string;
    icmsSt: string;
    ipi: string;
    issuerCpf: string;
    issuerCnpj: string;
    stateCode: string;
  };
};
type Filters = {
  types: string[];
  products: string[];
  branches: string[];
  from: string;
  to: string;
};
const dc = getDataConnect(firebaseApp, connectorConfig),
  empty: Workspace = {
    branches: [],
    suppliers: [],
    products: [],
    movements: [],
    transfers: [],
  },
  iso = () => new Date().toISOString().slice(0, 16),
  newItem = (): Item => ({
    productId: "",
    quantity: 1,
    gross: "R$ 0,00",
    replaceCost: false,
  }),
  newForm = (): Form => ({
    direction: "IN",
    branchId: "",
    occurredAt: iso(),
    notes: "",
    items: [newItem()],
    fiscalEnabled: false,
    fiscal: {
      supplierId: "",
      documentType: "NF-e",
      documentNumber: "",
      accessKey: "",
      issuedAt: "",
      total: "R$ 0,00",
      freight: "R$ 0,00",
      insurance: "R$ 0,00",
      icms: "R$ 0,00",
      icmsSt: "R$ 0,00",
      ipi: "R$ 0,00",
      issuerCpf: "",
      issuerCnpj: "",
      stateCode: "",
    },
  }),
  money = (v: unknown) => maskMoney(Number(v ?? 0)),
  num = (v: unknown) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(
      Number(v ?? 0),
    );
export function StockPage() {
  const [data, setData] = useState<Workspace>(empty),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState<Notice | null>(null),
    [view, setView] = useState<"movements" | "balance" | "transfers">(
      "movements",
    ),
    [search, setSearch] = useState(""),
    [branch, setBranch] = useState(""),
    [selected, setSelected] = useState<Movement | null>(null),
    [form, setForm] = useState<Form>(newForm()),
    [operationOpen, setOperationOpen] = useState(false),
    [step, setStep] = useState(0),
    [editing, setEditing] = useState(""),
    [transferOpen, setTransferOpen] = useState(false),
    [transfer, setTransfer] = useState({
      sourceBranchId: "",
      destinationBranchId: "",
      notes: "",
      items: [newItem()],
    }),
    [filterOpen, setFilterOpen] = useState(false),
    [filters, setFilters] = useState<Filters>({
      types: [],
      products: [],
      branches: [],
      from: "",
      to: "",
    }),
    [draft, setDraft] = useState<Filters>(filters),
    [reverseOpen, setReverseOpen] = useState(false),
    [reason, setReason] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await stockWorkspace(dc, {
          requestKey: crypto.randomUUID(),
        }),
        box =
          ((result.data._select ?? [])[0] as { data?: Workspace } | undefined)
            ?.data ?? empty;
      setData(box);
      setBranch((v) => v || box.branches[0]?.id || "");
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível carregar o estoque.",
      });
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const balance = useMemo(
      () =>
        data.products
          .map((p) => {
            const b = p.balances.find((i) => i.branchId === branch),
              quantity = Number(b?.quantity ?? 0);
            return {
              ...p,
              quantity,
              cost: b?.averageCostCents ?? p.costPriceCents,
              status:
                quantity <= 0
                  ? "empty"
                  : Number(p.minimumStock) > 0 &&
                      quantity < Number(p.minimumStock)
                    ? "low"
                    : Number(p.maximumStock) > 0 &&
                        quantity > Number(p.maximumStock)
                      ? "high"
                      : "ok",
            };
          })
          .filter(
            (p) =>
              !search ||
              [p.name, p.internalCode, p.ean, p.categoryName].some((v) =>
                v?.toLowerCase().includes(search.toLowerCase()),
              ),
          ),
      [data.products, branch, search],
    ),
    movements = useMemo(
      () =>
        data.movements.filter(
          (m) =>
            (!search ||
              [m.productName, m.branchName, m.typeName, m.operationId].some(
                (v) => v.toLowerCase().includes(search.toLowerCase()),
              )) &&
            (!filters.types.length || filters.types.includes(m.typeCode)) &&
            (!filters.products.length ||
              filters.products.includes(m.productId)) &&
            (!filters.branches.length ||
              filters.branches.includes(m.branchId)) &&
            (!filters.from || m.occurredAt.slice(0, 10) >= filters.from) &&
            (!filters.to || m.occurredAt.slice(0, 10) <= filters.to),
        ),
      [data.movements, filters, search],
    ),
    summary = useMemo(
      () => ({
        count: balance.length,
        value: balance.reduce((s, p) => s + p.quantity * Number(p.cost), 0),
        low: balance.filter((p) => p.status === "low").length,
        empty: balance.filter((p) => p.status === "empty").length,
      }),
      [balance],
    );
  const extras = ["freight", "insurance", "icms", "icmsSt", "ipi"].reduce(
      (s, k) => s + parseMoney(form.fiscal[k as keyof Form["fiscal"]]),
      0,
    ),
    costs = allocateInvoiceCosts(
      form.items.map((i) => ({
        quantity: Number(i.quantity),
        unitGrossCents:
          form.direction === "OUT"
            ? Number(
                data.products.find((p) => p.id === i.productId)
                  ?.costPriceCents ?? 0,
              )
            : parseMoney(i.gross),
      })),
      form.fiscalEnabled ? extras : 0,
    );
  function updateItem(
    index: number,
    patch: Partial<Item>,
    target: "form" | "transfer" = "form",
  ) {
    if (target === "form")
      setForm((v) => ({
        ...v,
        items: v.items.map((i, n) => (n === index ? { ...i, ...patch } : i)),
      }));
    else
      setTransfer((v) => ({
        ...v,
        items: v.items.map((i, n) => (n === index ? { ...i, ...patch } : i)),
      }));
  }
  function add(target: "form" | "transfer") {
    if (target === "form")
      setForm((v) => ({ ...v, items: [...v.items, newItem()] }));
    else setTransfer((v) => ({ ...v, items: [...v.items, newItem()] }));
  }
  function validItems(items: Item[]) {
    if (
      !items.length ||
      items.some((i) => !i.productId || Number(i.quantity) <= 0)
    ) {
      setNotice({
        type: "error",
        text: "Adicione produtos e informe quantidades maiores que zero.",
      });
      return false;
    }
    if (new Set(items.map((i) => i.productId)).size !== items.length) {
      setNotice({
        type: "error",
        text: "O mesmo produto não pode aparecer duas vezes. Ajuste a quantidade na linha existente.",
      });
      return false;
    }
    return true;
  }
  function openNew() {
    const value = newForm();
    value.branchId = data.branches[0]?.id || "";
    setEditing("");
    setForm(value);
    setStep(0);
    setOperationOpen(true);
  }
  async function edit() {
    if (!selected) {
      setNotice({
        type: "info",
        text: "Selecione uma movimentação para editar.",
      });
      return;
    }
    if (selected.typeCode.startsWith("SALE")) {
      setNotice({
        type: "error",
        text: "Movimentos de venda devem ser corrigidos no Registro de Vendas.",
      });
      return;
    }
    setBusy(true);
    try {
      const result = await stockOperationDetails(dc, {
          operationId: selected.operationId,
          requestKey: crypto.randomUUID(),
        }),
        details = (
          (result.data._select ?? [])[0] as
            | {
                data?: {
                  movements: Movement[];
                  fiscalDocument?: Record<string, string>;
                };
              }
            | undefined
        )?.data;
      if (!details?.movements.length) throw new Error();
      const first = details.movements[0],
        f = details.fiscalDocument,
        setMoney = (key: string) => maskMoney(Number(f?.[key] ?? 0));
      setEditing(selected.operationId);
      setForm({
        direction: first.direction as "IN" | "OUT",
        branchId: first.branchId,
        occurredAt: first.occurredAt.slice(0, 16),
        notes: "",
        items: details.movements
          .filter((m) => m.status === "POSTED")
          .map((m) => ({
            productId: m.productId,
            quantity: Number(m.quantity),
            gross: maskMoney(
              Number(
                (m as Movement & { unitGrossCents?: string }).unitGrossCents ??
                  0,
              ),
            ),
            replaceCost: false,
          })),
        fiscalEnabled: Boolean(f),
        fiscal: {
          supplierId: f?.supplierId ?? "",
          documentType: f?.documentType ?? "NF-e",
          documentNumber: f?.documentNumber ?? "",
          accessKey: f?.accessKey ?? "",
          issuedAt: f?.issuedAt?.slice(0, 16) ?? "",
          total: setMoney("totalCents"),
          freight: setMoney("freightCents"),
          insurance: setMoney("insuranceCents"),
          icms: setMoney("icmsCents"),
          icmsSt: setMoney("icmsStCents"),
          ipi: setMoney("ipiCents"),
          issuerCpf: f?.issuerCpf ?? "",
          issuerCnpj: f?.issuerCnpj ?? "",
          stateCode: f?.stateCode ?? "",
        },
      });
      setStep(0);
      setOperationOpen(true);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível abrir a movimentação.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!form.branchId || !validItems(form.items)) return;
    if (
      form.fiscalEnabled &&
      form.direction === "IN" &&
      !form.fiscal.documentNumber.trim()
    ) {
      setNotice({
        type: "error",
        text: "Informe o número da nota fiscal ou desative os dados fiscais.",
      });
      return;
    }
    setBusy(true);
    try {
      const fiscal = Object.fromEntries(
        Object.entries(form.fiscal).map(([k, v]) => [
          ["total", "freight", "insurance", "icms", "icmsSt", "ipi"].includes(k)
            ? `${k}Cents`
            : k,
          ["total", "freight", "insurance", "icms", "icmsSt", "ipi"].includes(k)
            ? parseMoney(v)
            : v,
        ]),
      );
      const result = await saveStockBatch(dc, {
        payload: {
          direction: form.direction,
          branchId: form.branchId,
          occurredAt: new Date(form.occurredAt).toISOString(),
          notes: form.notes,
          clientOperationId: crypto.randomUUID(),
          replacesOperationId: editing || null,
          fiscalEnabled: form.fiscalEnabled,
          fiscal,
          items: form.items.map((i, n) => ({
            product_id: i.productId,
            quantity: Number(i.quantity),
            unit_gross_cents:
              form.direction === "OUT"
                ? Number(
                    data.products.find((p) => p.id === i.productId)
                      ?.costPriceCents ?? 0,
                  )
                : parseMoney(i.gross),
            unit_cost_cents: costs[n],
            replace_cost: i.replaceCost,
          })),
        },
      });
      if (!result.data._execute) throw new Error();
      setOperationOpen(false);
      setSelected(null);
      setNotice({
        type: "success",
        text: editing
          ? "Movimentação corrigida e saldos recalculados."
          : "Movimentação registrada e saldos atualizados.",
      });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Operação recusada. Verifique permissões, saldo e dados informados.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function saveTransfer() {
    if (
      !transfer.sourceBranchId ||
      !transfer.destinationBranchId ||
      transfer.sourceBranchId === transfer.destinationBranchId
    ) {
      setNotice({
        type: "error",
        text: "Origem e destino devem ser filiais diferentes.",
      });
      return;
    }
    if (!validItems(transfer.items)) return;
    setBusy(true);
    try {
      const result = await postStockTransfer(dc, {
        payload: {
          sourceBranchId: transfer.sourceBranchId,
          destinationBranchId: transfer.destinationBranchId,
          notes: transfer.notes,
          clientOperationId: crypto.randomUUID(),
          items: transfer.items.map((i) => ({
            product_id: i.productId,
            quantity: Number(i.quantity),
          })),
        },
      });
      if (!result.data._execute) throw new Error();
      setTransferOpen(false);
      setNotice({
        type: "success",
        text: "Transferência concluída e refletida nas duas filiais.",
      });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Transferência recusada. Verifique saldos e permissões.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function reverse() {
    if (!selected || reason.trim().length < 5) {
      setNotice({
        type: "error",
        text: "Informe um motivo com pelo menos 5 caracteres.",
      });
      return;
    }
    setBusy(true);
    try {
      const result = await reverseStockOperation(dc, {
        operationId: selected.operationId,
        movementIds: [],
        reason,
      });
      if (!result.data._execute) throw new Error();
      setReverseOpen(false);
      setSelected(null);
      setReason("");
      setNotice({
        type: "success",
        text: "Movimentação estornada e saldo atualizado.",
      });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível estornar esta movimentação.",
      });
    } finally {
      setBusy(false);
    }
  }
  function csv() {
    const rows =
      view === "balance"
        ? [
            [
              "Produto",
              "Código",
              "EAN",
              "Categoria",
              "Filial",
              "Saldo",
              "Mínimo",
              "Máximo",
              "Custo médio",
              "Valor total",
            ],
            ...balance.map((p) => [
              p.name,
              p.internalCode ?? "",
              p.ean ?? "",
              p.categoryName ?? "",
              data.branches.find((b) => b.id === branch)?.name ?? "",
              p.quantity,
              p.minimumStock,
              p.maximumStock,
              p.cost,
              p.quantity * Number(p.cost),
            ]),
          ]
        : [
            [
              "ID",
              "Operação",
              "Data",
              "Tipo",
              "Produto",
              "Filial",
              "Direção",
              "Quantidade",
              "Custo unitário",
              "Status",
            ],
            ...movements.map((m) => [
              m.id,
              m.operationId,
              m.occurredAt,
              m.typeName,
              m.productName,
              m.branchName,
              m.direction,
              m.quantity,
              m.unitCostCents,
              m.status,
            ]),
          ];
    const blob = new Blob(
        [
          "\uFEFF" +
            rows
              .map((r) =>
                r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"),
              )
              .join("\n"),
        ],
        { type: "text/csv" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `estoque-${view}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="stock-page">
      <header className="stock-heading">
        <div>
          <span className="eyebrow">ESTOQUE</span>
          <h1>CONTROLE DE ESTOQUE</h1>
        </div>
        <div className="stock-heading__actions">
          <button
            className="stock-heading-action stock-heading-action--transfer"
            onClick={() => {
              setTransfer({
                sourceBranchId: data.branches[0]?.id || "",
                destinationBranchId: "",
                notes: "",
                items: [newItem()],
              });
              setTransferOpen(true);
            }}
          >
            <span className="material-symbols-rounded">move_up</span>Transferir
          </button>
          <button
            className="stock-heading-action stock-heading-action--edit"
            onClick={edit}
          >
            <span className="material-symbols-rounded">edit</span>Editar
          </button>
          <button
            className="catalog-primary stock-heading-action stock-heading-action--create"
            onClick={openNew}
          >
            <span className="material-symbols-rounded">add_box</span>Nova
            movimentação
          </button>
        </div>
      </header>
      <AppToast notice={notice} onClose={() => setNotice(null)} />
      <div className="stock-kpis">
        <article>
          <span>Produtos</span>
          <strong>{summary.count}</strong>
        </article>
        <article>
          <span>Valor em estoque</span>
          <strong>{money(summary.value)}</strong>
        </article>
        <article className="warning">
          <span>Estoque baixo</span>
          <strong>{summary.low}</strong>
        </article>
        <article className="danger">
          <span>Sem saldo</span>
          <strong>{summary.empty}</strong>
        </article>
      </div>
      <nav className="stock-tabs">
        <button
          className={view === "movements" ? "active" : ""}
          onClick={() => setView("movements")}
        >
          Movimentações
        </button>
        <button
          className={view === "balance" ? "active" : ""}
          onClick={() => setView("balance")}
        >
          Saldo atual
        </button>
        <button
          className={view === "transfers" ? "active" : ""}
          onClick={() => setView("transfers")}
        >
          Transferências
        </button>
      </nav>
      <div className="stock-panel">
        <div className="stock-toolbar">
          <label>
            <span className="material-symbols-rounded">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
            />
          </label>
          {view === "balance" && (
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {data.branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {view === "movements" && (
            <button
              className="stock-toolbar-action"
              onClick={() => {
                setDraft(filters);
                setFilterOpen(true);
              }}
            >
              <span className="material-symbols-rounded">tune</span>Pesquisa
              avançada
            </button>
          )}
          <button className="stock-toolbar-action" onClick={csv}>
            <span className="material-symbols-rounded">download</span>CSV
          </button>
          {selected && (
            <button
              className="danger stock-action-danger"
              onClick={() => setReverseOpen(true)}
            >
              Estornar
            </button>
          )}
        </div>
          <div className={`stock-table stock-table--${view}`}>
          <table>
            <thead>
              {view === "balance" ? (
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Saldo</th>
                  <th>Mínimo</th>
                  <th>Máximo</th>
                  <th>Custo médio</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              ) : view === "movements" ? (
                <tr>
                  <th />
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Filial</th>
                  <th>Quantidade</th>
                  <th>Custo unitário</th>
                  <th>Status</th>
                  <th>Operação</th>
                </tr>
              ) : (
                <tr>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Itens</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Operação</th>
                </tr>
              )}
            </thead>
            <tbody>
              {view === "balance"
                ? balance.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <small>{p.internalCode || p.ean || "Sem código"}</small>
                      </td>
                      <td>{p.categoryName || "—"}</td>
                      <td>
                        <strong>{num(p.quantity)}</strong>
                      </td>
                      <td>{num(p.minimumStock)}</td>
                      <td>{num(p.maximumStock)}</td>
                      <td>{money(p.cost)}</td>
                      <td>{money(p.quantity * Number(p.cost))}</td>
                      <td>
                        <span
                          className={`stock-status stock-status--${p.status}`}
                        >
                          <i />
                          {p.status === "ok"
                            ? "Normal"
                            : p.status === "low"
                              ? "Baixo"
                              : p.status === "high"
                                ? "Acima do máximo"
                                : "Sem saldo"}
                        </span>
                      </td>
                    </tr>
                  ))
                : view === "movements"
                  ? movements.map((m) => (
                      <tr
                        key={m.id}
                        className={selected?.id === m.id ? "selected" : ""}
                        onClick={() =>
                          setSelected(selected?.id === m.id ? null : m)
                        }
                      >
                        <td>
                          <input
                            type="radio"
                            checked={selected?.id === m.id}
                            readOnly
                          />
                        </td>
                        <td>
                          {new Date(m.occurredAt).toLocaleString("pt-BR")}
                        </td>
                        <td><span className={`stock-type stock-type--${m.typeCode === "SALE" ? "sale" : m.direction === "IN" ? "in" : "loss"}`}>{m.typeName}</span></td>
                        <td>
                          <strong>{m.productName}</strong>
                        </td>
                        <td>{m.branchName}</td>
                        <td
                          className={
                            m.direction === "OUT" ? "stock-out" : "stock-in"
                          }
                        >
                          {m.direction === "OUT" ? "-" : "+"}
                          {num(m.quantity)}
                        </td>
                        <td>{money(m.unitCostCents)}</td>
                        <td>{m.status}</td>
                        <td>
                          <code>{m.operationId.slice(0, 8)}</code>
                        </td>
                      </tr>
                    ))
                  : data.transfers.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {new Date(t.requestedAt).toLocaleString("pt-BR")}
                        </td>
                        <td>{t.sourceBranch}</td>
                        <td>{t.destinationBranch}</td>
                        <td>{t.itemCount}</td>
                        <td>{num(t.totalQuantity)}</td>
                        <td>{t.status}</td>
                        <td>
                          <code>{t.operationId.slice(0, 8)}</code>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
      {operationOpen && (
        <OperationModal
          form={form}
          setForm={setForm}
          products={data.products}
          suppliers={data.suppliers}
          branches={data.branches}
          step={step}
          setStep={setStep}
          costs={costs}
          editing={editing}
          updateItem={updateItem}
          add={() => add("form")}
          close={() => setOperationOpen(false)}
          save={save}
        />
      )}{" "}
      {transferOpen && (
        <TransferModal
          value={transfer}
          setValue={setTransfer}
          branches={data.branches}
          products={data.products}
          update={(i, p) => updateItem(i, p, "transfer")}
          add={() => add("transfer")}
          close={() => setTransferOpen(false)}
          save={saveTransfer}
        />
      )}{" "}
      {filterOpen && (
        <div className="catalog-backdrop">
          <section
            className="catalog-modal stock-filter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-filter-title"
          >
            <header>
              <div>
                <span className="eyebrow">PESQUISA</span>
                <h2 id="stock-filter-title">FILTROS DE MOVIMENTAÇÃO</h2>
              </div>
              <button
                aria-label="Fechar filtros de movimentação"
                onClick={() => setFilterOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="finance-filter-grid">
              <SearchableMultiSelect
                label="Tipos"
                options={[
                  ...new Map(
                    data.movements.map((m) => [
                      m.typeCode,
                      { value: m.typeCode, label: m.typeName },
                    ]),
                  ).values(),
                ]}
                value={draft.types}
                onChange={(types) => setDraft((v) => ({ ...v, types }))}
              />
              <SearchableMultiSelect
                label="Produtos"
                options={data.products.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                value={draft.products}
                onChange={(products) => setDraft((v) => ({ ...v, products }))}
              />
              <SearchableMultiSelect
                label="Filiais"
                options={data.branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                value={draft.branches}
                onChange={(branches) => setDraft((v) => ({ ...v, branches }))}
              />
              <DateRangePicker
                from={draft.from}
                to={draft.to}
                onChange={(from, to) => setDraft((v) => ({ ...v, from, to }))}
              />
            </div>
            <footer>
              <button
                className="stock-filter-clear"
                onClick={() =>
                  setDraft({
                    types: [],
                    products: [],
                    branches: [],
                    from: "",
                    to: "",
                  })
                }
              >
                Limpar
              </button>
              <button
                className="catalog-modal-cancel"
                onClick={() => setFilterOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="catalog-primary stock-filter-apply"
                onClick={() => {
                  setFilters(draft);
                  setFilterOpen(false);
                }}
              >
                Aplicar
              </button>
            </footer>
          </section>
        </div>
      )}
      {reverseOpen && (
        <div className="catalog-backdrop">
          <section
            className="catalog-confirm stock-reverse-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="stock-reverse-title"
          >
            <span className="material-symbols-rounded">undo</span>
            <h2 id="stock-reverse-title">Estornar movimentação?</h2>
            <p>
              O saldo será recalculado e a operação permanecerá na auditoria.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo obrigatório"
            />
            <footer>
              <button
                className="catalog-modal-cancel"
                onClick={() => setReverseOpen(false)}
              >
                Voltar
              </button>
              <button className="danger stock-action-danger" onClick={reverse}>
                Estornar
              </button>
            </footer>
          </section>
        </div>
      )}
      {busy && <AppLoading text="Atualizando estoque..." />}
    </section>
  );
}
function ItemEditor({
  items,
  products,
  direction,
  costs,
  update,
  add,
  remove,
}: {
  items: Item[];
  products: Product[];
  direction: "IN" | "OUT";
  costs: number[];
  update: (i: number, p: Partial<Item>) => void;
  add: () => void;
  remove: (i: number) => void;
}) {
  return (
    <section className="stock-items">
      <header>
        <div>
          <strong>Produtos da movimentação</strong>
          <small>Inclua todos os itens antes de concluir.</small>
        </div>
        <button className="catalog-primary stock-item-add" onClick={add}>
          + Adicionar
        </button>
      </header>
      {items.map((item, i) => (
        <div className="stock-item-row" key={i}>
          <label>
            Produto
            <select
              value={item.productId}
              onChange={(e) => update(i, { productId: e.target.value })}
            >
              <option value="">Selecione</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantidade
            <input
              type="number"
              min=".001"
              step=".001"
              value={item.quantity}
              onChange={(e) => update(i, { quantity: Number(e.target.value) })}
            />
          </label>
          <label>
            Valor unitário
            <input
              value={
                direction === "OUT"
                  ? maskMoney(
                      Number(
                        products.find((p) => p.id === item.productId)
                          ?.costPriceCents ?? 0,
                      ),
                    )
                  : item.gross
              }
              disabled={direction === "OUT"}
              onChange={(e) =>
                update(i, { gross: maskMoney(parseMoney(e.target.value)) })
              }
            />
          </label>
          <div className="stock-item-cost">
            <span>Custo final</span>
            <strong>{maskMoney(costs[i] ?? 0)}</strong>
          </div>
          {direction === "IN" && (
            <label className="stock-check">
              <input
                type="checkbox"
                checked={item.replaceCost}
                onChange={(e) => update(i, { replaceCost: e.target.checked })}
              />
              Atualizar custo do produto
            </label>
          )}
          <button
            className="danger stock-item-remove"
            onClick={() => remove(i)}
            disabled={items.length === 1}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              delete
            </span>
            Remover
          </button>
        </div>
      ))}
    </section>
  );
}
function OperationModal({
  form,
  setForm,
  products,
  suppliers,
  branches,
  step,
  setStep,
  costs,
  editing,
  updateItem,
  add,
  close,
  save,
}: {
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  products: Product[];
  suppliers: Supplier[];
  branches: Branch[];
  step: number;
  setStep: (v: number) => void;
  costs: number[];
  editing: string;
  updateItem: (i: number, p: Partial<Item>) => void;
  add: () => void;
  close: () => void;
  save: () => void;
}) {
  const tabs = ["Identificação", "Produtos", "Nota fiscal", "Revisão"];
  return (
    <div className="catalog-backdrop">
      <section
        className={`catalog-modal stock-operation-modal ${
          editing
            ? "stock-operation-modal--edit"
            : "stock-operation-modal--create"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-operation-title"
      >
        <header>
          <div>
            <span className="eyebrow">ESTOQUE</span>
            <h2 id="stock-operation-title">
              {editing ? "CORRIGIR MOVIMENTAÇÃO" : "NOVA MOVIMENTAÇÃO"}
            </h2>
          </div>
          <button aria-label="Fechar movimentação" onClick={close}>×</button>
        </header>
        <nav className="stock-wizard" aria-label="Etapas da movimentação">
          {tabs.map((t, i) => (
            <button
              className={step === i ? "active" : ""}
              onClick={() => setStep(i)}
              key={t}
            >
              <span>{i + 1}</span>
              {t}
            </button>
          ))}
        </nav>
        <div className="stock-wizard-body">
          {step === 0 && (
            <div className="stock-form">
              <label>
                Tipo
                <select
                  value={form.direction}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      direction: e.target.value as "IN" | "OUT",
                      fiscalEnabled: e.target.value === "IN" && v.fiscalEnabled,
                    }))
                  }
                >
                  <option value="IN">Entrada</option>
                  <option value="OUT">Saída por perda</option>
                </select>
              </label>
              <label>
                Filial
                <select
                  value={form.branchId}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, branchId: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {branches.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data e hora
                <input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, occurredAt: e.target.value }))
                  }
                />
              </label>
              <label className="wide">
                Observações
                <textarea
                  maxLength={240}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, notes: e.target.value }))
                  }
                />
              </label>
            </div>
          )}
          {step === 1 && (
            <ItemEditor
              items={form.items}
              products={products}
              direction={form.direction}
              costs={costs}
              update={updateItem}
              add={add}
              remove={(i) =>
                setForm((v) => ({
                  ...v,
                  items: v.items.filter((_, n) => n !== i),
                }))
              }
            />
          )}{" "}
          {step === 2 && (
            <div className="stock-fiscal">
              <label className="stock-fiscal-toggle">
                <input
                  type="checkbox"
                  checked={form.fiscalEnabled}
                  disabled={form.direction === "OUT"}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, fiscalEnabled: e.target.checked }))
                  }
                />
                Esta entrada possui nota fiscal
              </label>
              {form.fiscalEnabled && (
                <div className="stock-form">
                  <label>
                    Fornecedor
                    <select
                      value={form.fiscal.supplierId}
                      onChange={(e) =>
                        setForm((v) => ({
                          ...v,
                          fiscal: { ...v.fiscal, supplierId: e.target.value },
                        }))
                      }
                    >
                      <option value="">Não informado</option>
                      {suppliers.map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {Object.entries({
                    documentType: "Tipo do documento",
                    documentNumber: "Número",
                    accessKey: "Chave de acesso",
                    issuedAt: "Data de emissão",
                    total: "Valor da nota",
                    freight: "Frete",
                    insurance: "Seguro",
                    icms: "ICMS",
                    icmsSt: "ICMS ST",
                    ipi: "IPI",
                    issuerCpf: "CPF emitente",
                    issuerCnpj: "CNPJ emitente",
                    stateCode: "UF",
                  }).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type={key === "issuedAt" ? "datetime-local" : "text"}
                        value={form.fiscal[key as keyof Form["fiscal"]]}
                        onChange={(e) =>
                          setForm((v) => ({
                            ...v,
                            fiscal: {
                              ...v.fiscal,
                              [key]: [
                                "total",
                                "freight",
                                "insurance",
                                "icms",
                                "icmsSt",
                                "ipi",
                              ].includes(key)
                                ? maskMoney(parseMoney(e.target.value))
                                : e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="stock-review">
              <article>
                <span>Operação</span>
                <strong>
                  {form.direction === "IN" ? "Entrada" : "Saída por perda"}
                </strong>
              </article>
              <article>
                <span>Filial</span>
                <strong>
                  {branches.find((b) => b.id === form.branchId)?.name ||
                    "Não selecionada"}
                </strong>
              </article>
              <article>
                <span>Produtos</span>
                <strong>{form.items.length}</strong>
              </article>
              <article>
                <span>Quantidade total</span>
                <strong>
                  {form.items.reduce((s, i) => s + Number(i.quantity), 0)}
                </strong>
              </article>
              <article>
                <span>Custo total</span>
                <strong>
                  {maskMoney(
                    form.items.reduce(
                      (s, i, n) => s + Number(i.quantity) * (costs[n] ?? 0),
                      0,
                    ),
                  )}
                </strong>
              </article>
              <article>
                <span>Documento fiscal</span>
                <strong>
                  {form.fiscalEnabled
                    ? form.fiscal.documentNumber || "Pendente"
                    : "Não informado"}
                </strong>
              </article>
            </div>
          )}
        </div>
        <footer>
          <button className="catalog-modal-cancel" onClick={close}>
            Cancelar
          </button>
          {step > 0 && (
            <button
              className="stock-modal-secondary"
              onClick={() => setStep(step - 1)}
            >
              Anterior
            </button>
          )}
          {step < 3 ? (
            <button
              className={`catalog-primary catalog-modal-submit ${
                editing
                  ? "catalog-modal-submit--edit"
                  : "catalog-modal-submit--create"
              }`}
              onClick={() => setStep(step + 1)}
            >
              Próxima
            </button>
          ) : (
            <button
              className={`catalog-primary catalog-modal-submit ${
                editing
                  ? "catalog-modal-submit--edit"
                  : "catalog-modal-submit--create"
              }`}
              onClick={save}
            >
              Concluir
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
function TransferModal({
  value,
  setValue,
  branches,
  products,
  update,
  add,
  close,
  save,
}: {
  value: {
    sourceBranchId: string;
    destinationBranchId: string;
    notes: string;
    items: Item[];
  };
  setValue: React.Dispatch<
    React.SetStateAction<{
      sourceBranchId: string;
      destinationBranchId: string;
      notes: string;
      items: Item[];
    }>
  >;
  branches: Branch[];
  products: Product[];
  update: (i: number, p: Partial<Item>) => void;
  add: () => void;
  close: () => void;
  save: () => void;
}) {
  return (
    <div className="catalog-backdrop">
      <section
        className="catalog-modal stock-operation-modal stock-transfer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-transfer-title"
      >
        <header>
          <div>
            <span className="eyebrow">ESTOQUE</span>
            <h2 id="stock-transfer-title">TRANSFERÊNCIA ENTRE FILIAIS</h2>
          </div>
          <button aria-label="Fechar transferência" onClick={close}>×</button>
        </header>
        <div className="stock-wizard-body">
          <div className="stock-form">
          <label>
            Origem
            <select
              value={value.sourceBranchId}
              onChange={(e) =>
                setValue((v) => ({ ...v, sourceBranchId: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              {branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Destino
            <select
              value={value.destinationBranchId}
              onChange={(e) =>
                setValue((v) => ({ ...v, destinationBranchId: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              {branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          </div>
          <ItemEditor
            items={value.items}
            products={products}
            direction="OUT"
            costs={value.items.map((i) =>
              Number(
                products.find((p) => p.id === i.productId)?.costPriceCents ?? 0,
              ),
            )}
            update={update}
            add={add}
            remove={(i) =>
              setValue((v) => ({
                ...v,
                items: v.items.filter((_, n) => n !== i),
              }))
            }
          />
          <label className="transfer-notes">
            Observação
            <textarea
              value={value.notes}
              onChange={(e) =>
                setValue((v) => ({ ...v, notes: e.target.value }))
              }
            />
          </label>
        </div>
        <footer>
          <button className="catalog-modal-cancel" onClick={close}>
            Cancelar
          </button>
          <button
            className="catalog-primary catalog-modal-submit catalog-modal-submit--create"
            onClick={save}
          >
            Concluir transferência
          </button>
        </footer>
      </section>
    </div>
  );
}
