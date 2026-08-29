export interface CsvColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined)
}

export function formatCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '""'
  }
  let str: string
  if (val instanceof Date) {
    str = val.toISOString()
  } else {
    str = String(val)
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export function generateCsv<T>(data: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const headerRow = columns.map(c => formatCsvValue(c.header)).join(',')
  const dataRows = data.map(row =>
    columns
      .map(col => {
        const val =
          typeof col.accessor === 'function'
            ? col.accessor(row)
            : (row as Record<string, unknown>)[col.accessor as string]
        return formatCsvValue(val)
      })
      .join(',')
  )

  const content = [headerRow, ...dataRows].join('\r\n')
  return `\uFEFF${content}`
}

export function downloadCsv(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
