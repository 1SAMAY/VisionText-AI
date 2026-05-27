import { analyzeText } from './classifier.js'
import { extractLatex, latexToUnicode, looksLikeLatex, normalizeSymbols, repairLikelyEquation, stripMathDelimiters } from './latex.js'

export function reconstructOCRResult({
  tesseractResult,
  mathpixResult,
  classification,
  preprocessing,
  fileName,
  warnings = [],
}) {
  const rawText = tesseractResult?.text || ''
  const mathpixLatex = mathpixResult?.latex || extractLatex(mathpixResult?.raw)
  const mathpixText = mathpixResult?.plainText || mathpixResult?.text || ''
  const tesseractConfidence = tesseractResult?.confidence ?? null
  const mathpixConfidence = mathpixResult?.confidence ?? null
  const signals = analyzeText([rawText, mathpixText, mathpixLatex, fileName].filter(Boolean).join('\n'))

  let text = rawText
  let latex = ''
  let source = 'Tesseract.js'

  if (mathpixLatex) {
    latex = stripMathDelimiters(mathpixLatex)
    text = latexToUnicode(latex)
    source = 'Mathpix equation OCR'
  } else if (mathpixText) {
    text = looksLikeLatex(mathpixText) ? latexToUnicode(mathpixText) : mathpixText.trim()
    source = 'Mathpix equation OCR'
  }

  const shouldRepair =
    !mathpixLatex &&
    (classification?.equationCandidate ||
      classification?.darkFormulaLike ||
      signals.hasMath ||
      signals.hasPhysics ||
      signals.hasChemistry ||
      signals.isProbablyBrokenEquation ||
      lowConfidence(tesseractConfidence))

  if (shouldRepair) {
    const repaired = repairLikelyEquation(rawText || text)
    if (repaired.reason) {
      text = repaired.text
      latex = repaired.latex
      source = 'Equation reconstruction'
      warnings.push(repaired.reason)
    } else {
      text = repaired.text || text
    }
  }

  if (!latex && looksLikeLatex(text)) {
    latex = stripMathDelimiters(text)
    text = latexToUnicode(latex)
  }

  text = cleanupFormattedText(removeGeneratedReferences(normalizeSymbols(text)))

  return {
    text,
    latex,
    html: mathpixResult?.html || '',
    confidence: bestConfidence(tesseractConfidence, mathpixConfidence),
    tesseractConfidence,
    mathpixConfidence,
    source,
    rawText,
    warnings: Array.from(new Set(warnings.filter(Boolean))),
    preprocessing: {
      engine: preprocessing?.engine || 'auto',
      steps: preprocessing?.steps || [],
      classification: classification?.kind || 'image',
    },
    classification,
    mathpix: mathpixResult?.raw || null,
  }
}

function cleanupFormattedText(text = '') {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

function removeGeneratedReferences(text = '') {
  return text.replace(/:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '')
}

function lowConfidence(confidence) {
  return !Number.isFinite(confidence) || confidence < 68
}

function bestConfidence(tesseractConfidence, mathpixConfidence) {
  const values = [tesseractConfidence, mathpixConfidence].filter((value) => Number.isFinite(value))
  return values.length ? Math.max(...values) : null
}
