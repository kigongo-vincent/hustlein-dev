import { jsPDF } from 'jspdf'
import type { Company, Invoice, InvoiceLineItem } from '../types'

function formatDateShort(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as unknown as string[]
}

export function downloadInvoicePdf({
  invoice,
  company,
  taxRate,
  lineItems,
}: {
  invoice: Invoice
  company?: Company | null
  taxRate?: number
  lineItems: InvoiceLineItem[]
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 48
  const contentW = pageW - margin * 2

  const dark = '#111111'
  const muted = '#666666'

  const issuerName = company?.name || invoice.issuer?.name || 'Company'
  const issuerEmail = company?.email || invoice.issuer?.email
  const issuerPhone = company?.phone || invoice.issuer?.phone
  const issuerAddress = company?.address || invoice.issuer?.address

  const due = formatDateShort(invoice.dueDate)
  const issued = formatDateShort(invoice.issuedDate)
  const currency = invoice.currency || 'UGX'

  const subtotal = invoice.amount
  const tRate = typeof taxRate === 'number' ? taxRate : (company?.taxRate ?? 0)
  const taxAmount = tRate > 0 ? Math.round((subtotal * tRate) / 100) : 0
  const total = subtotal + taxAmount

  let y = 64

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(dark)
  doc.text('Invoice', margin, y)
  y += 24

  // Issuer block
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(dark)
  doc.text(issuerName, margin, y)
  y += 16
  doc.setTextColor(muted)
  const issuerLines = [issuerEmail && `Email: ${issuerEmail}`, issuerPhone && `Phone: ${issuerPhone}`, issuerAddress && `Address: ${issuerAddress}`]
    .filter(Boolean) as string[]
  issuerLines.forEach((l) => {
    doc.text(l, margin, y)
    y += 14
  })

  // Meta block (right)
  const metaX = margin + contentW * 0.62
  const metaY = 88
  doc.setTextColor(dark)
  doc.setFont('helvetica', 'bold')
  doc.text(`Invoice #${invoice.number}`, metaX, metaY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(muted)
  doc.text(`Bill to: ${invoice.clientName}`, metaX, metaY + 16)
  doc.text(`Issued: ${issued}`, metaX, metaY + 32)
  doc.text(`Due: ${due}`, metaX, metaY + 48)

  // Divider
  y = Math.max(y + 18, 156)
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, margin + contentW, y)
  y += 22

  // Table header
  const colDesc = margin
  const colHours = margin + contentW * 0.56
  const colRate = margin + contentW * 0.72
  const colAmt = margin + contentW * 0.86
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(dark)
  doc.text('Period', colDesc, y)
  doc.text('Hours', colHours, y, { align: 'right' })
  doc.text('Rate', colRate, y, { align: 'right' })
  doc.text('Amount', colAmt, y, { align: 'right' })
  y += 12
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(muted)
  doc.line(margin, y, margin + contentW, y)
  y += 16

  // Rows
  doc.setTextColor(dark)
  doc.setFontSize(10.5)
  for (const row of lineItems) {
    const desc = (row.description || 'Services').toString()
    const lines = wrapText(doc, desc, colHours - colDesc - 8)
    const rowHeight = Math.max(16, lines.length * 13)

    // Page break
    if (y + rowHeight + 140 > doc.internal.pageSize.getHeight()) {
      doc.addPage()
      y = 64
    }

    lines.forEach((l, i) => {
      doc.text(l, colDesc, y + i * 13)
    })
    doc.text(String(row.quantity ?? 0), colHours, y, { align: 'right' })
    doc.text(formatCurrency(row.unitPrice ?? 0, currency), colRate, y, { align: 'right' })
    doc.text(formatCurrency(row.total ?? 0, currency), colAmt, y, { align: 'right' })
    y += rowHeight
  }

  // Totals
  y += 18
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, margin + contentW, y)
  y += 22
  const totalsX = margin + contentW
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(muted)
  doc.text('Subtotal', totalsX - 220, y)
  doc.setTextColor(dark)
  doc.text(formatCurrency(subtotal, currency), totalsX, y, { align: 'right' })
  y += 16
  if (tRate > 0) {
    doc.setTextColor(muted)
    doc.text(`Tax (${tRate}%)`, totalsX - 220, y)
    doc.setTextColor(dark)
    doc.text(formatCurrency(taxAmount, currency), totalsX, y, { align: 'right' })
    y += 16
  }
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(dark)
  doc.text('Total', totalsX - 220, y)
  doc.text(formatCurrency(total, currency), totalsX, y, { align: 'right' })

  const filename = `invoice-${String(invoice.number || 'download').replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}

