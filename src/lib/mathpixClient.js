import { extractLatex, latexToUnicode } from './latex.js'

export async function runMathpixOCR(dataUrl, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)

  const response = await fetch('/api/mathpix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      image: dataUrl,
      normalize: options.normalize !== false,
    }),
  }).finally(() => window.clearTimeout(timeout))

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Mathpix API route is not active in this local dev server. Restart Vite or deploy with Vercel environment variables.')
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Mathpix OCR is not available.')
  }

  const latex = extractLatex(payload)
  return {
    raw: payload,
    text: payload.text || '',
    plainText: latex ? latexToUnicode(latex) : payload.text || '',
    latex,
    html: payload.html || '',
    confidence:
      typeof payload.confidence_rate === 'number'
        ? payload.confidence_rate * 100
        : typeof payload.confidence === 'number'
          ? payload.confidence * 100
          : null,
    isHandwritten: Boolean(payload.is_handwritten),
    isPrinted: Boolean(payload.is_printed),
  }
}
