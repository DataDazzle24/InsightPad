import { describe,expect,it } from 'vitest'
import { csvSafe,digits,isValidCnpj,isValidCpf,maskRegistrationValue,moneyFromCents } from './registration'

describe('registration security helpers',()=>{
 it('validates CPF check digits and rejects repeated digits',()=>{
  expect(isValidCpf('529.982.247-25')).toBe(true)
  expect(isValidCpf('529.982.247-24')).toBe(false)
  expect(isValidCpf('111.111.111-11')).toBe(false)
 })
 it('validates CNPJ check digits and rejects repeated digits',()=>{
  expect(isValidCnpj('04.252.011/0001-10')).toBe(true)
  expect(isValidCnpj('04.252.011/0001-11')).toBe(false)
  expect(isValidCnpj('00.000.000/0000-00')).toBe(false)
 })
 it('normalizes and masks registration values',()=>{
  expect(digits('(21) 99999-9999')).toBe('21999999999')
  expect(maskRegistrationValue('cpf','52998224725')).toBe('529.982.247-25')
  expect(maskRegistrationValue('postalCode','24700000')).toBe('24700-000')
  expect(moneyFromCents(12345)).toContain('123,45')
 })
 it('neutralizes spreadsheet formulas in CSV cells',()=>{
  expect(csvSafe('=HYPERLINK("x")')).toBe("'=HYPERLINK(\"x\")")
  expect(csvSafe('+1+1')).toBe("'+1+1")
  expect(csvSafe('Produto')).toBe('Produto')
 })
})
