import { describe, it, expect } from 'vitest'
import { formatCsvValue, generateCsv, type CsvColumn } from './exportCsv'

describe('formatCsvValue', () => {
  it('formats null and undefined as empty string in quotes', () => {
    expect(formatCsvValue(null)).toBe('""')
    expect(formatCsvValue(undefined)).toBe('""')
  })

  it('formats simple numbers and booleans', () => {
    expect(formatCsvValue(123)).toBe('"123"')
    expect(formatCsvValue(true)).toBe('"true"')
  })

  it('formats simple text', () => {
    expect(formatCsvValue('Senha A001')).toBe('"Senha A001"')
  })

  it('escapes text with double quotes', () => {
    expect(formatCsvValue('Hello "World"')).toBe('"Hello ""World"""')
  })

  it('handles text with commas and newlines', () => {
    expect(formatCsvValue('Item 1, Item 2')).toBe('"Item 1, Item 2"')
    expect(formatCsvValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"')
  })

  it('formats Date objects as ISO strings', () => {
    const date = new Date('2026-08-29T12:00:00.000Z')
    expect(formatCsvValue(date)).toBe('"2026-08-29T12:00:00.000Z"')
  })
})

describe('generateCsv', () => {
  interface TestRow {
    id: string
    name: string
    amount: number
    notes?: string | null
    created_at: Date
  }

  const columns: CsvColumn<TestRow>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nome', accessor: 'name' },
    { header: 'Valor', accessor: (r) => `R$ ${r.amount.toFixed(2)}` },
    { header: 'Observações', accessor: 'notes' },
    { header: 'Data', accessor: (r) => r.created_at.toISOString().split('T')[0] },
  ]

  it('generates headers even with empty data', () => {
    const csv = generateCsv([], columns)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const lines = csv.slice(1).split('\r\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toBe('"ID","Nome","Valor","Observações","Data"')
  })

  it('generates rows with property keys and function accessors', () => {
    const data: TestRow[] = [
      {
        id: '1',
        name: 'Maria "Silva"',
        amount: 25.5,
        notes: 'Sem cebola, urgente',
        created_at: new Date('2026-08-29T10:00:00Z'),
      },
      {
        id: '2',
        name: 'João',
        amount: 10,
        notes: null,
        created_at: new Date('2026-08-29T11:00:00Z'),
      },
    ]

    const csv = generateCsv(data, columns)
    const lines = csv.slice(1).split('\r\n')
    expect(lines.length).toBe(3)
    expect(lines[0]).toBe('"ID","Nome","Valor","Observações","Data"')
    expect(lines[1]).toBe('"1","Maria ""Silva""","R$ 25.50","Sem cebola, urgente","2026-08-29"')
    expect(lines[2]).toBe('"2","João","R$ 10.00","","2026-08-29"')
  })
})
