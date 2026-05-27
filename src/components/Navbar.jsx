import { ExternalLink, Github } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <img
          src="/visionocr-logo.png"
          alt="VisionOCR logo"
          className="h-12 w-32 rounded-lg border border-cyan-200/25 object-cover object-center shadow-neon"
        />
        <div>
          <p className="text-base font-semibold tracking-wide text-white">VisionOCR</p>
          <p className="text-xs text-cyan-100/65">AI text extraction studio</p>
        </div>
      </div>

      <nav className="hidden items-center gap-2 sm:flex" aria-label="Project links">
        <a
          href="https://github.com/1SAMAY/VisionText-AI"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 text-sm text-white/80 transition hover:border-cyan-200/40 hover:bg-white/12 hover:text-white"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          GitHub
        </a>
        <a
          href="https://ai-photo-to-text-website-ocr.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 text-sm text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/15"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Live
        </a>
      </nav>
    </header>
  )
}
