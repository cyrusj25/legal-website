import { jsPDF } from 'jspdf'

export function buildPdfDocumentFromText(documentText) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const horizontalMargin = 48
  const verticalMargin = 52
  const lineHeight = 18

  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)

  const wrappedLines = pdf.splitTextToSize(documentText, pageWidth - horizontalMargin * 2)
  let currentY = verticalMargin

  wrappedLines.forEach((line, index) => {
    if (index > 0 && currentY > pageHeight - verticalMargin) {
      pdf.addPage()
      currentY = verticalMargin
    }

    pdf.text(line, horizontalMargin, currentY)
    currentY += lineHeight
  })

  return pdf
}

export function buildSaleDeedFileName(workspaceName, timestamp = new Date()) {
  const pad2 = (value) => String(value).padStart(2, '0')

  return `SALE_DEED_${workspaceName || 'workspace'}_${timestamp.getFullYear()}${pad2(
    timestamp.getMonth() + 1,
  )}${pad2(timestamp.getDate())}${pad2(timestamp.getHours())}${pad2(
    timestamp.getMinutes(),
  )}${pad2(timestamp.getSeconds())}.pdf`
}