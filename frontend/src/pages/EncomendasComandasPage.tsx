import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ActionDialog } from "../encomendas-comandas/ActionDialog";
import { DocumentEditor } from "../encomendas-comandas/DocumentEditor";
import { Calendar, type CalendarDay } from "../encomendas-comandas/Calendar";
import { calendarRange } from "../encomendas-comandas/calendarDates";
import { labels } from "../encomendas-comandas/types";
import {
  Dialog,
  Field,
  Header,
  Icon,
  Pager,
  Pill,
  Totals,
} from "../encomendas-comandas/ui";
import {
  balance,
  dateTime,
  localDate,
  money,
} from "../encomendas-comandas/money";
import {
  PaymentLedger,
  EventSummary,
} from "../encomendas-comandas/LedgerDetails";
import { printDocument } from "../encomendas-comandas/print";
import { pending as readPending } from "../encomendas-comandas/pending";
import {
  BusinessError,
  errorText,
  execute,
  read,
  resolve,
} from "../encomendas-comandas/service";
import type {
  Command,
  Detail,
  Document,
  Event,
  Item,
  Kind,
  ListResult,
  Lookup,
  OperationResult,
  Page,
  Pending,
  Receipt,
  Refund,
} from "../encomendas-comandas/types";
type Filters = {
  branchId: string;
  status: string;
  from: string;
  to: string;
  fulfillmentMode: string;
  refundOnly: boolean;
};
const emptyFilters: Filters = {
  branchId: "",
  status: "",
  from: "",
  to: "",
  fulfillmentMode: "",
  refundOnly: false,
};
const emptyLookup: Lookup = {
  branches: [],
  customers: [],
  products: [],
  paymentMethods: [],
  cashSessions: [],
  timezone: "America/Sao_Paulo",
  serverNow: "",
  catalogPageSize: 50,
};
const emptyList: ListResult = {
  rows: [],
  total: 0,
  offset: 0,
  pageSize: 25,
  serverNow: "",
  timezone: "America/Sao_Paulo",
  counts: { all: 0, late: 0, ready: 0, paid: 0, balanceCents: "0" },
  tables: [],
  codes: [],
};
export function EncomendasComandasPage({ kind }: { kind: Kind }) {
  const auth = useAuth(),
    location = useLocation(),
    navigate = useNavigate(),
    pageKey = kind === "ENCOMENDA" ? "ENCOMENDAS" : "COMANDAS",
    permission = auth.permissions[pageKey];
  const owner = useMemo(
    () => ({
      uid: auth.firebaseUser?.uid ?? "",
      tenantId: auth.profile?.tenant.id ?? "",
    }),
    [auth.firebaseUser?.uid, auth.profile?.tenant.id],
  );
  const title = kind === "ENCOMENDA" ? "Encomendas" : "Comandas";
  const [view, setView] = useState("OPEN"),
    [quick, setQuick] = useState("all"),
    [paidOnly, setPaidOnly] = useState(false),
    [choice, setChoice] = useState("");
  const [term, setTerm] = useState(""),
    [search, setSearch] = useState(""),
    [filters, setFilters] = useState<Filters>(emptyFilters),
    [filterDraft, setFilterDraft] = useState<Filters | null>(null);
  const [data, setData] = useState<
      ListResult & { calendarDays?: CalendarDay[] }
    >(emptyList),
    [lookup, setLookup] = useState<Lookup>(emptyLookup),
    [offset, setOffset] = useState(0),
    [revision, setRevision] = useState(0);
  const [confirmationBlocked, setConfirmationBlocked] = useState(true),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [refreshRequired, setRefreshRequired] = useState(false),
    [uncertain, setUncertain] = useState<Pending | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null),
    [selected, setSelected] = useState(""),
    [editor, setEditor] = useState(false),
    [editExisting, setEditExisting] = useState(false);
  const [action, setAction] = useState(""),
    [actionItem, setActionItem] = useState<Item | undefined>(),
    [detailTab, setDetailTab] = useState("ITEMS");
  const [receipts, setReceipts] = useState<Page<Receipt>>({
      rows: [],
      total: 0,
      offset: 0,
      pageSize: 25,
    }),
    [refunds, setRefunds] = useState<Page<Refund>>({
      rows: [],
      total: 0,
      offset: 0,
      pageSize: 25,
    }),
    [events, setEvents] = useState<Page<Event>>({
      rows: [],
      total: 0,
      offset: 0,
      pageSize: 25,
    }),
    [stock, setStock] = useState<{
      rows: {
        product_id: string;
        name: string;
        required: string;
        physical: string;
        reserved: string;
        available: string;
      }[];
    } | null>(null);
  const [anchor, setAnchor] = useState(""),
    [period, setPeriod] = useState<"MONTH" | "WEEK">("MONTH"),
    [day, setDay] = useState<string | null>(null),
    [dayRows, setDayRows] = useState<ListResult>(emptyList);
  const actionReasonsId = useId();
  const inFlight = useRef(false),
    detailRequest = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(term);
      setOffset(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);
  useEffect(() => {
    let live = true;
    setConfirmationBlocked(true);
    void readPending(owner)
      .then((p) => {
        if (live) {
          setUncertain(p);
          setConfirmationBlocked(false);
        }
      })
      .catch(() => {
        if (live)
          setError(
            "Não foi possível conferir a confirmação pendente. Use Atualizar dados antes de alterar registros.",
          );
      });
    return () => {
      live = false;
    };
  }, [owner]);
  const query = useMemo(
    () => ({
      kind,
      mode: view === "CALENDAR" ? "CALENDAR" : "LIST",
      view: view === "HISTORY" ? "HISTORY" : "OPEN",
      ...filters,
      term: search,
      quick: view === "HISTORY" ? "all" : quick,
      paidOnly: view === "HISTORY" ? false : paidOnly,
      table: choice.startsWith("table:") ? choice.slice(6) : "",
      code: choice.startsWith("code:") ? choice.slice(5) : "",
      offset,
      pageSize: 25,
      ...(view === "CALENDAR" && anchor
        ? {
            calendarFrom: calendarRange(anchor, period).from,
            calendarTo: calendarRange(anchor, period).to,
          }
        : {}),
    }),
    [
      kind,
      view,
      filters,
      search,
      quick,
      paidOnly,
      choice,
      offset,
      anchor,
      period,
    ],
  );
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    const request =
      view === "CALENDAR" && !anchor ? { ...query, mode: "LIST" } : query;
    void Promise.all([
      read<ListResult & { calendarDays?: CalendarDay[] }>(request),
      read<Lookup>({ mode: "LOOKUPS", kind }),
    ])
      .then(([rows, lookups]) => {
        if (!live) return;
        setData(rows);
        setLookup(lookups);
        if (!anchor) setAnchor(localDate(rows.serverNow, rows.timezone));
        if (
          (choice.startsWith("table:") &&
            !rows.tables.includes(choice.slice(6))) ||
          (choice.startsWith("code:") &&
            !rows.codes.some((c) => c.id === choice.slice(5)))
        )
          setChoice("");
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [query, kind, revision, anchor, view, choice]);
  const open = useCallback(
    async (id: string) => {
      const request = ++detailRequest.current;
      setDetail(null);
      setAction("");
      setError("");
      try {
        const next = await read<Detail>({
          mode: "DETAIL",
          kind,
          documentId: id,
        });
        if (request === detailRequest.current) {
          setDetail(next);
          setDetailTab("ITEMS");
          setReceipts({ rows: [], total: 0, offset: 0, pageSize: 25 });
          setRefunds({ rows: [], total: 0, offset: 0, pageSize: 25 });
          setEvents({ rows: [], total: 0, offset: 0, pageSize: 25 });
          setStock(null);
          return next;
        }
      } catch (e) {
        if (request === detailRequest.current) setError(errorText(e));
      }
      return null;
    },
    [kind],
  );
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("document");
    if (id)
      void open(id).then((loaded) => {
        if (
          loaded?.document.id === id &&
          new URLSearchParams(location.search).get("action") === "CANCEL_SALE"
        )
          setAction("CANCEL_SALE");
      });
  }, [location.search, open]);
  useEffect(() => {
    if (!detail) return;
    let live = true;
    const id = detail.document.id;
    const request =
      detailTab === "RECEIPTS"
        ? Promise.all([
            read<Page<Receipt>>({
              mode: "RECEIPTS",
              kind,
              documentId: id,
              offset: receipts.offset,
            }),
            read<Page<Refund>>({
              mode: "REFUNDS",
              kind,
              documentId: id,
              offset: refunds.offset,
            }),
          ])
        : detailTab === "EVENTS"
          ? read<Page<Event>>({
              mode: "EVENTS",
              kind,
              documentId: id,
              offset: events.offset,
            })
          : detailTab === "STOCK"
            ? read<{ rows: NonNullable<typeof stock>["rows"] }>({
                mode: "AVAILABILITY",
                kind,
                documentId: id,
              })
            : null;
    if (request)
      void request
        .then((value) => {
          if (!live) return;
          if (detailTab === "RECEIPTS") {
            const [received, returned] = value as [Page<Receipt>, Page<Refund>];
            setReceipts(received);
            setRefunds(returned);
          } else if (detailTab === "EVENTS") setEvents(value as Page<Event>);
          else setStock(value as NonNullable<typeof stock>);
        })
        .catch((e) => {
          if (live) setError(errorText(e));
        });
    return () => {
      live = false;
    };
  }, [detail, detailTab, kind, receipts.offset, refunds.offset, events.offset]);
  async function refresh(id?: string) {
    try {
      setUncertain(await readPending(owner));
      setConfirmationBlocked(false);
    } catch {
      setConfirmationBlocked(true);
      throw new Error("Não foi possível conferir a confirmação pendente.");
    }
    setRevision((v) => v + 1);
    if (id) {
      const next = await read<Detail>({ mode: "DETAIL", kind, documentId: id });
      setDetail(next);
    }
    setRefreshRequired(false);
  }
  async function mutate(
    actionName: string,
    payload: Record<string, unknown>,
    secondary?: Document,
  ): Promise<OperationResult | null> {
    if (inFlight.current || uncertain || refreshRequired || confirmationBlocked)
      return null;
    inFlight.current = true;
    setBusy(true);
    setNotice("");
    setError("");
    const command: Command = {
      operationId: crypto.randomUUID(),
      kind,
      action: actionName,
      payload,
      ...(!["CREATE_ORDER", "OPEN_COMMAND"].includes(actionName) && detail
        ? {
            documentId: detail.document.id,
            expectedVersion: detail.document.version,
          }
        : {}),
      ...(secondary
        ? {
            secondaryDocumentId: secondary.id,
            secondaryExpectedVersion: secondary.version,
          }
        : {}),
    };
    let result: OperationResult;
    try {
      result = await execute(owner, command);
    } catch (e) {
      setError(errorText(e));
      if (e instanceof BusinessError && e.result.error?.details?.shortages)
        setNotice(
          e.result.error.details.shortages
            .map(
              (s) =>
                `${s.productName ?? "Componente"}: necessário ${s.required}; disponível ${s.available}; faltante ${s.missing}`,
            )
            .join(" · "),
        );
      try {
        setUncertain(await readPending(owner));
      } catch {
        setConfirmationBlocked(true);
      }
      return null;
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
    setRefreshRequired(true);
    setNotice("Operação confirmada.");
    try {
      await refresh(
        String(result.effects?.relatedDocumentId ?? result.documentId ?? ""),
      );
    } catch {
      setError(
        "Operação confirmada. A atualização da tela falhou; use Atualizar dados. Não repita o recebimento.",
      );
    }
    return result;
  }
  async function checkPending(replay = false) {
    if (!uncertain || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const result = replay
        ? await execute(owner, uncertain.command, true)
        : await resolve(owner, uncertain.command);
      if (result.status === "UNKNOWN") {
        setNotice(
          "Resultado ainda incerto. Enviar novamente usará exatamente os mesmos dados e o identificador original.",
        );
        return;
      }
      setUncertain(null);
      if (result.status === "REJECTED")
        setError(errorText(new BusinessError(result)));
      else {
        setEditor(false);
        setAction("");
        setRefreshRequired(true);
        setNotice("Confirmação recuperada.");
        if (result.kind && result.kind !== kind && result.documentId) {
          navigate(
            `/vendas/${result.kind === "ENCOMENDA" ? "encomendas" : "comandas"}?document=${encodeURIComponent(result.documentId)}`,
          );
        } else await refresh(result.documentId);
      }
    } catch (e) {
      setError(errorText(e));
      setUncertain(await readPending(owner));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  function chooseAction(name: string, item?: Item) {
    setError("");
    setNotice("");
    setActionItem(item);
    setAction(name);
  }
  async function openDay(value: string, nextOffset = 0) {
    setDay(value);
    try {
      setDayRows(
        await read<ListResult>({
          ...query,
          mode: "LIST",
          day: value,
          offset: nextOffset,
        }),
      );
    } catch (e) {
      setError(errorText(e));
    }
  }
  const disabled =
      busy || Boolean(uncertain) || refreshRequired || confirmationBlocked,
    today = data.serverNow ? localDate(data.serverNow, data.timezone) : "",
    d = detail?.document;
  const actionProps = (name: string) => ({
    disabled: disabled || detail?.actions[name]?.allowed !== true,
    title: detail?.actions[name]?.reason
      ? errorText(new Error(detail.actions[name].reason!))
      : undefined,
    "aria-describedby": actionReasonsId,
  });
  const visibleActions = detail
    ? detail.terminal
      ? detail.document.status === "CANCELLED"
        ? BigInt(detail.refundPendingCents) > 0n
          ? ["REFUND"]
          : []
        : detail.document.sale_id &&
            ["CLOSED", "COMPLETED"].includes(detail.document.status)
          ? ["CANCEL_SALE"]
          : []
      : [
          ...(kind === "COMANDA"
            ? [
                "ADD_ITEM",
                "MOVE_TABLE",
                "TRANSFER_ITEMS",
                "MERGE",
                "ALLOCATE_RECEIPT",
              ]
            : [
                "EDIT_ORDER",
                "RESCHEDULE",
                ...(detail.document.reservation_state !== "RESERVED"
                  ? ["RESERVE"]
                  : []),
                ...(detail.document.status === "PENDING"
                  ? ["START_PREPARATION"]
                  : []),
                ...(detail.document.status !== "READY" ? ["MARK_READY"] : []),
              ]),
          "CANCEL",
          ...(BigInt(
            balance(
              detail.document.total_cents,
              detail.document.received_net_cents,
            ),
          ) > 0n
            ? ["RECEIVE"]
            : []),
          ...((kind === "COMANDA" || detail.document.status === "READY") &&
          BigInt(detail.document.total_cents) > 0n
            ? [
                BigInt(
                  balance(
                    detail.document.total_cents,
                    detail.document.received_net_cents,
                  ),
                ) > 0n
                  ? "RECEIVE_AND_COMPLETE"
                  : "COMPLETE",
              ]
            : []),
        ]
    : [];
  const table = (rows: Document[], history = false) => (
    <div className="ec-table-scroll">
      <table>
        <thead>
          <tr>
            {(kind === "ENCOMENDA"
              ? [
                  "Código",
                  "Cliente",
                  "Filial",
                  "Data e hora",
                  "Modalidade",
                  "Situação",
                  "Estoque",
                  "Total",
                  "Recebido",
                  "Saldo",
                  "",
                ]
              : [
                  "Código",
                  "Nome / mesa",
                  "Filial",
                  "Operador",
                  "Abertura",
                  "Encerramento",
                  "Total",
                  "Situação",
                  "",
                ]
            ).map((label, index) => (
              <th key={index}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              aria-selected={selected === row.id}
              onClick={() => setSelected(row.id)}
              onDoubleClick={() => void open(row.id)}
            >
              <td>
                <button className="ec-link" onClick={() => void open(row.id)}>
                  {row.code}
                </button>
              </td>
              {kind === "ENCOMENDA" ? (
                <>
                  <td>{row.customer_name}</td>
                  <td>{row.branch_name}</td>
                  <td>{dateTime(row.due_at, row.timezone_snapshot)}</td>
                  <td>
                    {row.fulfillment_mode === "DELIVERY"
                      ? "Entrega"
                      : "Retirada"}
                  </td>
                  <td>
                    <Pill value={row.status} />
                    {!history &&
                      row.due_at &&
                      new Date(row.due_at) < new Date(data.serverNow) && (
                        <Pill value="Atrasada" tone="red" />
                      )}
                    {history &&
                      row.status === "CANCELLED" &&
                      BigInt(row.received_net_cents) > 0n && (
                        <Pill value="Devolução pendente" tone="amber" />
                      )}
                  </td>
                  <td>
                    <Pill value={row.reservation_state} />
                  </td>
                  <td>{money(row.total_cents)}</td>
                  <td>{money(row.received_net_cents)}</td>
                  <td>
                    {row.status === "CANCELLED"
                      ? "—"
                      : money(balance(row.total_cents, row.received_net_cents))}
                  </td>
                </>
              ) : (
                <>
                  <td>{row.identification}</td>
                  <td>{row.branch_name}</td>
                  <td>{row.operator_name ?? row.opened_by_uid}</td>
                  <td>{dateTime(row.created_at, row.timezone_snapshot)}</td>
                  <td>
                    {dateTime(
                      row.completed_at ?? row.cancelled_at,
                      row.timezone_snapshot,
                    )}
                  </td>
                  <td>{money(row.total_cents)}</td>
                  <td>
                    <Pill value={row.status} />
                  </td>
                </>
              )}
              <td>
                <button
                  className="btn icon-btn"
                  aria-label={`Detalhes de ${row.code}`}
                  onClick={() => void open(row.id)}
                >
                  <Icon name="chevron_right" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !loading && (
        <p className="ec-empty">Nenhum registro nesta visão.</p>
      )}
    </div>
  );
  return (
    <div className="ip-ec">
      <main className="workspace module-workspace" aria-busy={loading || busy}>
        <Header
          title={title}
          view={view}
          onView={(v) => {
            setView(v);
            setOffset(0);
            setSelected("");
          }}
          views={
            kind === "ENCOMENDA"
              ? [
                  { id: "OPEN", label: "Lista", icon: "list" },
                  {
                    id: "CALENDAR",
                    label: "Calendário",
                    icon: "calendar_month",
                  },
                  { id: "HISTORY", label: "Histórico", icon: "history" },
                ]
              : [
                  { id: "OPEN", label: "Abertas", icon: "grid_view" },
                  { id: "HISTORY", label: "Histórico", icon: "history" },
                ]
          }
          actions={
            <>
              <button
                className="btn"
                onClick={() => setFilterDraft({ ...filters })}
              >
                <Icon name="filter_alt" />
                Filtros
              </button>
              {permission?.canCreate && (
                <button
                  className="btn primary"
                  disabled={disabled || !lookup.branches.length}
                  onClick={() => {
                    setEditExisting(false);
                    setEditor(true);
                  }}
                >
                  <Icon name="add" />
                  {kind === "ENCOMENDA" ? "Nova encomenda" : "Nova comanda"}
                </button>
              )}
            </>
          }
        />
        {uncertain && (
          <section role="alert" className="callout amber">
            <strong>Confirmação pendente</strong>
            <p>
              {uncertain.command.operationId}. Novas alterações estão bloqueadas
              até conferir o resultado.
            </p>
            <button
              className="btn"
              disabled={busy}
              onClick={() => void checkPending()}
            >
              Conferir resultado
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => void checkPending(true)}
            >
              Reenviar exatamente a operação original
            </button>
          </section>
        )}
        {error && (
          <div className="callout red" role="alert">
            {error}
            <button
              className="btn"
              onClick={() =>
                void refresh(d?.id).catch(() =>
                  setError(
                    "A consulta ainda não pôde ser atualizada. Nenhuma operação será repetida.",
                  ),
                )
              }
            >
              Atualizar dados
            </button>
          </div>
        )}
        {notice && (
          <p className="callout" role="status">
            {notice}
          </p>
        )}
        {kind === "ENCOMENDA" && view !== "HISTORY" && (
          <div className="summary" role="group" aria-label="Filtrar encomendas">
            {[
              {
                id: "all",
                label: "Em aberto",
                tone: "blue",
                icon: "shopping_bag",
                count: data.counts.all,
              },
              {
                id: "late",
                label: "Atrasadas",
                tone: "amber",
                icon: "warning",
                count: data.counts.late,
              },
              {
                id: "ready",
                label: "Prontas",
                tone: "green",
                icon: "check_circle",
                count: data.counts.ready,
              },
            ].map((metric) => (
              <button
                key={metric.id}
                type="button"
                className={`metric metric-${metric.tone}`}
                aria-pressed={quick === metric.id}
                aria-controls="ec-results"
                onClick={() => {
                  setQuick(quick === metric.id ? "all" : metric.id);
                  setOffset(0);
                }}
              >
                <span className={`metric-icon ${metric.tone}`}>
                  <Icon name={metric.icon} />
                </span>
                <span className="metric-copy">
                  <span>{metric.label}</span>
                  <strong>{metric.count}</strong>
                </span>
              </button>
            ))}
          </div>
        )}
        <section className="surface mosaic-panel" id="ec-results">
          <div className="table-toolbar">
            <div className="surface-title">
              <h2>
                {view === "HISTORY"
                  ? "Histórico"
                  : kind === "COMANDA"
                    ? "Atendimento em andamento"
                    : "Encomendas"}
              </h2>
              <span>{data.total} registros</span>
              {kind === "COMANDA" && view === "OPEN" && (
                <div
                  className="command-metrics"
                  role="group"
                  aria-label="Indicadores de comandas"
                >
                  <span className="metric-tag tag-blue">
                    Comandas abertas <strong>{data.counts.all}</strong>
                  </span>
                  <span className="metric-tag tag-amber">
                    Saldo em aberto{" "}
                    <strong>{money(data.counts.balanceCents)}</strong>
                  </span>
                  <button
                    className="metric-tag tag-green"
                    aria-pressed={paidOnly}
                    onClick={() => {
                      setPaidOnly((v) => !v);
                      setOffset(0);
                    }}
                  >
                    Quitadas a fechar <strong>{data.counts.paid}</strong>
                  </button>
                </div>
              )}
            </div>
            <div className="table-actions">
              {kind === "COMANDA" && view === "OPEN" ? (
                <div className="command-picker">
                  <select
                    aria-label="Filtrar por mesa ou código"
                    value={choice}
                    onChange={(e) => {
                      setChoice(e.target.value);
                      setOffset(0);
                    }}
                  >
                    <option value="">Todas as mesas e códigos</option>
                    <optgroup label="Por mesa">
                      {data.tables.map((name) => (
                        <option key={name} value={`table:${name}`}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Por código">
                      {data.codes.map((c) => (
                        <option key={c.id} value={`code:${c.id}`}>
                          {c.code} · {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <input
                  aria-label={
                    kind === "ENCOMENDA"
                      ? "Buscar cliente ou código"
                      : "Buscar mesa ou código"
                  }
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={
                    kind === "ENCOMENDA"
                      ? "Cliente ou código"
                      : "Mesa ou código"
                  }
                />
              )}
              {selected && (
                <button className="btn" onClick={() => void open(selected)}>
                  Detalhes
                </button>
              )}
            </div>
          </div>
          {loading && (
            <p role="status" className="ec-empty">
              Carregando registros…
            </p>
          )}
          {view === "CALENDAR" && anchor ? (
            <Calendar
              anchor={anchor}
              period={period}
              today={today}
              now={data.serverNow}
              zone={data.timezone}
              days={data.calendarDays ?? []}
              onAnchor={setAnchor}
              onPeriod={setPeriod}
              onOpen={(id) => void open(id)}
              onDay={(id) => void openDay(id)}
            />
          ) : kind === "COMANDA" && view === "OPEN" ? (
            <div className="command-results">
              <div className="mosaic">
                {data.rows.map((row) => (
                  <button
                    key={row.id}
                    className="command-tile"
                    onClick={() => void open(row.id)}
                  >
                    <span className="tile-top">
                      <span className="tile-code">
                        <Icon name="receipt_long" />
                        {row.code}
                      </span>
                      <Icon name="chevron_right" />
                    </span>
                    <span className="tile-heading">
                      <strong className="tile-title">
                        {row.identification}
                      </strong>
                      <Pill
                        value={
                          BigInt(row.total_cents) > 0n &&
                          row.total_cents === row.received_net_cents
                            ? "Quitada · Aguardando fechamento"
                            : "Em atendimento"
                        }
                        tone={
                          row.total_cents === row.received_net_cents &&
                          BigInt(row.total_cents) > 0n
                            ? "green"
                            : "blue"
                        }
                      />
                    </span>
                    <span className="tile-meta">
                      {row.branch_name} ·{" "}
                      {Math.max(
                        0,
                        Math.floor(
                          (new Date(data.serverNow).getTime() -
                            new Date(row.created_at).getTime()) /
                            60000,
                        ),
                      )}{" "}
                      min
                    </span>
                    <span className="tile-amounts">
                      <span>
                        Total<b>{money(row.total_cents)}</b>
                      </span>
                      <span>
                        Recebido<b>{money(row.received_net_cents)}</b>
                      </span>
                      <span>
                        Saldo
                        <b>
                          {money(
                            balance(row.total_cents, row.received_net_cents),
                          )}
                        </b>
                      </span>
                    </span>
                  </button>
                ))}
                {!data.rows.length && !loading && (
                  <p className="ec-empty">Nenhum registro nesta visão.</p>
                )}
              </div>
            </div>
          ) : (
            table(data.rows, view === "HISTORY")
          )}
          {view !== "CALENDAR" && (
            <Pager
              total={data.total}
              offset={offset}
              pageSize={25}
              onPage={setOffset}
            />
          )}
        </section>
        {filterDraft && (
          <Dialog
            title="Filtros"
            onClose={() => setFilterDraft(null)}
            wide={false}
            footer={
              <>
                <button className="btn" onClick={() => setFilterDraft(null)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  onClick={() => setFilterDraft({ ...emptyFilters })}
                >
                  Limpar
                </button>
                <button
                  className="btn good"
                  onClick={() => {
                    if (
                      filterDraft.from &&
                      filterDraft.to &&
                      filterDraft.from > filterDraft.to
                    ) {
                      setError(
                        "O período inicial não pode ultrapassar o final.",
                      );
                      return;
                    }
                    setFilters(filterDraft);
                    setOffset(0);
                    setFilterDraft(null);
                  }}
                >
                  Aplicar
                </button>
              </>
            }
          >
            <div className="ec-grid-2">
              <Field label="Filial">
                <select
                  value={filterDraft.branchId}
                  onChange={(e) =>
                    setFilterDraft({ ...filterDraft, branchId: e.target.value })
                  }
                >
                  <option value="">Todas as autorizadas</option>
                  {lookup.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Situação">
                <select
                  value={filterDraft.status}
                  onChange={(e) =>
                    setFilterDraft({ ...filterDraft, status: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  {(kind === "ENCOMENDA"
                    ? [
                        "PENDING",
                        "PREPARING",
                        "READY",
                        "COMPLETED",
                        "CANCELLED",
                      ]
                    : ["OPEN", "CLOSED", "CANCELLED", "INCORPORATED"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {labels[s] ?? s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={
                  view === "HISTORY" ? "Encerramento de" : "Prazo / abertura de"
                }
              >
                <input
                  type="date"
                  value={filterDraft.from}
                  onChange={(e) =>
                    setFilterDraft({ ...filterDraft, from: e.target.value })
                  }
                />
              </Field>
              <Field label="Até (inclusive)">
                <input
                  type="date"
                  value={filterDraft.to}
                  onChange={(e) =>
                    setFilterDraft({ ...filterDraft, to: e.target.value })
                  }
                />
              </Field>
              {kind === "ENCOMENDA" && (
                <Field label="Modalidade">
                  <select
                    value={filterDraft.fulfillmentMode}
                    onChange={(e) =>
                      setFilterDraft({
                        ...filterDraft,
                        fulfillmentMode: e.target.value,
                      })
                    }
                  >
                    <option value="">Todas</option>
                    <option value="PICKUP">Retirada</option>
                    <option value="DELIVERY">Entrega</option>
                  </select>
                </Field>
              )}
              {view === "HISTORY" && (
                <label>
                  <input
                    type="checkbox"
                    checked={filterDraft.refundOnly}
                    onChange={(e) =>
                      setFilterDraft({
                        ...filterDraft,
                        refundOnly: e.target.checked,
                      })
                    }
                  />
                  Devolução pendente
                </label>
              )}
            </div>
          </Dialog>
        )}
        {detail && d && (
          <Dialog
            title={`${d.code} · ${kind === "ENCOMENDA" ? detail.customerName : d.identification}`}
            onClose={() => {
              setDetail(null);
              detailRequest.current++;
            }}
            busy={busy}
            footer={
              <>
                <button
                  className="btn"
                  onClick={() => setDetail(null)}
                  disabled={busy}
                >
                  Fechar
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => void refresh(d.id)}
                >
                  Atualizar dados
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    void printDocument(kind, d.id).catch((e) =>
                      setError(errorText(e)),
                    )
                  }
                >
                  Imprimir comprovante
                </button>
              </>
            }
          >
            <p>
              {detail.branchName} ·{" "}
              {dateTime(d.due_at ?? d.created_at, d.timezone_snapshot)} ·{" "}
              {detail.operatorName ?? d.opened_by_uid}
            </p>
            <div className="ec-badges">
              <Pill value={d.status} />
              <Pill value={d.reservation_state} />
            </div>
            <Totals document={d} />
            {d.status === "INCORPORATED" && (
              <p className="callout">
                Valores no momento da junção. Acompanhe o saldo e as devoluções
                na comanda de destino.
              </p>
            )}
            <nav className="module-views" aria-label="Detalhes do registro">
              {[
                ["ITEMS", "Itens"],
                ["RECEIPTS", "Recebimentos"],
                ["STOCK", "Estoque"],
                ["EVENTS", "Histórico"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={detailTab === id ? "current" : ""}
                  aria-current={detailTab === id ? "page" : undefined}
                  onClick={() => setDetailTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
            {detailTab === "ITEMS" && (
              <>
                <p>{detail.participants.map((p) => p.name).join(" · ")}</p>
                <div className="ec-table-scroll compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Pessoa / preparo</th>
                        <th>Subtotal</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((i) => (
                        <tr key={i.id}>
                          <td>
                            {i.product_name}
                            <small>{i.specifications}</small>
                            {i.status !== "ACTIVE" && <Pill value={i.status} />}
                          </td>
                          <td>
                            {i.quantity} {i.unit}
                          </td>
                          <td>
                            {detail.participants.find(
                              (p) => p.id === i.participant_id,
                            )?.name ?? "—"}
                            <Pill value={i.preparation_state} />
                          </td>
                          <td>{money(i.line_total_cents)}</td>
                          <td>
                            {kind === "COMANDA" &&
                              !detail.terminal &&
                              i.status === "ACTIVE" && (
                                <>
                                  <button
                                    className="btn"
                                    disabled={
                                      disabled ||
                                      i.actions?.PREPARE_ITEM?.allowed !== true
                                    }
                                    title={
                                      i.actions?.PREPARE_ITEM?.reason
                                        ? errorText(
                                            new Error(
                                              i.actions.PREPARE_ITEM.reason!,
                                            ),
                                          )
                                        : undefined
                                    }
                                    onClick={() =>
                                      chooseAction("PREPARE_ITEM", i)
                                    }
                                  >
                                    Preparo
                                  </button>
                                  <button
                                    className="btn"
                                    disabled={
                                      disabled ||
                                      i.actions?.ASSIGN_ITEM?.allowed !== true
                                    }
                                    title={
                                      i.actions?.ASSIGN_ITEM?.reason
                                        ? errorText(
                                            new Error(
                                              i.actions.ASSIGN_ITEM.reason!,
                                            ),
                                          )
                                        : undefined
                                    }
                                    onClick={() =>
                                      chooseAction("ASSIGN_ITEM", i)
                                    }
                                  >
                                    Pessoa
                                  </button>
                                  <button
                                    className="btn danger"
                                    disabled={
                                      disabled ||
                                      i.actions?.REMOVE_ITEM?.allowed !== true
                                    }
                                    title={
                                      i.actions?.REMOVE_ITEM?.reason
                                        ? errorText(
                                            new Error(
                                              i.actions.REMOVE_ITEM.reason!,
                                            ),
                                          )
                                        : undefined
                                    }
                                    onClick={() =>
                                      chooseAction("REMOVE_ITEM", i)
                                    }
                                  >
                                    Retirar
                                  </button>
                                </>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {BigInt(d.delivery_fee_cents) > 0n && (
                  <p>Taxa de entrega: {money(d.delivery_fee_cents)}</p>
                )}
                {d.delivery_address && (
                  <p>{Object.values(d.delivery_address).join(" · ")}</p>
                )}
                <p className="record-note">{d.notes}</p>
              </>
            )}
            {detailTab === "RECEIPTS" && (
              <PaymentLedger
                detail={detail}
                receipts={receipts}
                refunds={refunds}
                onReceiptsPage={(offset) =>
                  setReceipts((v) => ({ ...v, offset }))
                }
                onRefundsPage={(offset) =>
                  setRefunds((v) => ({ ...v, offset }))
                }
              />
            )}
            {detailTab === "STOCK" && (
              <div className="ec-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Componente</th>
                      <th>Necessário</th>
                      <th>Físico</th>
                      <th>Reservado</th>
                      <th>Disponível para esta revisão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock?.rows.map((s) => (
                      <tr key={s.product_id}>
                        <td>{s.name}</td>
                        <td>{s.required}</td>
                        <td>{s.physical}</td>
                        <td>{s.reserved}</td>
                        <td>{s.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detailTab === "EVENTS" && (
              <>
                <ol className="ec-timeline">
                  {events.rows.map((e) => (
                    <li key={e.id}>
                      <strong>{labels[e.event_type] ?? e.event_type}</strong>
                      <span>
                        {dateTime(e.occurred_at, d.timezone_snapshot)} ·{" "}
                        {e.actor_name ?? e.actor_uid}
                      </span>
                      <EventSummary event={e} zone={d.timezone_snapshot} />
                      {e.related_document_id && (
                        <button
                          className="ec-link"
                          onClick={() => void open(e.related_document_id!)}
                        >
                          Ver registro relacionado
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
                <Pager
                  {...events}
                  onPage={(next) => setEvents((v) => ({ ...v, offset: next }))}
                />
              </>
            )}
            <p id={actionReasonsId} className="record-note">
              {[
                ...new Set(
                  visibleActions
                    .map((name) => detail.actions[name]?.reason)
                    .filter((r): r is string => Boolean(r)),
                ),
              ]
                .map((reason) => errorText(new Error(reason)))
                .join(" · ")}
            </p>
            <div className="detail-actions ec-actions">
              {!detail.terminal ? (
                <>
                  {kind === "ENCOMENDA" ? (
                    <>
                      <button
                        className="btn edit"
                        {...actionProps("EDIT_ORDER")}
                        onClick={() => {
                          setEditExisting(true);
                          setEditor(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn"
                        {...actionProps("RESCHEDULE")}
                        onClick={() => chooseAction("RESCHEDULE")}
                      >
                        Remarcar
                      </button>
                      {d.reservation_state !== "RESERVED" && (
                        <button
                          className="btn"
                          {...actionProps("RESERVE")}
                          onClick={() => void mutate("RESERVE", {})}
                        >
                          Reservar estoque
                        </button>
                      )}
                      {d.status === "PENDING" && (
                        <button
                          className="btn"
                          {...actionProps("START_PREPARATION")}
                          onClick={() => void mutate("START_PREPARATION", {})}
                        >
                          Iniciar preparação
                        </button>
                      )}
                      {d.status !== "READY" && (
                        <button
                          className="btn good"
                          {...actionProps("MARK_READY")}
                          onClick={() => void mutate("MARK_READY", {})}
                        >
                          Marcar pronta
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="btn primary"
                        {...actionProps("ADD_ITEM")}
                        onClick={() => chooseAction("ADD_ITEM")}
                      >
                        Adicionar item
                      </button>
                      <button
                        className="btn"
                        {...actionProps("MOVE_TABLE")}
                        onClick={() => chooseAction("MOVE_TABLE")}
                      >
                        Trocar mesa
                      </button>
                      <button
                        className="btn"
                        {...actionProps("TRANSFER_ITEMS")}
                        onClick={() => chooseAction("TRANSFER_ITEMS")}
                      >
                        Transferir itens
                      </button>
                      <button
                        className="btn"
                        {...actionProps("MERGE")}
                        onClick={() => chooseAction("MERGE")}
                      >
                        Juntar comandas
                      </button>
                      <button
                        className="btn"
                        {...actionProps("ALLOCATE_RECEIPT")}
                        onClick={() => chooseAction("ALLOCATE_RECEIPT")}
                      >
                        Conciliar recebimentos
                      </button>
                    </>
                  )}
                  {BigInt(balance(d.total_cents, d.received_net_cents)) >
                    0n && (
                    <button
                      className="btn"
                      {...actionProps("RECEIVE")}
                      onClick={() => chooseAction("PAYMENT")}
                    >
                      Só receber
                    </button>
                  )}
                  {(kind === "COMANDA" || d.status === "READY") &&
                    BigInt(d.total_cents) > 0n && (
                      <button
                        className="btn good"
                        {...actionProps(
                          BigInt(balance(d.total_cents, d.received_net_cents)) >
                            0n
                            ? "RECEIVE_AND_COMPLETE"
                            : "COMPLETE",
                        )}
                        onClick={() =>
                          chooseAction(
                            BigInt(
                              balance(d.total_cents, d.received_net_cents),
                            ) > 0n
                              ? "RECEIVE_AND_COMPLETE"
                              : "COMPLETE",
                          )
                        }
                      >
                        {BigInt(balance(d.total_cents, d.received_net_cents)) >
                        0n
                          ? "Receber e concluir"
                          : kind === "ENCOMENDA"
                            ? "Concluir entrega"
                            : "Fechar comanda"}
                      </button>
                    )}
                  <button
                    className="btn danger"
                    {...actionProps("CANCEL")}
                    onClick={() => chooseAction("CANCEL")}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {d.sale_id &&
                    ["CLOSED", "COMPLETED"].includes(d.status) &&
                    detail.allowedActions.manage &&
                    auth.permissions.GESTAO_VENDAS?.canDelete && (
                      <button
                        className="btn danger"
                        {...actionProps("CANCEL_SALE")}
                        onClick={() => chooseAction("CANCEL_SALE")}
                      >
                        Cancelar venda vinculada
                      </button>
                    )}
                  {d.sale_id && (
                    <Link
                      className="btn"
                      to={`/vendas/registros?sale=${encodeURIComponent(d.sale_id)}`}
                    >
                      Ver venda vinculada
                    </Link>
                  )}
                  {d.merged_into_id && (
                    <button
                      className="btn"
                      onClick={() => void open(d.merged_into_id!)}
                    >
                      Ver comanda de destino
                    </button>
                  )}
                  {d.status === "CANCELLED" &&
                    BigInt(detail.refundPendingCents) > 0n && (
                      <button
                        className="btn"
                        {...actionProps("REFUND")}
                        onClick={() => chooseAction("REFUND")}
                      >
                        Registrar devolução · {money(detail.refundPendingCents)}
                      </button>
                    )}
                </>
              )}
            </div>
          </Dialog>
        )}
        {editor && (
          <DocumentEditor
            kind={kind}
            detail={editExisting ? (detail ?? undefined) : undefined}
            lookup={lookup}
            busy={busy}
            feedback={error ? [error, notice].join(" ") : ""}
            onRefresh={d ? () => refresh(d.id) : undefined}
            disabled={disabled}
            onClose={() => setEditor(false)}
            onSubmit={async (name, payload) =>
              Boolean(await mutate(name, payload))
            }
          />
        )}
        {action && detail && (
          <ActionDialog
            action={action}
            detail={detail}
            lookup={lookup}
            item={actionItem}
            feedback={error ? [error, notice].join(" ") : ""}
            onRefresh={() => refresh(detail.document.id)}
            busy={busy}
            disabled={disabled}
            onClose={() => setAction("")}
            onSubmit={mutate}
          />
        )}
        {day && (
          <Dialog title={`Encomendas de ${day}`} onClose={() => setDay(null)}>
            <>
              {table(dayRows.rows)}
              <Pager {...dayRows} onPage={(next) => void openDay(day, next)} />
            </>
          </Dialog>
        )}
      </main>
    </div>
  );
}
