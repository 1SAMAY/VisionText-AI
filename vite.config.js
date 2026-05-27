import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleMathpixRequest, readJsonBody } from './api/mathpix-core.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), mathpixDevApi(env)],
    build: {
      sourcemap: true,
    },
  }
})

function mathpixDevApi(env) {
  return {
    name: 'mathpix-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/mathpix', async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const result = await handleMathpixRequest({
            method: req.method,
            body,
            env: { ...process.env, ...env },
          })

          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          for (const [key, value] of Object.entries(result.headers || {})) {
            res.setHeader(key, value)
          }
          res.end(JSON.stringify(result.body))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unexpected Mathpix OCR failure.',
            }),
          )
        }
      })
    },
  }
}
