import Tesseract from 'tesseract.js'

export const AUTO_OCR_LANGUAGE = 'eng+hin+guj+jpn+chi_sim+ara+rus+kor+fra+deu'
const FALLBACK_LANGUAGE = 'eng'
const TESSERACT_TIMEOUT_MS = 60000

export async function runTesseractOCR(source, profile = {}, onProgress = () => {}) {
  const language = profile.language || AUTO_OCR_LANGUAGE

  try {
    return await runWorker(source, language, profile, onProgress)
  } catch (error) {
    if (language === FALLBACK_LANGUAGE) throw error

    onProgress({
      status: 'retrying with fast English model',
      progress: 0,
    })

    const fallback = await runWorker(
      source,
      FALLBACK_LANGUAGE,
      {
        ...profile,
        language: FALLBACK_LANGUAGE,
      },
      onProgress,
    )

    return {
      ...fallback,
      warnings: [
        ...(fallback.warnings || []),
        error instanceof Error
          ? `Automatic multilingual OCR fell back to English: ${error.message}`
          : 'Automatic multilingual OCR fell back to English.',
      ],
    }
  }
}

async function runWorker(source, language, profile, onProgress) {
  let worker

  const task = async () => {
    worker = await Tesseract.createWorker(language, 1, {
      logger: (message) => onProgress(normalizeProgress(message)),
    })

    await worker.setParameters({
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
      tessedit_pageseg_mode: profile.psm || Tesseract.PSM.SPARSE_TEXT,
    })

    const result = await worker.recognize(source)
    return {
      raw: result,
      text: cleanupTesseractText(result.data.text),
      confidence: result.data.confidence,
      words: result.data.words || [],
      lines: result.data.lines || [],
      language,
      warnings: [],
    }
  }

  try {
    return await withTimeout(task(), TESSERACT_TIMEOUT_MS, async () => {
      if (worker) await worker.terminate()
    })
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {})
    }
  }
}

function cleanupTesseractText(text = '') {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

function normalizeProgress(message) {
  return {
    status: message.status || 'running OCR',
    progress: typeof message.progress === 'number' ? message.progress : 0,
  }
}

function withTimeout(promise, timeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(async () => {
      await onTimeout()
      reject(new Error('OCR timed out and was cancelled. Try a clearer or smaller image.'))
    }, timeoutMs)

    promise
      .then((value) => {
        window.clearTimeout(timeout)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timeout)
        reject(error)
      })
  })
}
