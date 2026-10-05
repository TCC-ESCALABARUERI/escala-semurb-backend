import PDFDocument from 'pdfkit'

// Peças visuais reutilizáveis dos relatórios (a "View" do MVC nesta API)

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const COLORS = {
  primary: '#1f3a5f',
  muted: '#6b7280',
  line: '#d1d5db',
  zebra: '#f3f4f6',
  off: '#b91c1c'
}
const MARGIN = 40

export const formatDate = iso => (iso ? iso.split('-').reverse().join('/') : '—')
export const hhmm = t => (t ? String(t).slice(0, 5) : '—')

/** Cria o PDF já ligado à resposta HTTP. */
export function createDocument(res, filename, title) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true,
    info: { Title: title }
  })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
  doc.pipe(res)
  return doc
}

export function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 70).fill(COLORS.primary)
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text(title, MARGIN, 20)
  doc.font('Helvetica').fontSize(10).text(subtitle, MARGIN, 42)
  doc.fillColor('#000').moveDown(3)
  doc.y = 90
}

export function section(doc, title) {
  ensureSpace(doc, 40)
  doc
    .moveDown(0.6)
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.primary)
    .text(title, MARGIN)
  const y = doc.y + 2
  doc
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .strokeColor(COLORS.line)
    .stroke()
  doc.fillColor('#000').font('Helvetica').fontSize(9).moveDown(0.5)
}

/** Linha "Rótulo: valor" em duas colunas. */
export function keyValues(doc, pairs) {
  const colWidth = (doc.page.width - MARGIN * 2) / 2
  pairs.forEach(([label, value], i) => {
    const x = MARGIN + (i % 2) * colWidth
    if (i % 2 === 0 && i > 0) doc.moveDown(0.2)
    const y = i % 2 === 0 ? doc.y : doc.y - doc.currentLineHeight()
    doc
      .font('Helvetica-Bold')
      .text(`${label}: `, x, y, { continued: true })
      .font('Helvetica')
      .text(String(value ?? '—'))
  })
  doc.x = MARGIN
}

function ensureSpace(doc, height) {
  if (doc.y + height > doc.page.height - MARGIN - 20) doc.addPage()
}

/**
 * Tabela simples com cabeçalho repetido a cada página.
 * columns: [{ header, width (fração), value: row => string, color?: row => cor }]
 */
export function table(doc, columns, rows, { emptyText = 'Nenhum registro.' } = {}) {
  const totalWidth = doc.page.width - MARGIN * 2
  const widths = columns.map(c => c.width * totalWidth)
  const rowHeight = 16

  const drawHeader = () => {
    let x = MARGIN
    doc.rect(MARGIN, doc.y, totalWidth, rowHeight).fill(COLORS.primary)
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8)
    const y = doc.y + 4
    columns.forEach((c, i) => {
      doc.text(c.header, x + 4, y, { width: widths[i] - 8, lineBreak: false, ellipsis: true })
      x += widths[i]
    })
    doc.fillColor('#000').font('Helvetica')
    doc.y = y - 4 + rowHeight
  }

  if (rows.length === 0) {
    doc.fontSize(9).fillColor(COLORS.muted).text(emptyText, MARGIN).fillColor('#000')
    return
  }

  ensureSpace(doc, rowHeight * 2)
  drawHeader()
  rows.forEach((row, index) => {
    if (doc.y + rowHeight > doc.page.height - MARGIN - 20) {
      doc.addPage()
      drawHeader()
    }
    const top = doc.y
    if (index % 2 === 1) doc.rect(MARGIN, top, totalWidth, rowHeight).fill(COLORS.zebra)
    let x = MARGIN
    columns.forEach((c, i) => {
      doc
        .fillColor(c.color?.(row) ?? '#000')
        .fontSize(8)
        .text(String(c.value(row) ?? '—'), x + 4, top + 4, {
          width: widths[i] - 8,
          lineBreak: false,
          ellipsis: true
        })
      x += widths[i]
    })
    doc.fillColor('#000')
    doc.y = top + rowHeight
  })
  doc.x = MARGIN
}

export const offColor = row => (row.working === false ? COLORS.off : '#000')

/** Rodapé com número da página em todas as páginas. */
export function finish(doc) {
  const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const bottom = doc.page.height - 30
    doc.page.margins.bottom = 0
    doc
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(`Escala SEMURB · gerado em ${generatedAt}`, MARGIN, bottom, { lineBreak: false })
      .text(`Página ${i + 1} de ${range.count}`, MARGIN, bottom, {
        width: doc.page.width - MARGIN * 2,
        align: 'right'
      })
  }
  doc.end()
}
