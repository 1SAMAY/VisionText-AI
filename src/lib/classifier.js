const mathSymbols = /[∫∮∑∏∞≈≠≤≥±×÷√∂∇∈∉∩∪⊂⊆∝∴∵]|\\(int|sum|frac|sqrt|infty|partial|nabla)/i
const physicsSymbols = /[ħλμΩαβγδθπστΦΨω]/u
const chemistrySignals = /\b(PV|nRT|mol|NaCl|H2O|CO2|H₂O|CO₂)\b|[⇌→←Δ°]/u
const codeSignals = /(\{|\}|\[|\]|<>|!=|===|&&|\|\||=>|<\/?[A-Za-z])/u
const currencySignals = /[₹$€£¥]/u
const emojiSignals = /[\p{Extended_Pictographic}]/u
const contentReference = /:contentReference\[oaicite:\d+\]\{index=\d+\}/

export function classifyImage({ fileName = '', preprocessing }) {
  const stats = preprocessing?.stats || {}
  const aspectRatio = stats.aspectRatio || 1
  const lowerName = fileName.toLowerCase()
  const isPdf = lowerName.endsWith('.pdf')
  const darkFormulaLike = Boolean(stats.darkBackground && aspectRatio > 2.1)
  const screenshotLike = /\b(screen|screenshot|capture|clipboard)\b/.test(lowerName) || aspectRatio > 1.5
  const receiptLike = /\b(receipt|invoice|bill)\b/.test(lowerName) || aspectRatio < 0.72
  const documentLike = isPdf || /\b(scan|document|paper|note|page)\b/.test(lowerName)
  const equationCandidate =
    darkFormulaLike ||
    /\b(math|equation|formula|physics|chem|integral|latex)\b/.test(lowerName) ||
    (aspectRatio > 2.5 && (stats.height || 0) < 700)

  return {
    kind: pickKind({ equationCandidate, receiptLike, screenshotLike, documentLike }),
    isPdf,
    darkFormulaLike,
    screenshotLike,
    receiptLike,
    documentLike,
    equationCandidate,
    stats,
  }
}

export function analyzeText(text = '') {
  const value = String(text)
  const compact = value.replace(/\s+/g, ' ').trim()
  const hasMath = mathSymbols.test(value) || /\b(e\^|sqrt|lim|dx|dy|mc\^?2|PV\s*=\s*nRT)\b/i.test(value)
  const hasPhysics = physicsSymbols.test(value) || /\b(hbar|nabla|Schr|Maxwell|Newton|force|velocity)\b/i.test(value)
  const hasChemistry = chemistrySignals.test(value)
  const hasCode = codeSignals.test(value)
  const hasCurrency = currencySignals.test(value)
  const hasEmoji = emojiSignals.test(value)
  const hasContentReference = contentReference.test(value)
  const hasMixedScriptNoise = /[\u0A80-\u0AFF]/.test(value) && /[A-Za-z]/.test(value) && /\b(Jo|de|ede|Jy)\b/i.test(value)
  const symbolCount = (value.match(/[^\p{L}\p{N}\s.,:;'"!?-]/gu) || []).length

  return {
    compact,
    hasMath,
    hasPhysics,
    hasChemistry,
    hasCode,
    hasCurrency,
    hasEmoji,
    hasContentReference,
    hasMixedScriptNoise,
    symbolCount,
    isProbablyBrokenEquation: hasMixedScriptNoise || /\b(Jo|J0|fo|ede|de)\b/i.test(compact),
  }
}

export function shouldEnhance({ classification, tesseractResult }) {
  const confidence = tesseractResult?.confidence
  const text = tesseractResult?.text || ''
  const signals = analyzeText(text)

  if (classification.darkFormulaLike && confidence < 88) return true
  if (classification.equationCandidate && confidence < 78) return true
  if (!text.trim()) return true
  if (signals.isProbablyBrokenEquation) return true
  return Number.isFinite(confidence) ? confidence < 54 : true
}

export function shouldUseMathpix({ classification, tesseractResult }) {
  const signals = analyzeText(tesseractResult?.text || '')
  const confidence = tesseractResult?.confidence

  return (
    classification.equationCandidate ||
    classification.darkFormulaLike ||
    signals.hasMath ||
    signals.hasPhysics ||
    signals.hasChemistry ||
    signals.isProbablyBrokenEquation ||
    (Number.isFinite(confidence) && confidence < 62)
  )
}

export function chooseBetterTesseractResult(primary, enhanced) {
  if (!enhanced?.text?.trim()) return primary
  if (!primary?.text?.trim()) return enhanced

  const primaryScore = scoreTesseract(primary)
  const enhancedScore = scoreTesseract(enhanced)
  return enhancedScore > primaryScore + 6 ? enhanced : primary
}

function scoreTesseract(result) {
  const signals = analyzeText(result?.text || '')
  const confidence = Number.isFinite(result?.confidence) ? result.confidence : 0
  const lengthScore = Math.min(18, (result?.text || '').trim().length / 8)
  const noisePenalty = signals.hasMixedScriptNoise ? 32 : 0
  return confidence + lengthScore + signals.symbolCount * 0.7 - noisePenalty
}

function pickKind({ equationCandidate, receiptLike, screenshotLike, documentLike }) {
  if (equationCandidate) return 'equation'
  if (receiptLike) return 'receipt'
  if (screenshotLike) return 'screenshot'
  if (documentLike) return 'document'
  return 'image'
}
