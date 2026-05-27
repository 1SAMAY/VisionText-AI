import { handleMathpixRequest, readJsonBody } from './mathpix-core.js'

export default async function handler(req, res) {
  try {
    const body = await readJsonBody(req)
    const result = await handleMathpixRequest({
      method: req.method,
      body,
      env: process.env,
    })
    for (const [key, value] of Object.entries(result.headers || {})) {
      res.setHeader(key, value)
    }
    return res.status(result.status).json(result.body)
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected Mathpix OCR failure.',
    })
  }
}
