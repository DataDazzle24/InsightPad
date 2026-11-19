import {
  labels,
  type Detail,
  type Kind,
  type Page,
  type Receipt,
  type Refund,
} from "./types";
import { dateTime, money, balance } from "./money";
import { read } from "./service";
export async function printDocument(kind: Kind, id: string): Promise<void> {
  const popup = window.open("", "_blank");
  if (!popup)
    throw new Error("Permita a abertura do comprovante no navegador.");
  popup.opener = null;
  try {
    const detail = await read<Detail>({ kind, mode: "DETAIL", documentId: id });
    const receipts: Receipt[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await read<Page<Receipt>>({
        kind,
        mode: "RECEIPTS",
        documentId: id,
        offset,
        pageSize: 100,
      });
      receipts.push(...page.rows);
      if (offset + page.pageSize >= page.total) break;
      if (page.rows.length === 0)
        throw new Error("A consulta dos recebimentos foi interrompida.");
    }
    const refunds: Refund[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await read<Page<Refund>>({
        kind,
        mode: "REFUNDS",
        documentId: id,
        offset,
        pageSize: 100,
      });
      refunds.push(...page.rows);
      if (offset + page.pageSize >= page.total) break;
      if (page.rows.length === 0)
        throw new Error("A consulta das devoluções foi interrompida.");
    }
    const current = await read<Detail>({
      kind,
      mode: "DETAIL",
      documentId: id,
    });
    if (current.document.version !== detail.document.version)
      throw new Error(
        "Os dados mudaram. Atualize e gere o comprovante novamente.",
      );
    const doc = popup.document;
    doc.title = `Comprovante ${detail.document.code}`;
    doc.documentElement.lang = "pt-BR";
    const style = doc.createElement("style");
    style.textContent =
      "@page{size:auto;margin:4mm}body{max-width:72mm;margin:auto;font:12px/1.4 monospace;color:#111;background:#fff}h1{font-size:18px}p{margin:5px 0}table{width:100%;border-collapse:collapse}td{padding:5px 0;border-bottom:1px dashed #999}td:last-child{text-align:right}small{display:block}button{margin:15px 0;padding:8px}@media print{button{display:none}}";
    doc.head.append(style);
    const text = (tag: string, value: string) => {
      const e = doc.createElement(tag);
      e.textContent = value;
      doc.body.append(e);
      return e;
    };
    text("h1", "Insight Pad");
    text("p", `COMPROVANTE OPERACIONAL · ${detail.document.code}`);
    text("p", "Documento sem valor fiscal.");
    text(
      "p",
      `${detail.branchName} · ${labels[detail.document.status] ?? detail.document.status}`,
    );
    text("p", detail.customerName ?? detail.document.identification);
    text(
      "p",
      dateTime(
        detail.document.due_at ?? detail.document.created_at,
        detail.timezone,
      ),
    );
    const table = doc.createElement("table");
    for (const item of detail.items.filter((i) => i.status === "ACTIVE")) {
      const row = table.insertRow();
      row.insertCell().textContent = `${item.product_name} · ${item.quantity} ${item.unit}`;
      row.insertCell().textContent = money(item.line_total_cents);
    }
    doc.body.append(table);
    if (BigInt(detail.document.delivery_fee_cents) > 0n)
      text(
        "p",
        "Taxa de entrega: " + money(detail.document.delivery_fee_cents),
      );
    text("p", "TOTAL: " + money(detail.document.total_cents));
    text("p", "Recebido líquido: " + money(detail.document.received_net_cents));
    text(
      "p",
      detail.document.status === "CANCELLED"
        ? "Devolução pendente: " + money(detail.refundPendingCents)
        : "Saldo: " +
            money(
              balance(
                detail.document.total_cents,
                detail.document.received_net_cents,
              ),
            ),
    );
    for (const receipt of receipts) {
      text(
        "p",
        `${dateTime(receipt.received_at, detail.timezone)} · ${receipt.method_name ?? "Recebimento"} · ${money(receipt.amount_cents)}`,
      );
      text(
        "small",
        `Operador: ${receipt.operator_name ?? receipt.operator_uid} · Caixa: ${receipt.cash_session_id ?? "Conforme política"} · Referência: ${receipt.reference || "—"}`,
      );
      if (
        receipt.balance_before_cents != null &&
        receipt.balance_after_cents != null
      )
        text(
          "small",
          `Saldo anterior: ${money(receipt.balance_before_cents)} · Saldo após recebimento: ${money(receipt.balance_after_cents)}`,
        );
      else
        text(
          "small",
          "Saldos deste recebimento não disponíveis no registro histórico.",
        );
      if (BigInt(receipt.change_cents) > 0n)
        text("small", "Troco: " + money(receipt.change_cents));
      if (BigInt(receipt.returned_cents) > 0n)
        text("small", "Devolvido: " + money(receipt.returned_cents));
    }
    for (const refund of refunds) {
      text(
        "p",
        `Devolução: ${money(refund.amount_cents)} · ${dateTime(refund.refunded_at, detail.timezone)} · ${refund.method_name}`,
      );
      text(
        "small",
        `Referência: ${refund.reference} · Motivo: ${refund.reason} · Operador: ${refund.operator_name ?? refund.operator_uid} · Autorização: ${refund.authorizer_name ?? "Ator autorizado no registro"}`,
      );
    }
    if (detail.document.sale_id)
      text("p", "Venda vinculada: " + detail.document.sale_id);
    const button = text("button", "Imprimir");
    button.addEventListener("click", () => popup.print());
    popup.focus();
    popup.print();
  } catch (error) {
    popup.close();
    throw error;
  }
}
