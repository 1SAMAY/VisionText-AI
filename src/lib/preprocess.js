const WORKER_TIMEOUT_MS = 4500

export async function preprocessImage(file, options = {}, onStage = () => {}) {
  const mode = options.mode || 'safe'
  const timeoutMs = options.timeoutMs || WORKER_TIMEOUT_MS

  onStage(mode === 'enhance' ? 'Enhancing image safely' : 'Preparing image safely')

  try {
    const processed = await runWorkerPreprocess(file, mode, timeoutMs)
    return {
      ...processed,
      dataUrl: await blobToDataUrl(processed.blob),
      engine: mode === 'enhance' ? 'preprocess-worker-enhanced' : 'preprocess-worker-safe',
    }
  } catch (error) {
    return {
      blob: file,
      dataUrl: file.size <= 8_000_000 ? await blobToDataUrl(file) : '',
      width: null,
      height: null,
      originalWidth: null,
      originalHeight: null,
      stats: null,
      engine: 'original-image-fallback',
      steps: [
        'Original image fallback',
        error instanceof Error ? `Worker skipped: ${error.message}` : 'Worker skipped',
      ],
      warning:
        error instanceof Error
          ? `Image preprocessing was skipped: ${error.message}`
          : 'Image preprocessing was skipped.',
    }
  }
}

function runWorkerPreprocess(file, mode, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers are not available.'))
      return
    }

    const worker = new Worker('/ocr-preprocess-worker.js')
    const id = crypto.randomUUID()
    let settled = false

    const finish = (callback, value) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      worker.terminate()
      callback(value)
    }

    const timeout = window.setTimeout(() => {
      finish(reject, new Error('Preprocessing timed out and was cancelled.'))
    }, timeoutMs)

    worker.onmessage = (event) => {
      const message = event.data || {}
      if (message.id !== id) return

      if (!message.ok) {
        finish(reject, new Error(message.error || 'Preprocessing worker failed.'))
        return
      }

      finish(resolve, {
        blob: message.blob,
        width: message.width,
        height: message.height,
        originalWidth: message.originalWidth,
        originalHeight: message.originalHeight,
        stats: message.stats,
        steps: message.steps || [],
      })
    }

    worker.onerror = (event) => {
      finish(reject, new Error(event.message || 'Preprocessing worker crashed.'))
    }

    file
      .arrayBuffer()
      .then((buffer) => {
        worker.postMessage(
          {
            id,
            buffer,
            type: file.type || 'image/png',
            mode,
          },
          [buffer],
        )
      })
      .catch((error) => {
        finish(reject, error instanceof Error ? error : new Error('Could not read image file.'))
      })
  })
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image data.'))
    reader.readAsDataURL(blob)
  })
}
