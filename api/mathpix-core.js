import { Jimp } from 'jimp'

const MATHPIX_ENDPOINT = 'https://api.mathpix.com/v3/text'
const MAX_DATA_URI_LENGTH = 9_000_000

export async function handleMathpixRequest({ method, body, env }) {
  if (method !== 'POST') {
    return {
      status: 405,
      headers: { Allow: 'POST' },
      body: { error: 'Use POST for Mathpix OCR.' },
    }
  }

  const appId = env.MATHPIX_APP_ID
  const appKey = env.MATHPIX_APP_KEY

  if (!appId || !appKey) {
    return {
      status: 501,
      body: {
        error: 'Mathpix is not configured. Add MATHPIX_APP_ID and MATHPIX_APP_KEY in .env.local or Vercel environment variables.',
      },
    }
  }

  const image = String(body?.image || '')

  if (!image.startsWith('data:image/')) {
    return {
      status: 400,
      body: { error: 'Expected image as a data URI.' },
    }
  }

  if (image.length > MAX_DATA_URI_LENGTH) {
    return {
      status: 413,
      body: { error: 'Image is too large. Try a cropped or lower-resolution image.' },
    }
  }

  const src = body.normalize === false ? image : await normalizeImageDataUri(image)
  const mathpixResponse = await fetch(MATHPIX_ENDPOINT, {
    method: 'POST',
    headers: {
      app_id: appId,
      app_key: appKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      src,
      formats: ['text', 'data', 'html'],
      data_options: {
        include_asciimath: true,
        include_latex: true,
      },
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$'],
      include_line_data: true,
      include_word_data: true,
      rm_spaces: false,
      ocr: ['math', 'text'],
    }),
  })

  const payload = await mathpixResponse.json().catch(() => ({}))

  if (!mathpixResponse.ok || payload.error) {
    return {
      status: mathpixResponse.status || 502,
      body: {
        error: payload.error || 'Mathpix OCR request failed.',
        details: payload,
      },
    }
  }

  return {
    status: 200,
    body: payload,
  }
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(raw || '{}')
}

async function normalizeImageDataUri(dataUri) {
  const [header, encoded] = dataUri.split(',')
  const mime = header.match(/^data:(.*?);base64$/)?.[1] || 'image/png'
  const buffer = Buffer.from(encoded, 'base64')
  const image = await Jimp.read(buffer)

  image.greyscale().normalize().contrast(0.22)

  if (image.bitmap.width > 2400 || image.bitmap.height > 2400) {
    const aspect = image.bitmap.width / image.bitmap.height
    if (aspect >= 1) {
      image.resize({ w: 2400 })
    } else {
      image.resize({ h: 2400 })
    }
  }

  return image.getBase64(mime === 'image/jpeg' ? 'image/jpeg' : 'image/png')
}
