import { useEffect, useState, type FormEvent } from "react";
import { Dialog, Field, Icon } from "./ui";
import { cents, decimalCents, money, quantity } from "./money";
import { errorText, read } from "./service";
import type { Detail, Kind, Lookup } from "./types";
type Line = {
  id?: string;
  productId: string;
  name: string;
  quantity: string;
  unitPriceCents: string;
  priceDraft?: string;
  specifications: string;
  weighted: boolean;
};
export function DocumentEditor({
  kind,
  detail,
  lookup,
  disabled,
  busy = false,
  feedback = "",
  onRefresh,
  onClose,
  onSubmit,
}: {
  kind: Kind;
  detail?: Detail;
  lookup: Lookup;
  disabled: boolean;
  busy?: boolean;
  feedback?: string;
  onRefresh?: () => Promise<void>;
  onClose: () => void;
  onSubmit: (
    action: string,
    payload: Record<string, unknown>,
  ) => Promise<boolean>;
}) {
  const [branch, setBranch] = useState(
    detail?.document.branch_id ?? lookup.branches[0]?.id ?? "",
  );
  const [customer, setCustomer] = useState(detail?.document.customer_id ?? "");
  const [mode, setMode] = useState(
    detail?.document.fulfillment_mode ?? "PICKUP",
  );
  const [lines, setLines] = useState<Line[]>(
    detail?.items
      .filter((i) => i.status === "ACTIVE")
      .map((i) => ({
        id: i.id,
        productId: i.product_id,
        name: i.product_name,
        quantity: i.quantity,
        unitPriceCents: i.unit_price_cents,
        specifications: i.specifications,
        weighted: i.unit === "kg",
      })) ?? [],
  );
  const [products, setProducts] = useState(lookup.products),
    [customers, setCustomers] = useState(lookup.customers),
    [productTerm, setProductTerm] = useState(""),
    [customerTerm, setCustomerTerm] = useState("");
  const [review, setReview] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState(""),
    [fee, setFee] = useState(
      decimalCents(detail?.document.delivery_fee_cents ?? "0"),
    ),
    [payment, setPayment] = useState("0,00");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void read<Lookup>({ mode: "LOOKUPS", kind, productTerm, customerTerm })
        .then((x) => {
          if (active) {
            setProducts(x.products);
            setCustomers(x.customers);
          }
        })
        .catch((e) => {
          if (active) setError(errorText(e));
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kind, productTerm, customerTerm]);
  const patch = (index: number, changes: Partial<Line>) =>
    setLines((values) =>
      values.map((line, i) => (i === index ? { ...line, ...changes } : line)),
    );
  let total = 0n,
    totalValid = true;
  try {
    total = lines.reduce(
      (sum, line) => {
        const q = quantity(line.quantity, line.weighted),
          [whole, fraction = ""] = q.split(".");
        const units = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
        return (
          sum +
          (units *
            BigInt(
              line.priceDraft === undefined
                ? line.unitPriceCents
                : cents(line.priceDraft),
            ) +
            500n) /
            1000n
        );
      },
      mode === "DELIVERY" ? BigInt(cents(fee)) : 0n,
    );
  } catch {
    totalValid = false; /* Submit reports the invalid field without rounding. */
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      if (!form.reportValidity()) return;
      const payload: Record<string, unknown> = {
        branchId: branch,
        customerId: customer || null,
        notes: String(data.get("notes") ?? ""),
      };
      if (kind === "COMANDA") {
        payload.identification = String(
          data.get("identification") ?? "",
        ).trim();
        payload.participants = String(data.get("participants") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        if (!lines.length) throw new Error("Adicione pelo menos um produto.");
        Object.assign(payload, {
          fulfillmentMode: mode,
          dueAtLocal: String(data.get("dueAtLocal")),
          deliveryFeeCents: mode === "DELIVERY" ? cents(fee) : "0",
          deliveryAddress:
            mode === "DELIVERY"
              ? Object.fromEntries(
                  [
                    "street",
                    "streetNumber",
                    "district",
                    "city",
                    "state",
                    "postalCode",
                    "complement",
                  ].map((key) => [key, String(data.get(key) ?? "")]),
                )
              : null,
          reservationStrategy: String(data.get("reservationStrategy") ?? "NOW"),
          items: lines.map((line) => ({
            id: line.id,
            productId: line.productId,
            quantity: quantity(line.quantity, line.weighted),
            ...(line.id
              ? {}
              : {
                  unitPriceCents:
                    line.priceDraft === undefined
                      ? line.unitPriceCents
                      : cents(line.priceDraft),
                }),
            specifications: line.specifications,
          })),
        });
        if (
          !detail &&
          BigInt(cents(payment)) > 0n &&
          !data.get("paymentMethodId")
        )
          throw new Error("Selecione o meio de pagamento do sinal.");
        if (!detail && BigInt(cents(payment)) > 0n)
          payload.payment = {
            amountCents: cents(payment),
            paymentMethodId: String(data.get("paymentMethodId")),
            cashSessionId: String(data.get("cashSessionId") ?? "") || null,
            reference: String(data.get("reference") ?? ""),
          };
      }
      setReview(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revise os campos.");
      form.querySelector<HTMLElement>(":invalid")?.focus();
    }
  }
  const localDue = detail?.document.due_at
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: detail.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date(detail.document.due_at))
        .replace(" ", "T")
    : "";
  return (
    <Dialog
      title={
        detail
          ? "Editar encomenda"
          : kind === "ENCOMENDA"
            ? "Nova encomenda"
            : "Nova comanda"
      }
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            className="btn"
            onClick={() => (review ? setReview(null) : onClose())}
            disabled={busy}
          >
            {review ? "Voltar" : "Cancelar"}
          </button>
          {review ? (
            <button
              className="btn good"
              disabled={disabled}
              onClick={() =>
                void onSubmit(
                  detail
                    ? "EDIT_ORDER"
                    : kind === "ENCOMENDA"
                      ? "CREATE_ORDER"
                      : "OPEN_COMMAND",
                  review,
                ).then((ok) => {
                  if (ok) onClose();
                })
              }
            >
              {detail
                ? "Salvar alterações"
                : kind === "ENCOMENDA"
                  ? "Confirmar encomenda"
                  : "Abrir comanda"}
            </button>
          ) : (
            <button form="ec-editor" className="btn good" disabled={disabled}>
              Revisar
            </button>
          )}
        </>
      }
    >
      {feedback && (
        <p role="alert" className="callout red">
          {feedback}
          {onRefresh && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => void onRefresh()}
            >
              Atualizar dados sem reenviar
            </button>
          )}
        </p>
      )}
      <form id="ec-editor" onSubmit={submit} hidden={Boolean(review)}>
        <fieldset disabled={disabled} className="ec-fields">
          <div className="ec-grid-3">
            {kind === "COMANDA" && (
              <Field label="Nome / mesa *">
                <input
                  name="identification"
                  maxLength={160}
                  required
                  autoFocus
                />
              </Field>
            )}
            <Field label="Filial *">
              <select
                value={branch}
                required
                onChange={(e) => setBranch(e.target.value)}
                disabled={Boolean(
                  detail && BigInt(detail.document.received_net_cents) > 0n,
                )}
              >
                {lookup.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={`Cliente cadastrado${kind === "ENCOMENDA" ? " *" : " (opcional)"}`}
            >
              <input
                aria-label="Buscar cliente cadastrado"
                value={customerTerm}
                onChange={(e) => setCustomerTerm(e.target.value)}
                placeholder="Buscar pelo nome"
              />
              <select
                value={customer}
                required={kind === "ENCOMENDA"}
                onChange={(e) => {
                  const id = e.target.value;
                  setCustomer(id);
                }}
              >
                <option value="">Selecionar cliente</option>
                {!customers.some((c) => c.id === customer) && customer && (
                  <option value={customer}>
                    {detail?.customerName ?? "Cliente selecionado"}
                  </option>
                )}
                {customers.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {kind === "ENCOMENDA" && (
              <>
                <Field label="Modalidade">
                  <select
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as "PICKUP" | "DELIVERY")
                    }
                  >
                    <option value="PICKUP">Retirada</option>
                    <option value="DELIVERY">Entrega</option>
                  </select>
                </Field>
                <Field label="Data e hora *">
                  <input
                    type="datetime-local"
                    name="dueAtLocal"
                    required
                    defaultValue={localDue}
                  />
                  <small>Horário de {lookup.timezone}</small>
                </Field>
              </>
            )}
            {kind === "COMANDA" && (
              <Field label="Pessoas (separadas por vírgula)">
                <input name="participants" maxLength={2000} />
              </Field>
            )}
          </div>
          {kind === "ENCOMENDA" && mode === "DELIVERY" && (
            <section className="section-box">
              <h3>Endereço da entrega</h3>
              <div className="ec-grid-3">
                {[
                  ["street", "Rua *"],
                  ["streetNumber", "Número"],
                  ["district", "Bairro"],
                  ["city", "Cidade"],
                  ["state", "UF"],
                  ["postalCode", "CEP"],
                  ["complement", "Complemento"],
                ].map(([name, label]) => (
                  <Field label={label} key={name}>
                    <input
                      name={name}
                      required={name === "street"}
                      maxLength={160}
                      defaultValue={
                        detail?.document.delivery_address?.[name] ??
                        (name === "street"
                          ? customers.find((c) => c.id === customer)?.street
                          : "")
                      }
                    />
                  </Field>
                ))}
                <Field label="Taxa de entrega (R$)">
                  <input
                    value={fee}
                    inputMode="decimal"
                    onChange={(e) => setFee(e.target.value)}
                  />
                </Field>
              </div>
              <small>
                Este endereço fica na encomenda; não altera o cadastro do
                cliente.
              </small>
            </section>
          )}
          {kind === "ENCOMENDA" && (
            <section className="section-box">
              <h3>Produtos e combos</h3>
              <Field label="Buscar produto">
                <input
                  value={productTerm}
                  onChange={(e) => setProductTerm(e.target.value)}
                  placeholder="Nome ou código"
                />
              </Field>
              <Field label="Adicionar produto">
                <select
                  value=""
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    if (p)
                      setLines((v) => [
                        ...v,
                        {
                          productId: p.id,
                          name: p.name,
                          quantity: "1",
                          unitPriceCents: p.effective_price_cents,
                          specifications: "",
                          weighted: p.weighted_product,
                        },
                      ]);
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.bundle_product ? " · Combo" : ""} —{" "}
                      {money(p.effective_price_cents)}
                    </option>
                  ))}
                </select>
              </Field>
              <small>
                Busca paginada: até {lookup.catalogPageSize} resultados por
                termo.
              </small>
              {lines.map((line, index) => (
                <div className="item-edit" key={line.id ?? index}>
                  <div className="item-fields">
                    <strong>{line.name}</strong>
                    <Field label={`Quantidade${line.weighted ? " (kg)" : ""}`}>
                      <input
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) =>
                          patch(index, { quantity: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <div className="line-price">
                      {lookup.cashPolicy?.canManage && !line.id ? (
                        <Field label="Preço unitário (R$)">
                          <input
                            inputMode="decimal"
                            value={
                              line.priceDraft ??
                              decimalCents(line.unitPriceCents)
                            }
                            onChange={(e) =>
                              patch(index, { priceDraft: e.target.value })
                            }
                          />
                        </Field>
                      ) : (
                        <>
                          <span>Preço confirmado</span>
                          <strong>{money(line.unitPriceCents)}</strong>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn icon-btn danger"
                      aria-label={`Remover ${line.name}`}
                      onClick={() =>
                        setLines((v) => v.filter((_, i) => i !== index))
                      }
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                  <Field label="Especificações">
                    <input
                      maxLength={2000}
                      value={line.specifications}
                      onChange={(e) =>
                        patch(index, { specifications: e.target.value })
                      }
                    />
                  </Field>
                </div>
              ))}
              <div className="review-total">
                <span>Total previsto</span>
                <strong>
                  {totalValid
                    ? money(total.toString())
                    : "Revise quantidades e preços"}
                </strong>
              </div>
              {!detail && (
                <Field label="Reserva">
                  <select name="reservationStrategy">
                    <option value="NOW">Reservar agora</option>
                    <option value="WAIT">Aguardar produção / reposição</option>
                  </select>
                </Field>
              )}
              {detail?.document.status === "READY" && (
                <p className="callout amber">
                  Alterar itens ou filial exige nova revisão e retorna a
                  encomenda para Pendente.
                </p>
              )}
            </section>
          )}
          <Field label="Observação geral">
            <textarea
              name="notes"
              maxLength={2000}
              defaultValue={detail?.document.notes ?? ""}
            />
          </Field>
          {kind === "ENCOMENDA" && !detail && (
            <section className="section-box">
              <h3>Sinal opcional</h3>
              <div className="ec-grid-3">
                <Field label="Valor (R$)">
                  <input
                    inputMode="decimal"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  />
                </Field>
                <Field label="Meio de pagamento">
                  <select name="paymentMethodId">
                    <option value="">Selecionar</option>
                    {lookup.paymentMethods.map((m) => (
                      <option value={m.id} key={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Caixa">
                  <select name="cashSessionId">
                    <option value="">Conforme política da empresa</option>
                    {lookup.cashSessions
                      .filter((s) => s.branch_id === branch)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.id.slice(0, 8)}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Referência">
                  <input name="reference" maxLength={180} />
                </Field>
              </div>
              <p className="callout">
                O pagamento é registrado pelo operador. Não há cobrança
                automática ao provedor.
              </p>
            </section>
          )}
          {error && (
            <p role="alert" className="callout red">
              {error}
            </p>
          )}
        </fieldset>
      </form>
      {review && (
        <section className="section-box">
          <h3>Revisão do registro</h3>
          <p>Filial: {lookup.branches.find((b) => b.id === branch)?.name}</p>
          {kind === "ENCOMENDA" ? (
            <>
              <p>
                Cliente:{" "}
                {customers.find((c) => c.id === customer)?.name ??
                  detail?.customerName}
              </p>
              <p>
                Prazo: {String(review.dueAtLocal)} · {lookup.timezone}
              </p>
              <p>{mode === "DELIVERY" ? "Entrega" : "Retirada"}</p>
              <ul>
                {lines.map((line, index) => (
                  <li key={index}>
                    {line.name} · {line.quantity} {line.weighted ? "kg" : "UN"}{" "}
                    · preço{" "}
                    {money(
                      line.priceDraft === undefined
                        ? line.unitPriceCents
                        : cents(line.priceDraft),
                    )}
                  </li>
                ))}
              </ul>
              <p>
                Total previsto:{" "}
                <strong>
                  {totalValid
                    ? money(total.toString())
                    : "Revise quantidades e preços"}
                </strong>
              </p>
              {review.payment && typeof review.payment === "object" ? (
                <>
                  <p>
                    Sinal:{" "}
                    <strong>
                      {money(
                        String(
                          (review.payment as Record<string, unknown>)
                            .amountCents,
                        ),
                      )}
                    </strong>
                  </p>
                  <p>
                    Saldo após:{" "}
                    {money(
                      (
                        total -
                        BigInt(
                          String(
                            (review.payment as Record<string, unknown>)
                              .amountCents,
                          ),
                        )
                      ).toString(),
                    )}
                  </p>
                  <p>
                    Meio:{" "}
                    {
                      lookup.paymentMethods.find(
                        (m) =>
                          m.id ===
                          String(
                            (review.payment as Record<string, unknown>)
                              .paymentMethodId,
                          ),
                      )?.name
                    }
                  </p>
                </>
              ) : null}
              <p>
                {review.reservationStrategy === "WAIT"
                  ? "Será registrada sem reserva, aguardando produção ou reposição."
                  : "A reserva exige disponibilidade integral; o servidor revalidará o estoque."}
              </p>
            </>
          ) : (
            <>
              <p>Mesa / nome: {String(review.identification)}</p>
              <p>
                Pessoas:{" "}
                {(review.participants as string[]).join(" · ") ||
                  "Sem participantes"}
              </p>
            </>
          )}
        </section>
      )}
    </Dialog>
  );
}
