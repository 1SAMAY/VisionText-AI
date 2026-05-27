export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadPdf(result) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const width = doc.internal.pageSize.getWidth() - margin * 2
  const title = 'VisionText AI OCR Output'
  const lines = doc.splitTextToSize(result.text || '', width)
  const latexLines = result.latex ? doc.splitTextToSize(`LaTeX:\n${result.latex}`, width) : []

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, margin, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Engine: ${result.source || 'OCR'} | Confidence: ${formatConfidence(result.confidence)}`, margin, 76)
  doc.setFontSize(12)
  doc.text(lines, margin, 112)

  if (latexLines.length) {
    const y = Math.min(720, 132 + lines.length * 15)
    doc.setFont('courier', 'normal')
    doc.text(latexLines, margin, y)
  }

  doc.save(`visiontext-ocr-${new Date().toISOString().slice(0, 10)}.pdf`)
}

function formatConfidence(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : 'n/a'
}
