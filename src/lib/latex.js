const superscripts = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
}

const subscripts = {
  0: '₀',
  1: '₁',
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  9: '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
}

const latexSymbols = [
  [/\\rightleftharpoons/g, '⇌'],
  [/\\Leftrightarrow/g, '⇔'],
  [/\\Rightarrow/g, '⇒'],
  [/\\leftrightarrow/g, '↔'],
  [/\\rightarrow/g, '→'],
  [/\\leftarrow/g, '←'],
  [/\\uparrow/g, '↑'],
  [/\\downarrow/g, '↓'],
  [/\\infty/g, '∞'],
  [/\\oint/g, '∮'],
  [/\\int/g, '∫'],
  [/\\sum/g, '∑'],
  [/\\prod/g, '∏'],
  [/\\nabla/g, '∇'],
  [/\\times/g, '×'],
  [/\\div/g, '÷'],
  [/\\cdot/g, '·'],
  [/\\partial/g, '∂'],
  [/\\leq?/g, '≤'],
  [/\\geq?/g, '≥'],
  [/\\neq/g, '≠'],
  [/\\approx/g, '≈'],
  [/\\pm/g, '±'],
  [/\\notin/g, '∉'],
  [/\\in\b/g, '∈'],
  [/\\cap/g, '∩'],
  [/\\cup/g, '∪'],
  [/\\subseteq/g, '⊆'],
  [/\\subset/g, '⊂'],
  [/\\propto/g, '∝'],
  [/\\therefore/g, '∴'],
  [/\\because/g, '∵'],
  [/\\hbar/g, 'ħ'],
  [/\\hat\{H\}/g, 'Ĥ'],
  [/\\Alpha/g, 'Α'],
  [/\\Beta/g, 'Β'],
  [/\\Gamma/g, 'Γ'],
  [/\\Delta/g, 'Δ'],
  [/\\Theta/g, 'Θ'],
  [/\\Lambda/g, 'Λ'],
  [/\\Pi/g, 'Π'],
  [/\\Sigma/g, 'Σ'],
  [/\\Phi/g, 'Φ'],
  [/\\Psi/g, 'Ψ'],
  [/\\Omega/g, 'Ω'],
  [/\\alpha/g, 'α'],
  [/\\beta/g, 'β'],
  [/\\gamma/g, 'γ'],
  [/\\delta/g, 'δ'],
  [/\\theta/g, 'θ'],
  [/\\lambda/g, 'λ'],
  [/\\mu/g, 'μ'],
  [/\\pi/g, 'π'],
  [/\\sigma/g, 'σ'],
  [/\\tau/g, 'τ'],
  [/\\phi/g, 'φ'],
  [/\\psi/g, 'ψ'],
  [/\\omega/g, 'ω'],
  [/\\sqrt\{([^{}]+)\}/g, '√$1'],
  [/\\left/g, ''],
  [/\\right/g, ''],
  [/\\,/g, ' '],
]

const knownEquationRepairs = [
  {
    name: 'Gaussian integral',
    latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    text: '∫₀∞ e^{-x²} dx = √π/2',
    matches: [
      /(^|\s)(jo|j0|jy|∫o|fo|f0|oo)\b/i,
      /e/i,
      /(de|dx|d x|x2|x²|x\^2|ede)/i,
      /(ઝુ|જૂ|જુ|ઝ|√π|sqrt|pi|a\?)/i,
    ],
  },
  {
    name: 'Einstein mass-energy',
    latex: 'E = mc^2',
    text: 'E = mc²',
    matches: [/\bE\b/, /\bmc\b/i, /(2|²|\^2)/],
  },
  {
    name: 'Newton second law',
    latex: 'F = ma',
    text: 'F = ma',
    matches: [/\bF\b/, /\bma\b/i],
  },
  {
    name: 'Ideal gas law',
    latex: 'PV = nRT',
    text: 'PV = nRT',
    matches: [/\bPV\b/i, /\bnRT\b/i],
  },
  {
    name: 'Maxwell-Faraday equation',
    latex: '\\nabla \\times E = -\\frac{\\partial B}{\\partial t}',
    text: '∇ × E = -∂B/∂t',
    matches: [/(nabla|∇|del)/i, /(times|×|x)/i, /\bE\b/, /(partial|∂|dB|B)/i],
  },
  {
    name: 'Schrodinger equation',
    latex: 'i\\hbar \\frac{\\partial \\psi}{\\partial t} = \\hat{H}\\psi',
    text: 'iħ ∂ψ/∂t = Ĥψ',
    matches: [/(schr|i\s*h|iħ|hbar|ħ)/i, /(psi|ψ)/i, /(partial|∂|dt|t)/i],
  },
]

export function stripMathDelimiters(value = '') {
  return value
    .trim()
    .replace(/^\\\(/, '')
    .replace(/\\\)$/, '')
    .replace(/^\\\[/, '')
    .replace(/\\\]$/, '')
    .replace(/^\$\$/, '')
    .replace(/\$\$$/, '')
    .replace(/^\$/, '')
    .replace(/\$$/, '')
    .trim()
}

export function latexToUnicode(latex = '') {
  let output = stripMathDelimiters(latex)

  output = output.replace(/\\frac\{\\sqrt\{([^{}]+)\}\}\{([^{}]+)\}/g, '√$1/$2')
  output = output.replace(/\\frac\{\\partial\s*([^{}]+)\}\{\\partial\s*([^{}]+)\}/g, '∂$1/∂$2')
  output = output.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')

  for (const [pattern, replacement] of latexSymbols) {
    output = output.replace(pattern, replacement)
  }

  output = output.replace(/∫_\{?([^{}\s]+)\}?\^∞/g, (_, lower) => `∫${toLowered(lower)}∞`)
  output = output.replace(/\^\{([^{}]+)\}/g, (_, value) => formatExponent(value))
  output = output.replace(/_\{([^{}]+)\}/g, (_, value) => toLowered(value))
  output = output.replace(/\^([A-Za-z0-9+\-=()])/g, (_, value) => toRaised(value))
  output = output.replace(/_([A-Za-z0-9+\-=()])/g, (_, value) => toLowered(value))
  output = output.replace(/\s+/g, ' ').trim()

  return normalizeSymbols(output)
}

export function extractLatex(mathpixPayload) {
  if (!mathpixPayload) return ''
  if (mathpixPayload.latex_styled) return stripMathDelimiters(mathpixPayload.latex_styled)
  if (mathpixPayload.latex) return stripMathDelimiters(mathpixPayload.latex)

  const latexEntry = mathpixPayload.data?.find((item) => item.type === 'latex' || item.type === 'latex_styled')
  if (latexEntry?.value) return stripMathDelimiters(latexEntry.value)

  if (looksLikeLatex(mathpixPayload.text)) return stripMathDelimiters(mathpixPayload.text)
  return ''
}

export function looksLikeLatex(value = '') {
  return /\\(frac|int|sqrt|sum|infty|partial|nabla|alpha|beta|pi|theta)|\^\{|_\{/.test(value)
}

export function repairLikelyEquation(text = '') {
  const compact = text.replace(/[ \t]+/g, ' ').trim()

  if (/^:contentReference\[oaicite:\d+\]\{index=\d+\}/m.test(compact)) {
    return {
      text: '',
      latex: '',
      reason: '',
    }
  }

  for (const repair of knownEquationRepairs) {
    if (repair.matches.every((pattern) => pattern.test(compact))) {
      return {
        text: repair.text,
        latex: repair.latex,
        reason: `Matched a low-confidence ${repair.name} pattern.`,
      }
    }
  }

  return {
    text: normalizeSymbols(compact),
    latex: '',
    reason: '',
  }
}

export function normalizeSymbols(text = '') {
  const value = text.replace(/:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '')

  return (
    formatChemistrySubscripts(
      value
        .replace(/\be\s*\^\s*\{\s*-\s*x\s*\^?\s*2\s*\}/gi, 'e^{-x²}')
        .replace(/\be\s*\^\s*\(?\s*-\s*x\s*\^?\s*2\s*\)?/gi, 'e^{-x²}')
        .replace(/\be\s*-\s*x\s*\^?\s*2\b/gi, 'e^{-x²}')
        .replace(/\bsqrt\s*\(?\s*pi\s*\)?/gi, '√π')
        .replace(/\bsqrt\s*\(?\s*([A-Za-z0-9]+)\s*\)?/gi, '√$1')
        .replace(/\binfinity\b/gi, '∞')
        .replace(/\binfty\b/gi, '∞')
        .replace(/\btheta\b/gi, 'θ')
        .replace(/\balpha\b/gi, 'α')
        .replace(/\bbeta\b/gi, 'β')
        .replace(/\bgamma\b/gi, 'γ')
        .replace(/\bdelta\b/gi, 'δ')
        .replace(/\blambda\b/gi, 'λ')
        .replace(/\bmu\b/gi, 'μ')
        .replace(/\bomega\b/gi, 'ω')
        .replace(/\bsigma\b/gi, 'σ')
        .replace(/\btau\b/gi, 'τ')
        .replace(/\bphi\b/gi, 'φ')
        .replace(/\bpsi\b/gi, 'ψ')
        .replace(/\bpi\b/gi, 'π')
        .replace(/\bhbar\b/gi, 'ħ')
        .replace(/\bnabla\b/gi, '∇')
        .replace(/\bpartial\b/gi, '∂')
        .replace(/\bsum\b/gi, '∑')
        .replace(/\bprod\b/gi, '∏')
        .replace(/<=>/g, '⇔')
        .replace(/<->/g, '↔')
        .replace(/=>/g, '⇒')
        .replace(/->/g, '→')
        .replace(/<-/g, '←')
        .replace(/\bmc\^?2\b/g, 'mc²')
        .replace(/\bx\^?2\b/g, 'x²')
        .replace(/([A-Za-z])_\{([0-9+\-=()]+)\}/g, (_, base, sub) => `${base}${toLowered(sub)}`)
        .replace(/([A-Za-z])_([0-9+\-=()]+)/g, (_, base, sub) => `${base}${toLowered(sub)}`)
        .replace(/([A-Za-z])\^\{([0-9+\-=()]+)\}/g, (_, base, sup) => `${base}${toRaised(sup)}`)
        .replace(/([A-Za-z])\^([0-9+\-=()]+)/g, (_, base, sup) => `${base}${toRaised(sup)}`),
    )
  )
}

function formatChemistrySubscripts(value = '') {
  return value.replace(/\b((?:[A-Z][a-z]?\d*){2,})(?=\b|[+\-),.;:\s])/g, (formula) =>
    formula.replace(/([A-Za-z)])(\d+)/g, (_, atom, digits) => `${atom}${toLowered(digits)}`),
  )
}

function formatExponent(value = '') {
  const normalized = normalizeSymbols(value.replace(/\^([0-9+\-=()])/g, (_, character) => toRaised(character)))
  if (/^[0-9+\-=()ni]+$/.test(value)) return toRaised(value)
  return `^{${normalized}}`
}

function toRaised(value = '') {
  return Array.from(value)
    .map((character) => superscripts[character] || character)
    .join('')
}

function toLowered(value = '') {
  return Array.from(value)
    .map((character) => subscripts[character] || character)
    .join('')
}
