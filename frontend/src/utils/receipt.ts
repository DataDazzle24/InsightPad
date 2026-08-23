import { lineTotal, money, type CartItem, type PaymentInput } from './sales'

export type ReceiptPayment = PaymentInput & { name: string }
export type SaleReceipt = {
  id: string
  tenant: { legalName: string; tradeName?: string; document?: string; email?: string; phone?: string }
  branch: { name: string; internalCode?: string; postalCode?: string; stateCode?: string; city?: string; district?: string; street?: string; streetNumber?: string; addressComplement?: string; phone?: string }
  customer: string
  operator: string
  items: CartItem[]
  payments: ReceiptPayment[]
  subtotalCents: number
  discountCents: number
  surchargeCents: number
  totalCents: number
  changeCents: number
  date: string
  offline: boolean
}

export const escapeReceiptHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')

const digits = (value?: string) => String(value ?? '').replace(/\D/g, '')
const documentLabel = (value?: string) => {
  const raw = digits(value)
  if (raw.length === 14) return `CNPJ ${raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}`
  if (raw.length === 11) return `CPF ${raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}`
  return value ? `Documento ${value}` : ''
}
const address = (branch: SaleReceipt['branch']) => [
  [branch.street, branch.streetNumber].filter(Boolean).join(', '), branch.addressComplement,
  [branch.district, branch.city, branch.stateCode].filter(Boolean).join(' - '), branch.postalCode && `CEP ${branch.postalCode}`,
].filter(Boolean).join(' · ')

export function receiptHtml(receipt: SaleReceipt) {
  const e = escapeReceiptHtml
  const establishment = receipt.tenant.tradeName || receipt.tenant.legalName
  const rows = receipt.items.map((item, index) => `<tr><td><b>${index + 1}. ${e(item.name)}</b><small>${e(item.productId.slice(0, 8).toUpperCase())}</small></td><td class="qty">${e(item.quantity)} × ${e(money(item.unitPriceCents))}</td><td class="value">${e(money(lineTotal(item)))}</td></tr>`).join('')
  const payments = receipt.payments.map(payment => `<div class="line"><span>${e(payment.name)}</span><b>${e(money(payment.amountCents))}</b></div>`).join('')
  const status = receipt.offline ? '<div class="warning"><b>VENDA REGISTRADA EM CONTINGÊNCIA</b><br>Aguardando sincronização com o servidor.</div>' : ''
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Comprovante ${e(receipt.id)}</title><style>@page{size:80mm auto;margin:4mm}*{box-sizing:border-box}body{width:72mm;margin:0 auto;color:#111;background:#fff;font:11px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace}.center{text-align:center}.brand{font:700 17px/1.2 Arial,sans-serif;margin:0 0 3px}.muted{color:#444}.separator{border:0;border-top:1px dashed #222;margin:7px 0}.meta{display:grid;grid-template-columns:auto 1fr;gap:2px 7px}.meta b{text-align:right;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}td{vertical-align:top;padding:5px 0;border-bottom:1px dotted #999}td small{display:block;color:#555}.qty{text-align:right;white-space:nowrap;padding-left:5px}.value{text-align:right;white-space:nowrap;padding-left:6px;font-weight:700}.line{display:flex;justify-content:space-between;gap:10px;margin:2px 0}.total{font-size:15px;border-top:1px solid #111;padding-top:5px}.warning{border:1px solid #111;padding:6px;text-align:center;margin:7px 0}.legal{font-size:9px;text-align:center;margin-top:8px}.operation{font-size:9px;overflow-wrap:anywhere}.no-print{margin:15px auto;text-align:center}.no-print button{padding:8px 16px}@media print{.no-print{display:none}body{width:auto}}</style></head><body><header class="center"><h1 class="brand">${e(establishment)}</h1><div>${e(receipt.tenant.legalName)}</div><div>${e(documentLabel(receipt.tenant.document))}</div><div>${e(address(receipt.branch))}</div><div>${e(receipt.branch.phone || receipt.tenant.phone || '')}</div></header><hr class="separator"><div class="center"><b>COMPROVANTE DE VENDA</b><br><span class="muted">Documento auxiliar não fiscal</span></div><hr class="separator"><div class="meta"><span>Data/hora</span><b>${e(new Date(receipt.date).toLocaleString('pt-BR'))}</b><span>Filial</span><b>${e(receipt.branch.name)}</b><span>Operador</span><b>${e(receipt.operator)}</b><span>Cliente</span><b>${e(receipt.customer)}</b></div><hr class="separator"><table><tbody>${rows}</tbody></table><hr class="separator"><div class="line"><span>Subtotal</span><b>${e(money(receipt.subtotalCents))}</b></div>${receipt.discountCents ? `<div class="line"><span>Desconto</span><b>- ${e(money(receipt.discountCents))}</b></div>` : ''}${receipt.surchargeCents ? `<div class="line"><span>Acréscimo</span><b>${e(money(receipt.surchargeCents))}</b></div>` : ''}<div class="line total"><span>TOTAL</span><b>${e(money(receipt.totalCents))}</b></div><hr class="separator"><b>PAGAMENTOS</b>${payments}<div class="line"><span>Troco</span><b>${e(money(receipt.changeCents))}</b></div>${status}<hr class="separator"><div class="center operation">Operação: ${e(receipt.id)}</div><p class="legal">Este comprovante registra a operação comercial no Insight Pad. Não substitui NFC-e, NF-e, SAT ou documento fiscal exigido pela legislação aplicável.</p><p class="center">Obrigado pela preferência!</p><div class="no-print"><button onclick="window.print()">Imprimir</button></div><script>window.addEventListener('load',()=>window.print())</script></body></html>`
}

export function printSaleReceipt(receipt: SaleReceipt) {
  const win = window.open('', 'insightpad-receipt', 'width=420,height=760')
  if (!win) throw new Error('O navegador bloqueou a janela de impressão. Permita pop-ups para o Insight Pad.')
  win.document.open()
  win.document.write(receiptHtml(receipt))
  win.document.close()
}
