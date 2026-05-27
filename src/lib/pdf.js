import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

const MAX_CANVAS_PIXELS = 12_000_000
const DEFAULT_PDF_SCALE = 2.35

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export function isPdfFile(file) {
  return Boolean(file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')))
}

export async function renderPdfToImageFiles(file, options = {}) {
  const maxPages = options.maxPages || 8
  const scale = options.scale || DEFAULT_PDF_SCALE
  const onStage = options.onStage || (() => {})
  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: false,
  })

  let pdf

  try {
    pdf = await task.promise
    const pageCount = pdf.numPages
    const pagesToRender = Math.min(pageCount, maxPages)
    const pages = []

    for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
      onStage(`Rendering PDF page ${pageNumber} of ${pageCount}`)
      const page = await pdf.getPage(pageNumber)
      const viewport = getScaledViewport(page, scale)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true })

      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvasContext: context,
        viewport,
        background: 'white',
      }).promise

      const blob = await canvasToBlob(canvas)
      pages.push({
        file: new File([blob], `${stripExtension(file.name)}-page-${pageNumber}.png`, {
          type: 'image/png',
        }),
        dataUrl: canvas.toDataURL('image/png', 0.96),
        pageNumber,
        pageCount,
      })

      canvas.width = 1
      canvas.height = 1
    }

    return {
      pages,
      pageCount,
      truncated: pageCount > pagesToRender,
      maxPages: pagesToRender,
    }
  } finally {
    if (pdf) {
      await pdf.destroy()
    } else {
      await task.destroy()
    }
  }
}

export async function renderPdfPreviewDataUrl(file) {
  const rendered = await renderPdfToImageFiles(file, {
    maxPages: 1,
    scale: 1.65,
  })

  return rendered.pages[0]?.dataUrl || ''
}

function getScaledViewport(page, requestedScale) {
  const initialViewport = page.getViewport({ scale: requestedScale })
  const pixelCount = initialViewport.width * initialViewport.height

  if (pixelCount <= MAX_CANVAS_PIXELS) {
    return initialViewport
  }

  const scale = requestedScale * Math.sqrt(MAX_CANVAS_PIXELS / pixelCount)
  return page.getViewport({ scale })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not render the PDF page for OCR.'))
      },
      'image/png',
      0.96,
    )
  })
}

function stripExtension(name) {
  return name.replace(/\.[^.]+$/, '') || 'pdf-page'
}
