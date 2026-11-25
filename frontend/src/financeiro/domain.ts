/** Exact wire contract: integer cents are canonical decimal strings, never JSON numbers. */
export type Cents = string
export type Direction = 'PAY' | 'RECEIVE'
const MAX = 9223372036854775807n

export class FinanceValidationError extends Error {
  readonly code: string
  constructor(code: string) { super(code); this.code = code; this.name = 'FinanceValidationError' }
}
function requireValue(ok: boolean, code: string): asserts ok {
  if (!ok) throw new FinanceValidationError(code)
}
export function cents(value: unknown, signed = false): bigint {
  requireValue(typeof value === 'string' && (signed ? /^(0|-?[1-9]\d*)$/ : /^(0|[1-9]\d*)$/).test(value), 'INVALID_CENTS')
  const parsed = BigInt(value)
  requireValue(parsed >= (signed ? -MAX : 0n) && parsed <= MAX, 'MONEY_RANGE')
  return parsed
}
export function wire(value: bigint): Cents {
  requireValue(value >= -MAX && value <= MAX, 'MONEY_RANGE')
  return value.toString()
}
/** Strict decimal entry; does not silently round fractions or parse exponential notation. */
export function parseMoney(value: string, signed = false): Cents {
  const normalized = value.trim().replace(',', '.')
  requireValue((signed ? /^-?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/).test(normalized), 'INVALID_MONEY')
  const negative = normalized.startsWith('-')
  const [whole, fraction = ''] = normalized.replace(/^-/, '').split('.')
  const total = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return wire(negative ? -total : total)
}
export function decimalBRL(value: Cents): string {
  const amount = cents(value, true), absolute = amount < 0n ? -amount : amount
  return `${amount < 0n ? '-' : ''}${absolute / 100n},${(absolute % 100n).toString().padStart(2, '0')}`
}
export function formatBRL(value: Cents): string {
  const [whole, fraction] = decimalBRL(value).split(',')
  return `R$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`
}
export function splitInstallments(total: Cents, count: number): Cents[] {
  const amount = cents(total)
  requireValue(Number.isInteger(count) && count >= 1 && count <= 120, 'INSTALLMENT_LIMIT')
  requireValue(amount >= BigInt(count), 'ZERO_INSTALLMENT')
  const quotient = amount / BigInt(count), remainder = amount % BigInt(count)
  return Array.from({ length: count }, (_, index) => wire(quotient + (BigInt(index) >= BigInt(count) - remainder ? 1n : 0n)))
}
/** Hamilton allocation: exact numeric products, stable original-order ties. */
export function allocate(total: Cents, weights: readonly Cents[]): Cents[] {
  const amount = cents(total), parsed = weights.map(value => cents(value))
  const denominator = parsed.reduce((sum, value) => sum + value, 0n)
  requireValue(parsed.length > 0 && denominator > 0n, 'EMPTY_ALLOCATION')
  const rows = parsed.map((weight, index) => ({ index, value: amount * weight / denominator, remainder: amount * weight % denominator }))
  let residue = amount - rows.reduce((sum, row) => sum + row.value, 0n)
  const ordered = [...rows].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1)
  for (const row of ordered) { if (residue === 0n) break; row.value += 1n; residue -= 1n }
  return rows.map(row => wire(row.value))
}
/** Both margins are preserved; each installment consumes only remaining capacity. */
export function allocationMatrix(installments: readonly Cents[], dimensions: readonly Cents[]): Cents[][] {
  const rows = installments.map(value => cents(value)), remaining = dimensions.map(value => cents(value))
  requireValue(rows.length > 0 && remaining.length > 0 && rows.every(value => value > 0n), 'EMPTY_ALLOCATION')
  requireValue(rows.reduce((a, b) => a + b, 0n) === remaining.reduce((a, b) => a + b, 0n), 'ALLOCATION_MARGINS')
  return rows.map((value, index) => {
    const allocation = index === rows.length - 1 ? remaining.map(wire) : allocate(wire(value), remaining.map(wire))
    allocation.forEach((part, dimension) => {
      const capacity = cents(part)
      requireValue(capacity <= remaining[dimension], 'ALLOCATION_CAPACITY')
      remaining[dimension] -= capacity
    })
    return allocation
  })
}
export interface SettlementLine {
  titleId: string
  expectedVersion: string
  principalCents: Cents
  discountCents: Cents
  interestCents: Cents
  penaltyCents: Cents
  feeCents: Cents
}
export function settlementCash(direction: Direction, line: Omit<SettlementLine, 'titleId' | 'expectedVersion'>, residual: Cents): Cents {
  const principal = cents(line.principalCents), discount = cents(line.discountCents)
  const interest = cents(line.interestCents), penalty = cents(line.penaltyCents), fee = cents(line.feeCents)
  requireValue(principal > 0n && principal <= cents(residual), 'PRINCIPAL_RANGE')
  requireValue(discount <= principal, 'DISCOUNT_RANGE')
  const effective = principal - discount + interest + penalty + (direction === 'PAY' ? fee : -fee)
  requireValue(effective >= 0n, 'NEGATIVE_CASH_LINE')
  return wire(effective)
}
function civilParts(value: string): [number, number, number] {
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(value), 'INVALID_DATE')
  const [year, month, day] = value.split('-').map(Number)
  requireValue(year >= 1900 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month), 'INVALID_DATE')
  return [year, month, day]
}
function daysInMonth(year: number, month: number): number {
  return [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}
/** Pass the ORIGINAL anchor, including on every recurrence iteration. */
export function addMonths(anchor: string, offset: number): string {
  const [year, month, day] = civilParts(anchor)
  requireValue(Number.isInteger(offset) && offset >= 0 && offset <= 1200, 'DATE_RANGE')
  const nextYear = year + Math.floor((month - 1 + offset) / 12), nextMonth = (month - 1 + offset) % 12 + 1
  requireValue(nextYear <= 9999, 'DATE_RANGE')
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(Math.min(day, daysInMonth(nextYear, nextMonth))).padStart(2, '0')}`
}
export function addDays(anchor: string, days: number): string {
  let [year, month, day] = civilParts(anchor)
  requireValue(Number.isInteger(days) && days >= 0 && days <= 36600, 'DATE_RANGE')
  day += days
  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month)
    if (++month === 13) { month = 1; year++ }
  }
  requireValue(year <= 9999, 'DATE_RANGE')
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function civilDate(value: string): string { civilParts(value); return value }

/** CSV text is untrusted; money is encoded explicitly, never inferred by content. */
export type ExportCell = { text: string } | { cents: Cents }
export function csv(rows: readonly (readonly ExportCell[])[]): string {
  return '\ufeff' + rows.map(row => row.map(cell => {
    let value = 'cents' in cell ? decimalBRL(cell.cents) : cell.text
    // eslint-disable-next-line no-control-regex -- spreadsheet parsers can ignore leading control characters.
    if ('text' in cell && /^[\s\u0000-\u001f]*[=+\-@]/u.test(value)) value = "'" + value
    return '"' + value.replace(/"/g, '""') + '"'
  }).join(';')).join('\r\n') + '\r\n'
}
