import type { Detail, Event, Page, Receipt, Refund } from "./types";
import { labels } from "./types";
import { dateTime, money } from "./money";
import { Pager } from "./ui";

const modes: Record<string, string> = {
  EQUAL: "Divisão igual",
  ITEM: "Por item",
  PERSON: "Por pessoa",
  SHARED_ITEM: "Item compartilhado",
};
const states: Record<string, string> = {
  ACTIVE: "Em andamento",
  PAID: "Quitado",
  SUPERSEDED: "Substituído; pagamentos preservados",
};

export function PaymentLedger({
  detail,
  receipts,
  refunds,
  onReceiptsPage,
  onRefundsPage,
}: {
  detail: Detail;
  receipts: Page<Receipt>;
  refunds: Page<Refund>;
  onReceiptsPage: (offset: number) => void;
  onRefundsPage: (offset: number) => void;
}) {
  const zone = detail.document.timezone_snapshot;
  return (
    <>
      <h3>Recebimentos</h3>
      <div
        className="ec-table-scroll ec-ledger-table"
        role="region"
        aria-label="Recebimentos confirmados"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Meio</th>
              <th>Recebido</th>
              <th>Troco</th>
              <th>Referência</th>
              <th>Caixa / operador</th>
              <th>Alocação</th>
            </tr>
          </thead>
          <tbody>
            {receipts.rows.map((r) => {
              const allocations = detail.allocations.filter(
                (a) => a.receipt_id === r.id,
              );
              return (
                <tr key={r.id}>
                  <td>{dateTime(r.received_at, zone)}</td>
                  <td>{r.method_name ?? "Meio indisponível"}</td>
                  <td>
                    {money(r.amount_cents)}
                    {r.balance_before_cents != null &&
                      r.balance_after_cents != null && (
                        <small>
                          Saldo: {money(r.balance_before_cents)} →{" "}
                          {money(r.balance_after_cents)}
                        </small>
                      )}
                    {BigInt(r.returned_cents) > 0n && (
                      <small>Devolvido: {money(r.returned_cents)}</small>
                    )}
                  </td>
                  <td>{money(r.change_cents)}</td>
                  <td>{r.reference || "—"}</td>
                  <td>
                    {r.cash_session_id?.slice(0, 8) ?? "Sem caixa (política)"} ·{" "}
                    {r.operator_name ?? r.operator_uid}
                  </td>
                  <td>
                    {allocations.length
                      ? allocations.map((a, index) => {
                          const item = detail.items.find(
                              (i) => i.id === a.item_id,
                            ),
                            person = detail.participants.find(
                              (p) => p.id === a.participant_id,
                            ),
                            share = detail.plans
                              .flatMap((p) => p.shares)
                              .find((s) => s.id === a.share_id);
                          return (
                            <small key={index}>
                              {item?.product_name ??
                                (share
                                  ? "Divisão confirmada"
                                  : "Valor conciliado")}
                              {person ? ` · ${person.name}` : ""}
                              {share
                                ? ` · parcela ${share.share_index + 1}`
                                : ""}
                              : {money(a.amount_cents)}
                              {!a.item_id && share
                                ? " recebidos na parcela; os vínculos por item fazem parte deste valor."
                                : " alocados ao item."}
                            </small>
                          );
                        })
                      : "Por valor; conciliação conforme necessidade"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager
        label="Paginação de recebimentos"
        {...receipts}
        onPage={onReceiptsPage}
      />
      {detail.plans.length > 0 && (
        <section className="section-box ec-ledger-plans">
          <h3>Planos de divisão confirmados</h3>
          {detail.plans.map((plan) => (
            <details key={plan.id}>
              <summary>
                {modes[plan.mode] ?? plan.mode} · {money(plan.total_cents)} ·{" "}
                {states[plan.status] ?? plan.status}
              </summary>
              <div
                className="ec-table-scroll ec-ledger-table"
                role="region"
                aria-label="Parcelas do plano"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Parcela / pessoa</th>
                      <th>Valor confirmado</th>
                      <th>Pago</th>
                      <th>Restante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.shares.map((s) => (
                      <tr key={s.id}>
                        <td>
                          Parcela {s.share_index + 1}
                          {s.participant_id
                            ? ` · ${detail.participants.find((p) => p.id === s.participant_id)?.name ?? "Pessoa de origem"}`
                            : ""}
                        </td>
                        <td>{money(s.amount_cents)}</td>
                        <td>{money(s.paid_cents)}</td>
                        <td>
                          {money(
                            (
                              BigInt(s.amount_cents) - BigInt(s.paid_cents)
                            ).toString(),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </section>
      )}
      <h3>Devoluções confirmadas</h3>
      <div
        className="ec-table-scroll ec-ledger-table"
        role="region"
        aria-label="Devoluções confirmadas"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Meio</th>
              <th>Devolvido</th>
              <th>Referência / motivo</th>
              <th>Caixa / operador</th>
              <th>Autorização</th>
            </tr>
          </thead>
          <tbody>
            {refunds.rows.map((r) => (
              <tr key={r.id}>
                <td>{dateTime(r.refunded_at, zone)}</td>
                <td>{r.method_name}</td>
                <td>
                  {money(r.amount_cents)}
                  <small>{r.receipt_count} recebimento(s) de origem</small>
                </td>
                <td>
                  {r.reference}
                  <small>{r.reason}</small>
                </td>
                <td>
                  {r.cash_session_id?.slice(0, 8) ?? "Conforme política"} ·{" "}
                  {r.operator_name ?? r.operator_uid}
                </td>
                <td>{r.authorizer_name ?? "Ator autorizado no registro"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!refunds.rows.length && (
          <p className="ec-empty">
            Nenhuma devolução confirmada neste recorte.
          </p>
        )}
      </div>
      <Pager
        label="Paginação de devoluções"
        {...refunds}
        onPage={onRefundsPage}
      />
    </>
  );
}

/** Show the persisted business effects; never render arbitrary JSON or SQL. */
export function EventSummary({ event, zone }: { event: Event; zone: string }) {
  const p = event.details,
    dispositions: Record<string, string> = {
      RELEASE_RESERVATION: "Reserva liberada, sem aumento do físico",
      RETURN_TO_AVAILABLE:
        "Reserva liberada para disponibilidade, sem aumento do físico",
      LOSS: "Perda: baixa física única",
    };
  return (
    <div className="record-note">
      {typeof p.reason === "string" && <p>Motivo: {p.reason}</p>}
      {typeof p.quantity === "string" && <p>Quantidade: {p.quantity}</p>}
      {typeof p.preparationState === "string" && (
        <p>Preparo: {labels[p.preparationState] ?? p.preparationState}</p>
      )}
      {typeof p.disposition === "string" && (
        <p>{dispositions[p.disposition] ?? p.disposition}</p>
      )}
      {event.event_type !== "REQUEST_REFUND_APPROVAL" &&
        typeof p.authorizerUid === "string" && (
          <p>Autorização: {event.authorizer_name ?? p.authorizerUid}</p>
        )}
      {typeof p.receivedCents === "string" && (
        <p>Recebido: {money(p.receivedCents)}</p>
      )}
      {typeof p.refundedCents === "string" && (
        <p>Devolvido: {money(p.refundedCents)}</p>
      )}
      {typeof p.refundPendingCents === "string" && (
        <p>Devolução pendente no registro: {money(p.refundPendingCents)}</p>
      )}
      {typeof p.previousDueAt === "string" && (
        <p>Prazo anterior: {dateTime(p.previousDueAt, zone)}</p>
      )}
      {typeof p.newDueAt === "string" && (
        <p>Novo prazo: {dateTime(p.newDueAt, zone)}</p>
      )}
      {typeof p.sourceCode === "string" && (
        <p>
          Origem: {p.sourceCode}
          {typeof p.targetCode === "string" ? ` → ${p.targetCode}` : ""}
        </p>
      )}
      {typeof p.current === "string" && (
        <p>
          Identificação:{" "}
          {typeof p.previous === "string" ? `${p.previous} → ` : ""}
          {p.current}
        </p>
      )}
    </div>
  );
}
