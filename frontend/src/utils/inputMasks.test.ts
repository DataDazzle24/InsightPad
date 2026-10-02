import { describe, expect, it } from 'vitest'
import { smartMaskInput } from './inputMasks'

function input(value: string, hint: string, mask?: string, type = 'text') {
  return { value, placeholder: hint, name: '', id: '', labels: [], type, dataset: { mask } } as unknown as HTMLInputElement
}

describe('shared input masks', () => {
  it('preserves a product name in mixed EAN/name search', () => {
    const field = input('CADERNO BRANCO', 'Código, EAN ou nome', 'none')
    smartMaskInput(field)
    expect(field.value).toBe('CADERNO BRANCO')
  })
  it('preserves customer names in mixed CPF/name search', () => {
    const field = input('Cliente de teste', 'Nome ou CPF', 'none')
    smartMaskInput(field)
    expect(field.value).toBe('Cliente de teste')
  })
  it('does not truncate long external codes in an unrestricted search', () => {
    const field = input('ID-123456789012345678901', 'Pesquisar EAN ou ID externo', 'none')
    smartMaskInput(field)
    expect(field.value).toBe('ID-123456789012345678901')
  })
  it.each([
    ['CPF', '00000000000', '000.000.000-00'],
    ['CNPJ', '00000000000000', '00.000.000/0000-00'],
    ['CEP', '00000000', '00000-000'],
    ['Telefone', '00000000000', '(00) 00000-0000'],
    ['EAN', '7898944500235', '7898944500235'],
  ])('retains the dedicated %s mask', (hint, value, expected) => {
    const field = input(value, hint)
    smartMaskInput(field)
    expect(field.value).toBe(expected)
  })
  it('normalizes dedicated email inputs', () => {
    const field = input(' QA @EXAMPLE.COM ', '', undefined, 'email')
    smartMaskInput(field)
    expect(field.value).toBe('qa@example.com')
  })
})
