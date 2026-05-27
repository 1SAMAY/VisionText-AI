const MAX_PIXELS = 5_500_000
const SAFE_MAX_SIDE = 2200
const ENHANCE_MAX_SIDE = 2400
const MIN_TEXT_HEIGHT = 460

self.onmessage = async (event) => {
  const { id, buffer, type, mode } = event.data

  try {
    if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') {
      throw new Error('Worker canvas is not available in this browser.')
    }

    const blob = new Blob([buffer], { type: type || 'image/png' })
    const bitmap = await createImageBitmap(blob)
    const originalWidth = bitmap.width
    const originalHeight = bitmap.height
    const size = getTargetSize(originalWidth, originalHeight, mode)
    const canvas = new OffscreenCanvas(size.width, size.height)
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true })

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    if (typeof bitmap.close === 'function') bitmap.close()

    const imageData = context.getImageData(0, 0, size.width, size.height)
    const stats = measureImage(imageData.data, size.width, size.height)
    const steps = ['Worker resize', 'Pixel statistics']

    if (mode === 'enhance') {
      enhanceImage(imageData.data, stats)
      context.putImageData(imageData, 0, 0)
      steps.push('Grayscale cleanup', 'Contrast normalization')
      if (stats.darkBackground) steps.push('Dark background inversion')
      if (stats.lowContrast || stats.darkBackground) steps.push('Light thresholding')
    }

    const outputBlob = await canvas.convertToBlob({ type: 'image/png', quality: 0.96 })
    self.postMessage({
      id,
      ok: true,
      blob: outputBlob,
      width: size.width,
      height: size.height,
      originalWidth,
      originalHeight,
      stats,
      steps,
    })
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Image preprocessing failed.',
    })
  }
}

function getTargetSize(width, height, mode) {
  const maxSide = mode === 'enhance' ? ENHANCE_MAX_SIDE : SAFE_MAX_SIDE
  let scale = 1

  if (height < MIN_TEXT_HEIGHT) {
    scale = Math.max(scale, MIN_TEXT_HEIGHT / Math.max(1, height))
  }

  scale = Math.min(scale, maxSide / Math.max(width, height))
  scale = Math.min(scale, Math.sqrt(MAX_PIXELS / Math.max(1, width * height)))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function measureImage(data, width, height) {
  const stride = Math.max(4, Math.floor(data.length / 180000) * 4)
  let sum = 0
  let sumSquares = 0
  let dark = 0
  let light = 0
  let count = 0

  for (let index = 0; index < data.length; index += stride) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
    sum += gray
    sumSquares += gray * gray
    if (gray < 80) dark += 1
    if (gray > 185) light += 1
    count += 1
  }

  const mean = count ? sum / count : 255
  const variance = count ? sumSquares / count - mean * mean : 0
  const contrast = Math.sqrt(Math.max(0, variance))
  const darkRatio = count ? dark / count : 0
  const lightRatio = count ? light / count : 0
  const aspectRatio = width / Math.max(1, height)

  return {
    mean,
    contrast,
    darkRatio,
    lightRatio,
    darkBackground: mean < 118 && darkRatio > lightRatio,
    lowContrast: contrast < 38,
    aspectRatio,
    width,
    height,
  }
}

function enhanceImage(data, stats) {
  const shouldThreshold = stats.lowContrast || stats.darkBackground
  const contrast = stats.lowContrast ? 1.72 : 1.36
  const threshold = stats.darkBackground ? 134 : stats.mean

  for (let index = 0; index < data.length; index += 4) {
    let gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114

    if (stats.darkBackground) {
      gray = 255 - gray
    }

    let adjusted = (gray - stats.mean) * contrast + 128
    adjusted = Math.max(0, Math.min(255, adjusted))

    if (shouldThreshold) {
      adjusted = adjusted > threshold ? 255 : 0
    }

    data[index] = adjusted
    data[index + 1] = adjusted
    data[index + 2] = adjusted
    data[index + 3] = 255
  }
}
