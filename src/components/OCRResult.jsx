import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Braces, Check, ClipboardCopy, Download, Eye, FileCode, FileDown, FileText, Loader2, ScanText } from 'lucide-react'
import EquationPreview from './EquationPreview.jsx'

const MotionSection = motion.section

export default function OCRResult({ result, copied, isProcessing, error, onCopy, onDownload }) {
  const [activeTab, setActiveTab] = useState('text')
  const text = result?.text || ''
  const latex = result?.latex || ''
  const visibleWarnings = (result?.warnings || []).filter(
    (warning) => !/Mathpix is not configured|Equation OCR service is unavailable/i.test(warning),
  )
  const hasText = text.trim().length > 0
  const hasLatex = latex.trim().length > 0

  return (
    <MotionSection
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.5, ease: 'easeOut' }}
      className="glass-panel w-full min-w-0 rounded-xl p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-cyan-100/70">
            <ScanText className="h-4 w-4 text-ion" aria-hidden="true" />
            Extracted Text
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">OCR result</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!hasText}
            onClick={() => onCopy('text')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-sm text-white transition hover:border-cyan-200/45 hover:bg-white/12 disabled:opacity-45"
          >
            {copied === 'text' ? <Check className="h-4 w-4 text-ion" /> : <ClipboardCopy className="h-4 w-4" />}
            Copy
          </button>
          <button
            type="button"
            disabled={!hasText}
            onClick={() => onDownload('txt')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 text-sm text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/15 disabled:opacity-45"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            TXT
          </button>
          <button
            type="button"
            disabled={!hasLatex}
            onClick={() => onCopy('latex')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-sm text-white transition hover:border-cyan-200/45 hover:bg-white/12 disabled:opacity-45"
          >
            {copied === 'latex' ? <Check className="h-4 w-4 text-ion" /> : <Braces className="h-4 w-4" />}
            LaTeX
          </button>
          <button
            type="button"
            disabled={!hasLatex}
            onClick={() => onDownload('latex')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 text-sm text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/15 disabled:opacity-45"
          >
            <FileCode className="h-4 w-4" aria-hidden="true" />
            TEX
          </button>
          <button
            type="button"
            disabled={!hasText}
            onClick={() => onDownload('pdf')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 text-sm text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/15 disabled:opacity-45"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            PDF
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
        <TabButton active={activeTab === 'text'} icon={<FileText className="h-4 w-4" />} onClick={() => setActiveTab('text')}>
          Text
        </TabButton>
        <TabButton active={activeTab === 'latex'} icon={<Braces className="h-4 w-4" />} onClick={() => setActiveTab('latex')}>
          LaTeX
        </TabButton>
        <TabButton active={activeTab === 'preview'} icon={<Eye className="h-4 w-4" />} onClick={() => setActiveTab('preview')}>
          Preview
        </TabButton>
      </div>

      <div className="relative min-h-[30rem] overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
        {isProcessing && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/64 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-50">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Reading image
            </div>
          </div>
        )}

        {error ? (
          <div className="grid min-h-[30rem] place-items-center p-6 text-center">
            <div>
              <AlertTriangle className="mx-auto h-10 w-10 text-rose-200" aria-hidden="true" />
              <p className="mt-4 text-base font-semibold text-rose-50">OCR failed</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-rose-100/70">{error}</p>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          <div className="p-4">
            <EquationPreview latex={latex} />
            {!hasLatex && (
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                Equation preview appears when a LaTeX equation is reconstructed or returned by Mathpix.
              </p>
            )}
          </div>
        ) : activeTab === 'latex' ? (
          <pre className="latex-output scrollbar-soft min-h-[30rem] w-full overflow-auto bg-transparent p-4 text-white">
            {hasLatex ? latex : 'LaTeX output appears here for equations.'}
          </pre>
        ) : (
          <pre className={`ocr-output scrollbar-soft min-h-[30rem] w-full overflow-auto bg-transparent p-4 ${hasText ? 'text-white' : 'text-white/38'}`}>
            {hasText ? text : 'Upload an image and the extracted text appears here.'}
          </pre>
        )}
      </div>

      {visibleWarnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-200/20 bg-amber-300/10 p-3 text-sm text-amber-50/80">
          <p className="mb-2 flex items-center gap-2 font-medium text-amber-50">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Accuracy notes
          </p>
          <ul className="grid gap-1">
            {visibleWarnings.slice(0, 3).map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </MotionSection>
  )
}

function TabButton({ active, children, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
        active ? 'bg-cyan-200 text-slate-950' : 'text-white/62 hover:bg-white/8 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
