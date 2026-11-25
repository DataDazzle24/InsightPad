import { describe, expect, it } from 'vitest'
import { addDays, addMonths, allocate, allocationMatrix, cents, civilDate, csv, formatBRL, parseMoney, settlementCash, splitInstallments, wire } from './domain'

describe('Financeiro: centavos e margens exatas', () => {
  it('preserva Int64 sem conversão por Number, inclusive produto intermediário', () => {
    expect(cents('9007199254740991').toString()).toBe('9007199254740991')
    expect(parseMoney('90071992547409,91')).toBe('9007199254740991')
    expect(formatBRL('9007199254740991')).toBe('R$ 90.071.992.547.409,91')
    expect(allocate('9223372036854775807', ['9223372036854775806', '1'])).toEqual(['9223372036854775806', '1'])
    expect(() => wire(9223372036854775808n)).toThrow('MONEY_RANGE')
  })
  it.each([NaN, Infinity, 1, '1e3', '1.1', '-1', '01', '+1', ' 1', '9223372036854775808'])('rejeita centavos inválidos %s', value => {
    expect(() => cents(value)).toThrow()
  })
  it.each(['NaN', 'Infinity', '1e3', '1,001', '1.000,00', '1.234', '-0,01'])('não arredonda entrada inválida %s', value => {
    expect(() => parseMoney(value)).toThrow()
  })
  it('divide parcelas e rejeita principal zero', () => {
    expect(splitInstallments('10000', 3)).toEqual(['3333', '3333', '3334'])
    expect(() => splitInstallments('1', 3)).toThrow('ZERO_INSTALLMENT')
  })
  it('preserva as duas margens e desempate estável', () => {
    expect(allocate('100', ['1', '1', '1'])).toEqual(['34', '33', '33'])
    expect(allocationMatrix(['1', '1', '1'], ['1', '1', '1'])).toEqual([['1', '0', '0'], ['0', '1', '0'], ['0', '0', '1']])
    for (let total = 3; total < 180; total++) {
      const parts = splitInstallments(String(total), 3)
      const capacities = allocate(String(total), ['2', '7', '1', '3'])
      const matrix = allocationMatrix(parts, capacities)
      expect(matrix.map(row => wire(row.reduce((a, b) => a + cents(b), 0n)))).toEqual(parts)
      expect(capacities.map((_, col) => wire(matrix.reduce((a, row) => a + cents(row[col]), 0n)))).toEqual(capacities)
    }
  })
})
describe('Financeiro: baixa não confunde principal e dinheiro', () => {
  const line = { principalCents: '10000', discountCents: '1000', interestCents: '200', penaltyCents: '0', feeCents: '300' }
  it('receber retém tarifa; pagar adiciona', () => {
    expect(settlementCash('RECEIVE', line, '10000')).toBe('8900')
    expect(settlementCash('PAY', line, '10000')).toBe('9500')
  })
  it('desconto integral pode extinguir sem movimento zero', () => {
    expect(settlementCash('RECEIVE', { ...line, discountCents: '10000', interestCents: '0', feeCents: '0' }, '10000')).toBe('0')
  })
  it('rejeita cada linha negativa e principal/desconto fora da capacidade', () => {
    expect(() => settlementCash('RECEIVE', { ...line, feeCents: '10000' }, '10000')).toThrow('NEGATIVE_CASH_LINE')
    expect(() => settlementCash('PAY', line, '9999')).toThrow('PRINCIPAL_RANGE')
    expect(() => settlementCash('PAY', { ...line, discountCents: '10001' }, '10000')).toThrow('DISCOUNT_RANGE')
  })
})
describe('Financeiro: datas civis e exportação', () => {
  it('preserva âncora, ano bissexto e quinzena corrida', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
    expect(addMonths('2027-01-31', 2)).toBe('2027-03-31')
    expect(addMonths('2027-01-31', 13)).toBe('2028-02-29')
    expect(addDays('2028-02-20', 15)).toBe('2028-03-06')
    expect(() => civilDate('2027-02-29')).toThrow('INVALID_DATE')
  })
  it('exporta moeda exata, neutraliza fórmula textual e conserva acentos/aspas', () => {
    expect(csv([[{ text: '=1+1' }, { text: '\t@SUM(A1)' }, { text: 'ação "b"' }, { cents: '-9007199254740991' }]]))
      .toBe('\ufeff"\'=1+1";"\'\t@SUM(A1)";"ação ""b""";"-90071992547409,91"\r\n')
  })
})
