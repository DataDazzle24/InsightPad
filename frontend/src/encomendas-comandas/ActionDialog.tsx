import { useEffect, useState, type FormEvent } from "react";
import type {
  Detail,
  Document,
  Item,
  Lookup,
  ListResult,
  OperationResult,
  Page,
  Plan,
  Receipt,
} from "./types";
import { Dialog, Field, Totals } from "./ui";
import { balance, cents, decimalCents, money, quantity } from "./money";
import { errorText, read } from "./service";
type Submit = (
  action: string,
  payload: Record<string, unknown>,
  secondary?: Document,
) => Promise<OperationResult | null>;
const titles: Record<string, string> = {
  PAYMENT: "Receber pagamento",
  RECEIVE_AND_COMPLETE: "Receber e concluir",
  COMPLETE: "Confirmar conclusão",
  ADD_ITEM: "Adicionar item",
  PREPARE_ITEM: "Atualizar preparo",
  ASSIGN_ITEM: "Atribuir pessoa",
  REMOVE_ITEM: "Retirar item",
  RESCHEDULE: "Remarcar encomenda",
  MOVE_TABLE: "Trocar mesa / nome",
  TRANSFER_ITEMS: "Transferir itens",
  MERGE: "Juntar comandas",
  CANCEL_SALE: "Cancelar venda vinculada",
  CANCEL: "Cancelar registro",
  REFUND: "Registrar devolução",
  ALLOCATE_RECEIPT: "Conciliar recebimento",
};
export function ActionDialog({
  action,
  detail,
  lookup,
  item,
  disabled,
  busy = false,
  feedback = "",
  onRefresh,
  onClose,
  onSubmit,
}: {
  action: string;
  detail: Detail;
  lookup: Lookup;
  item?: Item;
  disabled: boolean;
  busy?: boolean;
  feedback?: string;
  onRefresh?: () => Promise<void>;
  onClose: () => void;
  onSubmit: Submit;
}) {
  const d = detail.document,
    active = detail.items.filter((i) => i.status === "ACTIVE"),
    remaining = balance(d.total_cents, d.received_net_cents);
  const [mode, setMode] = useState("VALUE"),
    [planId, setPlanId] = useState(""),
    [shareId, setShareId] = useState("");
  const [approvalId, setApprovalId] = useState(""),
    [approvalNotice, setApprovalNotice] = useState("");
  const [selectedItem, setSelectedItem] = useState(
      item?.id ?? active[0]?.id ?? "",
    ),
    [person, setPerson] = useState(detail.participants[0]?.id ?? "");
  const [amount, setAmount] = useState(
      decimalCents(action === "REFUND" ? detail.refundPendingCents : remaining),
    ),
    [method, setMethod] = useState(lookup.paymentMethods[0]?.id ?? "");
  const [product, setProduct] = useState(lookup.products[0]?.id ?? ""),
    [products, setProducts] = useState(lookup.products),
    [term, setTerm] = useState("");
  const [targets, setTargets] = useState<ListResult | null>(null),
    [targetId, setTargetId] = useState(""),
    [targetOffset, setTargetOffset] = useState(0),
    [error, setError] = useState("");
  const [receiptPage, setReceiptPage] = useState<Page<Receipt>>({
      rows: [],
      total: 0,
      offset: 0,
      pageSize: 25,
    }),
    [review, setReview] = useState<{
      action: string;
      payload: Record<string, unknown>;
      secondary?: Document;
    } | null>(null);
  const plan: Plan | undefined = detail.plans.find(
    (p) => p.id === planId && p.status === "ACTIVE",
  );
  const share = plan?.shares.find((s) => s.id === shareId);
  const paymentMode = action === "PAYMENT" || action === "RECEIVE_AND_COMPLETE";
  const lockedAmount =
    action === "RECEIVE_AND_COMPLETE"
      ? remaining
      : share
        ? balance(share.amount_cents, share.paid_cents)
        : null;
  useEffect(() => {
    if (action !== "TRANSFER_ITEMS" && action !== "MERGE") return;
    let live = true;
    void read<ListResult>({
      mode: "TARGETS",
      kind: "COMANDA",
      branchId: d.branch_id,
      offset: targetOffset,
      pageSize: 25,
    })
      .then((r) => {
        if (live) setTargets(r);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [action, d.branch_id, targetOffset]);
  useEffect(() => {
    if (action !== "ADD_ITEM") return;
    let live = true;
    const timer = setTimeout(() => {
      void read<Lookup>({ mode: "LOOKUPS", kind: d.kind, productTerm: term })
        .then((r) => {
          if (live) setProducts(r.products);
        })
        .catch((e) => {
          if (live) setError(errorText(e));
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [action, d.kind, term]);
  useEffect(() => {
    if (action !== "ALLOCATE_RECEIPT") return;
    let live = true;
    void read<Page<Receipt>>({
      mode: "RECEIPTS",
      kind: d.kind,
      documentId: d.id,
      offset: receiptPage.offset,
    })
      .then((r) => {
        if (live) setReceiptPage(r);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [action, d.id, d.kind, receiptPage.offset]);
  const unallocated =
    detail.allocations
      .filter((a) => a.item_id)
      .reduce((sum, a) => sum + BigInt(a.amount_cents), 0n) <
    BigInt(d.received_net_cents);
  async function makePlan(form: HTMLFormElement) {
    try {
      const data = new FormData(form);
      const result = await onSubmit("CREATE_SPLIT", {
        mode,
        parts: Number(data.get("parts")),
        itemId: ["ITEM", "SHARED_ITEM"].includes(mode) ? selectedItem : null,
        participantId: mode === "PERSON" ? person : null,
      });
      if (result) {
        setPlanId(String(result.effects?.planId ?? ""));
        setShareId("");
      }
    } catch (e) {
      setError(errorText(e));
    }
  }
  function allocations(amountCents: string) {
    if (mode === "VALUE") return undefined;
    if (!plan || !share)
      throw new Error("Crie o plano e selecione uma parcela ainda não paga.");
    if (["ITEM", "SHARED_ITEM"].includes(plan.mode))
      return [{ itemId: plan.item_id, shareId: share.id, amountCents }];
    if (plan.mode === "PERSON") {
      let left = BigInt(amountCents);
      const result: {
        itemId: string;
        participantId: string;
        shareId: string;
        amountCents: string;
      }[] = [];
      for (const line of active.filter(
        (i) => i.participant_id === share.participant_id,
      )) {
        const paid = detail.allocations
            .filter((a) => a.item_id === line.id)
            .reduce((sum, a) => sum + BigInt(a.amount_cents), 0n),
          available = BigInt(line.line_total_cents) - paid;
        const applied = available < left ? available : left;
        if (applied > 0n)
          result.push({
            itemId: line.id,
            participantId: share.participant_id!,
            shareId: share.id,
            amountCents: applied.toString(),
          });
        left -= applied;
        if (left === 0n) break;
      }
      if (left !== 0n)
        throw new Error("Atualize os itens atribuídos antes de receber.");
      return result;
    }
    return [{ shareId: share.id, amountCents }];
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const f = new FormData(form);
    try {
      if (!form.reportValidity()) return;
      let payload: Record<string, unknown> = {},
        actual = action;
      let secondary: Document | undefined;
      if (paymentMode) {
        const paid = lockedAmount ?? cents(amount);
        const payment = {
          amountCents: paid,
          paymentMethodId: method,
          cashSessionId: String(f.get("cashSessionId") ?? "") || null,
          reference: String(f.get("reference") ?? ""),
          tenderedCents: String(f.get("tendered") ?? "")
            ? cents(String(f.get("tendered")))
            : paid,
          ...(action === "PAYMENT" && mode !== "VALUE"
            ? { allocations: allocations(paid) }
            : {}),
        };
        payload = action === "RECEIVE_AND_COMPLETE" ? { payment } : payment;
        actual = action === "PAYMENT" ? "RECEIVE" : action;
      } else if (action === "ADD_ITEM") {
        const p = products.find((p) => p.id === product);
        if (!p) throw new Error("Selecione um produto.");
        payload = {
          productId: p.id,
          quantity: quantity(String(f.get("quantity")), p.weighted_product),
          participantId: String(f.get("participantId") ?? "") || null,
          preparationState: String(f.get("state")),
          specifications: String(f.get("specifications") ?? ""),
          ...(lookup.cashPolicy?.canManage &&
          String(f.get("unitPriceCents") ?? "")
            ? { unitPriceCents: cents(String(f.get("unitPriceCents"))) }
            : {}),
        };
      } else if (action === "REMOVE_ITEM") {
        if (!item) throw new Error("Selecione o item.");
        payload = {
          itemId: item.id,
          quantity: quantity(String(f.get("quantity")), item.unit === "kg"),
          reason: String(f.get("reason")),
          disposition: String(f.get("disposition") ?? ""),
        };
      } else if (action === "PREPARE_ITEM")
        payload = { itemId: item?.id, state: String(f.get("state")) };
      else if (action === "ASSIGN_ITEM")
        payload = {
          itemId: item?.id,
          participantId: String(f.get("participantId") ?? "") || null,
        };
      else if (action === "MOVE_TABLE")
        payload = { identification: String(f.get("identification")) };
      else if (action === "RESCHEDULE")
        payload = { dueAtLocal: String(f.get("dueAtLocal")) };
      else if (["CANCEL", "CANCEL_SALE"].includes(action))
        payload = { reason: String(f.get("reason")) };
      else if (action === "REFUND") {
        payload = {
          amountCents: cents(amount),
          paymentMethodId: method,
          cashSessionId: String(f.get("cashSessionId") ?? "") || null,
          reason: String(f.get("reason")),
          reference: String(f.get("reference")),
          ...(approvalId ? { approvalId } : {}),
        };
        if (
          (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
            "value",
          ) === "approval"
        ) {
          actual = "REQUEST_REFUND_APPROVAL";
          delete payload.approvalId;
        }
      } else if (action === "COMPLETE")
        payload = {
          cashSessionId: String(f.get("cashSessionId") ?? "") || null,
        };
      else if (action === "TRANSFER_ITEMS" || action === "MERGE") {
        secondary = targets?.rows.find((row) => row.id === targetId);
        if (!secondary) throw new Error("Escolha uma comanda de destino.");
        if (action === "TRANSFER_ITEMS") {
          const items = active
            .filter((i) => f.has(`pick:${i.id}`))
            .map((i) => ({
              itemId: i.id,
              quantity: quantity(
                String(f.get(`quantity:${i.id}`)),
                i.unit === "kg",
              ),
            }));
          if (!items.length) throw new Error("Selecione pelo menos um item.");
          payload = { items };
        }
      } else if (action === "ALLOCATE_RECEIPT") {
        const entries = active
          .map((i) => ({
            itemId: i.id,
            amountCents: cents(String(f.get(`allocate:${i.id}`) ?? "0,00")),
          }))
          .filter((a) => BigInt(a.amountCents) > 0n);
        if (!entries.length) throw new Error("Informe as alocações.");
        payload = {
          receiptId: String(f.get("receiptId")),
          allocations: entries,
        };
      }
      setReview({ action: actual, payload, secondary });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revise os campos.");
      form.querySelector<HTMLElement>(":invalid")?.focus();
    }
  }
  async function confirm() {
    if (!review) return;
    try {
      const result = await onSubmit(
        review.action,
        review.payload,
        review.secondary,
      );
      if (result) {
        if (review.action === "REQUEST_REFUND_APPROVAL") {
          setApprovalId(String(result.effects?.approvalId ?? ""));
          setApprovalNotice(
            "Solicitação registrada. Outro gestor deve decidir na fila de aprovações do Caixa. Depois, use Atualizar aprovação.",
          );
          setReview(null);
        } else onClose();
      }
    } catch (e) {
      setError(errorText(e));
    }
  }
  const cashControl = (
    <Field label="Caixa do recebimento / devolução">
      <select name="cashSessionId">
        <option value="">Conforme política da empresa</option>
        {lookup.cashSessions
          .filter((s) => s.branch_id === d.branch_id)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.id.slice(0, 8)}
            </option>
          ))}
      </select>
    </Field>
  );
  return (
    <Dialog
      title={titles[action] ?? action}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => (review ? setReview(null) : onClose())}
          >
            {review ? "Voltar" : "Cancelar"}
          </button>
          {review ? (
            <button
              className="btn good"
              disabled={disabled}
              onClick={() => void confirm()}
            >
              {review.action === "REQUEST_REFUND_APPROVAL"
                ? "Confirmar solicitação"
                : "Confirmar"}
            </button>
          ) : (
            <>
              {action === "REFUND" &&
                !lookup.cashPolicy?.canManage &&
                lookup.paymentMethods.find((m) => m.id === method)
                  ?.requires_change && (
                  <button
                    form="ec-action"
                    className="btn"
                    name="intent"
                    value="approval"
                    disabled={disabled}
                  >
                    Solicitar aprovação de caixa
                  </button>
                )}
              <button form="ec-action" className="btn good" disabled={disabled}>
                Revisar
              </button>
            </>
          )}
        </>
      }
    >
      <Totals document={d} />
      {feedback && (
        <p role="alert" className="callout red">
          {feedback}
          {onRefresh && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => void onRefresh().then(() => setReview(null))}
            >
              Atualizar dados sem reenviar
            </button>
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="callout red">
          {error}
        </p>
      )}
      <form id="ec-action" onSubmit={submit} hidden={Boolean(review)}>
        <fieldset disabled={disabled} className="ec-fields">
          {paymentMode && (
            <>
              {action === "PAYMENT" && (
                <>
                  <Field label="Como receber">
                    <select
                      value={mode}
                      onChange={(e) => {
                        setMode(e.target.value);
                        setPlanId("");
                        setShareId("");
                      }}
                    >
                      <option value="VALUE">Por valor</option>
                      <option value="EQUAL">Dividir igualmente</option>
                      <option value="ITEM">Por itens</option>
                      <option value="PERSON">Por pessoa</option>
                      <option value="SHARED_ITEM">Item compartilhado</option>
                    </select>
                  </Field>
                  {mode !== "VALUE" && (
                    <section className="section-box">
                      <h3>Plano de divisão</h3>
                      {["ITEM", "SHARED_ITEM"].includes(mode) && (
                        <Field label="Item">
                          <select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                          >
                            {active.map((i) => (
                              <option value={i.id} key={i.id}>
                                {i.product_name} · {money(i.line_total_cents)}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      {mode === "PERSON" && (
                        <Field label="Pessoa">
                          <select
                            value={person}
                            onChange={(e) => setPerson(e.target.value)}
                          >
                            {detail.participants.map((p) => (
                              <option value={p.id} key={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label="Número de partes">
                        <input
                          name="parts"
                          type="number"
                          min={mode === "SHARED_ITEM" ? 2 : 1}
                          max={12}
                          defaultValue={mode === "SHARED_ITEM" ? 2 : 1}
                        />
                      </Field>
                      <button
                        type="button"
                        className="btn"
                        onClick={(e) => void makePlan(e.currentTarget.form!)}
                      >
                        Confirmar plano de divisão
                      </button>
                      {plan && (
                        <Field label="Parcela">
                          <select
                            value={shareId}
                            onChange={(e) => setShareId(e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {plan.shares.map((s) => (
                              <option
                                key={s.id}
                                value={s.id}
                                disabled={
                                  BigInt(s.paid_cents) >= BigInt(s.amount_cents)
                                }
                              >
                                Parcela {s.share_index + 1} ·{" "}
                                {money(balance(s.amount_cents, s.paid_cents))}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      {detail.plans.some((p) => p.status === "ACTIVE") &&
                        !plan && (
                          <Field label="Continuar plano existente">
                            <select
                              value=""
                              onChange={(e) => {
                                const p = detail.plans.find(
                                  (p) => p.id === e.target.value,
                                );
                                if (p) {
                                  setPlanId(p.id);
                                  setMode(p.mode);
                                }
                              }}
                            >
                              <option value="">
                                Escolher plano confirmado
                              </option>
                              {detail.plans
                                .filter((p) => p.status === "ACTIVE")
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.mode} · {money(p.total_cents)}
                                  </option>
                                ))}
                            </select>
                          </Field>
                        )}
                    </section>
                  )}
                </>
              )}
              <div className="ec-grid-3">
                <Field label="Valor a receber (R$)">
                  <input
                    inputMode="decimal"
                    required
                    readOnly={lockedAmount !== null}
                    value={
                      lockedAmount !== null
                        ? decimalCents(lockedAmount)
                        : amount
                    }
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field label="Meio de pagamento">
                  <select
                    required
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    {lookup.paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {cashControl}
                <Field label="Referência">
                  <input name="reference" maxLength={180} />
                </Field>
                {lookup.paymentMethods.find((m) => m.id === method)
                  ?.requires_change && (
                  <Field label="Dinheiro entregue (R$), se houver troco">
                    <input name="tendered" inputMode="decimal" />
                  </Field>
                )}
              </div>
              <p className="callout">
                Registro manual confirmado pelo operador. Não realiza cobrança
                automática no banco ou adquirente.
              </p>
            </>
          )}
          {action === "ADD_ITEM" && (
            <>
              <Field label="Buscar produto">
                <input value={term} onChange={(e) => setTerm(e.target.value)} />
              </Field>
              <Field label="Produto / combo">
                <select
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} · {money(p.effective_price_cents)}
                    </option>
                  ))}
                </select>
              </Field>
              {lookup.cashPolicy?.canManage && (
                <Field label="Preço unitário confirmado (R$)">
                  <input
                    key={product}
                    name="unitPriceCents"
                    defaultValue={decimalCents(
                      products.find((p) => p.id === product)
                        ?.effective_price_cents ?? "0",
                    )}
                    inputMode="decimal"
                    required
                  />
                </Field>
              )}
              <Field label="Quantidade">
                <input
                  name="quantity"
                  defaultValue="1"
                  inputMode="decimal"
                  required
                />
              </Field>
              <Field label="Especificações">
                <textarea name="specifications" maxLength={2000} />
              </Field>
            </>
          )}
          {["ADD_ITEM", "ASSIGN_ITEM"].includes(action) && (
            <Field label="Pessoa">
              <select
                name="participantId"
                defaultValue={item?.participant_id ?? ""}
              >
                <option value="">Sem atribuição</option>
                {detail.participants.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {["ADD_ITEM", "PREPARE_ITEM"].includes(action) && (
            <Field label="Preparo / serviço">
              <select
                name="state"
                defaultValue={item?.preparation_state ?? "NOTED"}
              >
                {["NOTED", "PREPARING", "PREPARED", "SERVED"].map((s, i) => (
                  <option
                    key={s}
                    value={s}
                    disabled={
                      Boolean(item) &&
                      i <
                        ["NOTED", "PREPARING", "PREPARED", "SERVED"].indexOf(
                          item!.preparation_state,
                        )
                    }
                  >
                    {["Anotado", "Em preparo", "Preparado", "Servido"][i]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {action === "REMOVE_ITEM" && (
            <>
              <p>
                {item?.product_name} · {item?.quantity} {item?.unit}
              </p>
              <Field label="Quantidade a retirar">
                <input
                  name="quantity"
                  defaultValue={item?.quantity}
                  inputMode="decimal"
                  required
                />
              </Field>
              {item?.preparation_state !== "NOTED" && (
                <Field label="Destino do item">
                  <select name="disposition" required>
                    <option value="">Selecionar</option>
                    <option value="RETURN_TO_AVAILABLE">
                      Retorna: liberar reserva
                    </option>
                    <option value="LOSS">Não retorna: registrar perda</option>
                  </select>
                </Field>
              )}
              <p className="callout">
                Item com pagamento não pode ser retirado diretamente. Perda
                baixa o físico uma vez.
              </p>
            </>
          )}
          {["REMOVE_ITEM", "CANCEL", "CANCEL_SALE", "REFUND"].includes(
            action,
          ) && (
            <Field label="Motivo *">
              <textarea name="reason" required maxLength={500} />
            </Field>
          )}
          {["CANCEL", "CANCEL_SALE"].includes(action) && (
            <p className="callout amber">
              As reservas serão liberadas. Preparados/servidos de comanda serão
              perdas.{" "}
              {BigInt(d.received_net_cents) > 0n
                ? `${money(d.received_net_cents)} ficarão pendentes de devolução. Cancelar não devolve dinheiro.`
                : "Não há recebimento a devolver."}
            </p>
          )}
          {action === "REFUND" && (
            <>
              {approvalNotice && (
                <p role="status" className="callout">
                  {approvalNotice}
                </p>
              )}
              <p className="callout">
                A gestão deste módulo não substitui a autorização do Caixa.
                Limite de saída sem aprovação adicional:{" "}
                {money(lookup.cashPolicy?.withdrawalLimitCents ?? "0")}.
              </p>
              {onRefresh && (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    void onRefresh().catch((e) => setError(errorText(e)))
                  }
                >
                  Atualizar aprovação
                </button>
              )}
              {detail.refundApprovals.length > 0 && (
                <Field label="Aprovação de caixa vinculada">
                  <select
                    value={approvalId}
                    onChange={(e) => setApprovalId(e.target.value)}
                  >
                    <option value="">Sem aprovação adicional</option>
                    {detail.refundApprovals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.status === "APPROVED"
                          ? "Aprovada"
                          : a.status === "PENDING"
                            ? "Aguardando decisão"
                            : a.status === "REJECTED"
                              ? "Recusada"
                              : a.status}{" "}
                        · {money(a.amountCents)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Valor a devolver (R$)">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </Field>
              <Field label="Meio de devolução">
                <select
                  required
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {lookup.paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              {cashControl}
              <Field label="Referência obrigatória">
                <input name="reference" required maxLength={180} />
              </Field>
            </>
          )}
          {action === "COMPLETE" && (
            <>
              {cashControl}
              <p className="callout green">
                Não será feito novo recebimento. O fechamento gera uma venda e
                consome somente a reserva ativa.
              </p>
            </>
          )}
          {action === "RESCHEDULE" && (
            <Field label="Novo prazo (horário da empresa)">
              <input name="dueAtLocal" type="datetime-local" required />
            </Field>
          )}
          {action === "MOVE_TABLE" && (
            <Field label="Nova mesa / nome">
              <input
                name="identification"
                defaultValue={d.identification}
                required
                maxLength={160}
              />
            </Field>
          )}
          {["TRANSFER_ITEMS", "MERGE"].includes(action) && (
            <>
              <Field label="Comanda de destino">
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">Selecionar</option>
                  {targets?.rows
                    .filter((t) => t.id !== d.id)
                    .map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.code} · {t.identification} · {money(t.total_cents)}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="ec-pager">
                <button
                  type="button"
                  className="btn"
                  disabled={targetOffset === 0}
                  onClick={() => setTargetOffset((v) => Math.max(0, v - 25))}
                >
                  Anteriores
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!targets || targetOffset + 25 >= targets.total}
                  onClick={() => setTargetOffset((v) => v + 25)}
                >
                  Próximas
                </button>
              </div>
              {action === "TRANSFER_ITEMS" &&
                active.map((i) => {
                  const paid = detail.allocations.some(
                    (a) => a.item_id === i.id,
                  );
                  return (
                    <div key={i.id} className="pick transfer-pick">
                      <label>
                        <input
                          type="checkbox"
                          name={`pick:${i.id}`}
                          disabled={paid || unallocated}
                        />
                        <span>
                          {i.product_name}
                          <small>
                            {paid
                              ? "Item com pagamento"
                              : unallocated
                                ? "Conciliação necessária"
                                : `${i.quantity} ${i.unit} · ${money(i.line_total_cents)}`}
                          </small>
                        </span>
                      </label>
                      <input
                        aria-label={`Quantidade de ${i.product_name}`}
                        name={`quantity:${i.id}`}
                        defaultValue={i.quantity}
                        inputMode="decimal"
                        disabled={paid || unallocated}
                      />
                    </div>
                  );
                })}
              <p className="callout">
                Preço, preparo, reservas e origem serão preservados. Esta ação
                não cria venda nem movimenta dinheiro.
              </p>
            </>
          )}
          {action === "ALLOCATE_RECEIPT" && (
            <>
              <Field label="Recebimento a conciliar">
                <select name="receiptId" required>
                  <option value="">Selecionar</option>
                  {receiptPage.rows.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.id.slice(0, 8)} ·{" "}
                      {money(balance(r.amount_cents, r.returned_cents))} ·{" "}
                      {r.reference}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="ec-pager">
                <button
                  type="button"
                  className="btn"
                  disabled={receiptPage.offset === 0}
                  onClick={() =>
                    setReceiptPage((v) => ({
                      ...v,
                      offset: Math.max(0, v.offset - 25),
                    }))
                  }
                >
                  Recebimentos anteriores
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={receiptPage.offset + 25 >= receiptPage.total}
                  onClick={() =>
                    setReceiptPage((v) => ({ ...v, offset: v.offset + 25 }))
                  }
                >
                  Próximos recebimentos
                </button>
              </div>
              <p className="callout">
                A alocação usa dinheiro já recebido; não cria nova entrada.
              </p>
              {active.map((i) => (
                <Field
                  key={i.id}
                  label={`${i.product_name} · ${money(i.line_total_cents)}`}
                >
                  <input
                    name={`allocate:${i.id}`}
                    inputMode="decimal"
                    defaultValue="0,00"
                  />
                </Field>
              ))}
            </>
          )}
        </fieldset>
      </form>
      {review && (
        <section className="section-box">
          <h3>Revisão da operação</h3>
          {review.action === "REQUEST_REFUND_APPROVAL" && (
            <p className="callout amber">
              Solicitar aprovação não devolve dinheiro. A decisão deve ser de
              outro gestor autenticado.
            </p>
          )}
          <p>
            {titles[action]} · {d.code}
          </p>
          {paymentMode && (
            <>
              <p>
                Saldo anterior: <strong>{money(remaining)}</strong>
              </p>
              <p>
                Receber:{" "}
                <strong>
                  {money(
                    String(
                      (
                        review.payload.payment as
                          | Record<string, unknown>
                          | undefined
                      )?.amountCents ?? review.payload.amountCents,
                    ),
                  )}
                </strong>
              </p>
              <p>
                Saldo após:{" "}
                <strong>
                  {money(
                    (
                      BigInt(remaining) -
                      BigInt(
                        String(
                          (
                            review.payload.payment as
                              | Record<string, unknown>
                              | undefined
                          )?.amountCents ?? review.payload.amountCents,
                        ),
                      )
                    ).toString(),
                  )}
                </strong>
              </p>
              <p>
                Meio: {lookup.paymentMethods.find((m) => m.id === method)?.name}
              </p>
              <p>
                Caixa:{" "}
                {String(
                  (
                    review.payload.payment as
                      | Record<string, unknown>
                      | undefined
                  )?.cashSessionId ??
                    review.payload.cashSessionId ??
                    "Conforme política",
                )}
              </p>
              <p>
                Referência:{" "}
                {String(
                  (
                    review.payload.payment as
                      | Record<string, unknown>
                      | undefined
                  )?.reference ??
                    review.payload.reference ??
                    "—",
                )}
              </p>
            </>
          )}
          {review.secondary && (
            <p>
              De {d.code} para {review.secondary.code} ·{" "}
              {review.secondary.identification}
            </p>
          )}
          {typeof review.payload.reason === "string" && (
            <p>Motivo: {review.payload.reason}</p>
          )}
          {action === "REFUND" && (
            <>
              <p>
                Devolver:{" "}
                <strong>{money(String(review.payload.amountCents))}</strong>
              </p>
              <p>
                Meio:{" "}
                {
                  lookup.paymentMethods.find(
                    (m) => m.id === review.payload.paymentMethodId,
                  )?.name
                }
              </p>
              <p>
                Caixa:{" "}
                {review.payload.cashSessionId
                  ? String(review.payload.cashSessionId).slice(0, 8)
                  : "Conforme política da empresa"}
              </p>
              <p>Referência: {String(review.payload.reference)}</p>
              {review.payload.approvalId ? (
                <p>
                  Aprovação de caixa:{" "}
                  {detail.refundApprovals.find(
                    (a) => a.id === review.payload.approvalId,
                  )?.status === "APPROVED"
                    ? "Aprovada"
                    : "A conferir"}{" "}
                  ·{" "}
                  {detail.refundApprovals.find(
                    (a) => a.id === review.payload.approvalId,
                  )?.approvedByUid ?? "aguardando gestor"}
                </p>
              ) : null}
            </>
          )}
          {action === "ADD_ITEM" && (
            <>
              <p>
                Produto:{" "}
                {products.find((p) => p.id === review.payload.productId)?.name}
              </p>
              <p>
                Quantidade: {String(review.payload.quantity)} ·{" "}
                {products.find((p) => p.id === review.payload.productId)
                  ?.weighted_product
                  ? "kg"
                  : "UN"}
              </p>
              <p>
                Preço atual:{" "}
                {money(
                  String(
                    review.payload.unitPriceCents ??
                      products.find((p) => p.id === review.payload.productId)
                        ?.effective_price_cents ??
                      "0",
                  ),
                )}
              </p>
              <p>
                Preparo:{" "}
                {String(review.payload.preparationState) === "NOTED"
                  ? "Anotado"
                  : String(review.payload.preparationState) === "PREPARING"
                    ? "Em preparo"
                    : String(review.payload.preparationState) === "PREPARED"
                      ? "Preparado"
                      : "Servido"}
              </p>
              <p>
                Reserva integral dos componentes; sem nova movimentação de
                dinheiro.
              </p>
            </>
          )}
          {action === "REMOVE_ITEM" && (
            <>
              <p>
                {item?.product_name} · retirar {String(review.payload.quantity)}{" "}
                {item?.unit}
              </p>
              <p>
                Estado:{" "}
                {item?.preparation_state === "PREPARING"
                  ? "Em preparo"
                  : item?.preparation_state === "PREPARED"
                    ? "Preparado"
                    : item?.preparation_state === "SERVED"
                      ? "Servido"
                      : "Anotado"}
              </p>
              <p>
                {review.payload.disposition === "LOSS"
                  ? "Registrar perda: baixar o físico e encerrar a reserva retirada uma única vez."
                  : "Liberar a reserva retirada: o físico não será aumentado."}
              </p>
              <p>
                Itens com pagamento continuam bloqueados até a conciliação
                necessária.
              </p>
            </>
          )}
          {action === "TRANSFER_ITEMS" && (
            <ul>
              {(
                review.payload.items as { itemId: string; quantity: string }[]
              ).map((row) => (
                <li key={row.itemId}>
                  {active.find((i) => i.id === row.itemId)?.product_name} ·{" "}
                  {row.quantity} {active.find((i) => i.id === row.itemId)?.unit}
                </li>
              ))}
            </ul>
          )}
          {action === "MERGE" && (
            <>
              <p>
                Comanda de origem ficará Incorporada. Recebimentos e itens
                manterão os vínculos de origem.
              </p>
              <p>Nenhum recebimento ou venda será criado pela junção.</p>
            </>
          )}
          {action === "MOVE_TABLE" && (
            <p>Nova mesa / nome: {String(review.payload.identification)}</p>
          )}
          {action === "RESCHEDULE" && (
            <p>
              Novo prazo: {String(review.payload.dueAtLocal)} ·{" "}
              {detail.timezone}
            </p>
          )}
          <p>
            Confira os dados antes de confirmar. Permissões, caixa e estoque
            serão conferidos novamente.
          </p>
        </section>
      )}
    </Dialog>
  );
}
