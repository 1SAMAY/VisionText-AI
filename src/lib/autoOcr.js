import { analyzeText, chooseBetterTesseractResult, classifyImage, shouldEnhance, shouldUseMathpix } from './classifier.js'
import { runMathpixOCR } from './mathpixClient.js'
import { preprocessImage } from './preprocess.js'
import { reconstructOCRResult } from './reconstruction.js'
import { runTesseractOCR } from './tesseractOcr.js'

const MAX_PDF_PAGES = 8

export async function runAutoOCR(file, callbacks = {}) {
  const onProgress = callbacks.onProgress || (() => {})
  const onStatus = callbacks.onStatus || (() => {})
  const signal = callbacks.signal

  checkCancelled(signal)
  onProgress(2)
  onStatus('Preparing file')

  const { inputs, pdfMeta } = await prepareInputs(file, onStatus, signal)
  const pageResults = []
  const pageSpan = 94 / inputs.length

  for (let index = 0; index < inputs.length; index += 1) {
    checkCancelled(signal)
    const input = inputs[index]
    const pageStart = 3 + index * pageSpan
    const pageEnd = 3 + (index + 1) * pageSpan
    const pageLabel = input.pageNumber ? `Page ${input.pageNumber}` : 'Image'

    const result = await runPageOCR({
      input,
      pageLabel,
      pageStart,
      pageEnd,
      onProgress,
      onStatus,
      signal,
    })

    pageResults.push(result)
  }

  const merged = mergePageResults(pageResults, pdfMeta)
  onProgress(100)
  onStatus('Complete')
  return merged
}

async function prepareInputs(file, onStatus, signal) {
  if (!isPdfFile(file)) {
    return {
      inputs: [{ file, displayName: file.name, pageNumber: null, pageCount: null }],
      pdfMeta: null,
    }
  }

  onStatus('Rendering scanned PDF pages')
  const { renderPdfToImageFiles } = await import('./pdf.js')
  const rendered = await renderPdfToImageFiles(file, {
    maxPages: MAX_PDF_PAGES,
    onStage: (stage) => {
      checkCancelled(signal)
      onStatus(stage)
    },
  })

  if (!rendered.pages.length) {
    throw new Error('No PDF pages could be rendered for OCR.')
  }

  return {
    inputs: rendered.pages.map((page) => ({
      file: page.file,
      displayName: `${file.name} page ${page.pageNumber}`,
      pageNumber: page.pageNumber,
      pageCount: page.pageCount,
    })),
    pdfMeta: rendered,
  }
}

async function runPageOCR({ input, pageLabel, pageStart, pageEnd, onProgress, onStatus, signal }) {
  const warnings = []
  const setPageProgress = (ratio) => {
    onProgress(Math.min(99, Math.round(pageStart + (pageEnd - pageStart) * ratio)))
  }

  const setPageStatus = (status) => {
    onStatus(`${pageLabel}: ${status}`)
  }

  checkCancelled(signal)
  setPageProgress(0.05)
  const safeImage = await preprocessImage(
    input.file,
    {
      mode: 'safe',
      timeoutMs: 4200,
    },
    setPageStatus,
  )
  if (safeImage.warning) warnings.push(safeImage.warning)

  const classification = classifyImage({
    fileName: input.displayName,
    preprocessing: safeImage,
  })

  setPageProgress(0.18)
  setPageStatus('Reading text automatically')
  const baseline = await runTesseractOCR(safeImage.blob, getTesseractProfile(classification), (message) => {
    if (message.status) setPageStatus(message.status)
    if (typeof message.progress === 'number') {
      setPageProgress(0.18 + message.progress * 0.38)
    }
  })
  warnings.push(...(baseline.warnings || []))

  checkCancelled(signal)
  let bestTesseract = baseline
  let bestPreprocessing = safeImage

  if (shouldEnhance({ classification, tesseractResult: baseline })) {
    setPageStatus('Retrying with safe enhancement')
    setPageProgress(0.58)

    const enhancedImage = await preprocessImage(
      input.file,
      {
        mode: 'enhance',
        timeoutMs: 3600,
      },
      setPageStatus,
    )
    if (enhancedImage.warning) warnings.push(enhancedImage.warning)

    if (enhancedImage.blob) {
      const enhanced = await runTesseractOCR(enhancedImage.blob, getTesseractProfile(classification), (message) => {
        if (message.status) setPageStatus(message.status)
        if (typeof message.progress === 'number') {
          setPageProgress(0.62 + message.progress * 0.22)
        }
      })
      warnings.push(...(enhanced.warnings || []))
      bestTesseract = chooseBetterTesseractResult(baseline, enhanced)
      bestPreprocessing = bestTesseract === enhanced ? enhancedImage : safeImage
    }
  }

  checkCancelled(signal)
  let mathpixResult = null
  if (bestPreprocessing.dataUrl && shouldUseMathpix({ classification, tesseractResult: bestTesseract })) {
    setPageStatus('Checking equation structure')
    setPageProgress(0.88)
    try {
      mathpixResult = await runMathpixOCR(bestPreprocessing.dataUrl)
    } catch (error) {
      if (classification.equationCandidate || analyzeText(bestTesseract.text).isProbablyBrokenEquation) {
        warnings.push(error instanceof Error ? error.message : 'Equation OCR service is unavailable.')
      }
    }
  }

  const result = reconstructOCRResult({
    tesseractResult: bestTesseract,
    mathpixResult,
    classification,
    preprocessing: bestPreprocessing,
    fileName: input.displayName,
    warnings,
  })

  setPageProgress(1)
  return {
    ...result,
    pageNumber: input.pageNumber,
    pageCount: input.pageCount,
  }
}

function getTesseractProfile(classification) {
  return {
    psm: classification?.equationCandidate ? 11 : 3,
  }
}

function mergePageResults(pageResults, pdfMeta) {
  if (pageResults.length === 1) {
    const result = {
      ...pageResults[0],
      warnings: addPdfWarnings(pageResults[0].warnings, pdfMeta),
    }

    if (pdfMeta) result.preprocessing = addPdfPreprocessing(result.preprocessing, pdfMeta)
    return result
  }

  const text = pageResults.map((result) => formatPageOutput(result.pageNumber, result.text)).join('\n\n').trim()
  const latex = pageResults
    .map((result) => formatPageOutput(result.pageNumber, result.latex, '% Page'))
    .filter(Boolean)
    .join('\n\n')
    .trim()

  return {
    ...pageResults[0],
    text,
    latex,
    html: pageResults.map((result) => result.html || '').join('\n'),
    confidence: averageMetric(pageResults, 'confidence'),
    tesseractConfidence: averageMetric(pageResults, 'tesseractConfidence'),
    mathpixConfidence: averageMetric(pageResults, 'mathpixConfidence'),
    source: Array.from(new Set(pageResults.map((result) => result.source).filter(Boolean))).join(' + '),
    rawText: pageResults.map((result) => formatPageOutput(result.pageNumber, result.rawText)).join('\n\n').trim(),
    warnings: addPdfWarnings(pageResults.flatMap((result) => result.warnings || []), pdfMeta),
    preprocessing: addPdfPreprocessing(pageResults[0].preprocessing, pdfMeta),
  }
}

function formatPageOutput(pageNumber, value, prefix = '--- Page') {
  const output = (value || '').trim()
  if (!output) return ''
  return prefix.startsWith('%') ? `${prefix} ${pageNumber}\n${output}` : `${prefix} ${pageNumber} ---\n${output}`
}

function addPdfWarnings(warnings = [], pdfMeta) {
  const merged = [...warnings]
  if (pdfMeta?.truncated) {
    merged.push(`PDF has ${pdfMeta.pageCount} pages. Processed first ${pdfMeta.maxPages} pages to protect browser performance.`)
  }
  return Array.from(new Set(merged))
}

function addPdfPreprocessing(preprocessing, pdfMeta) {
  if (!pdfMeta) return preprocessing

  return {
    ...preprocessing,
    engine: `${preprocessing?.engine || 'auto'} + pdfjs`,
    steps: [
      `PDF rasterization (${Math.min(pdfMeta.pageCount, pdfMeta.maxPages)} of ${pdfMeta.pageCount} page${pdfMeta.pageCount === 1 ? '' : 's'})`,
      ...(preprocessing?.steps || []),
    ],
  }
}

function averageMetric(results, key) {
  const values = results.map((result) => result[key]).filter((value) => typeof value === 'number')
  if (!values.length) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function checkCancelled(signal) {
  if (signal?.aborted) {
    throw new DOMException('OCR cancelled.', 'AbortError')
  }
}

function isPdfFile(file) {
  return Boolean(file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')))
}
