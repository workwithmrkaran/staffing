/** Builds a CSV string. Cells that start with formula characters are prefixed to block CSV injection in Excel. */
export function toCsv<T extends object>(rows: T[], columns: { key: keyof T & string; header: string }[]): string {
  const escape = (value: unknown): string => {
    let text = value === null || value === undefined ? '' : String(value)
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const header = columns.map((c) => escape(c.header)).join(',')
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(',')).join('\r\n')
  return `${header}\r\n${body}`
}

export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel open the file as UTF-8.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
