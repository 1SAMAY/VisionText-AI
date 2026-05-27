import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, BrainCircuit, Sparkles } from 'lucide-react'
import Background from '../components/Background.jsx'
import Navbar from '../components/Navbar.jsx'
import OCRResult from '../components/OCRResult.jsx'
import UploadBox from '../components/UploadBox.jsx'
import { downloadBlob, downloadPdf } from '../lib/exporters.js'
import { runAutoOCR } from '../lib/autoOcr.js'

const MotionDiv = motion.div

export default function Home() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(createEmptyResult())
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const activeRunRef = useRef(0)

  const fileStats = useMemo(() => {
    if (!file) return 'Image, screenshot, camera photo, or scanned PDF'
    const kind = isPdfFile(file) ? 'PDF document' : file.type || 'image'
    return `${kind} - ${(file.size / 1024 / 1024).toFixed(2)} MB`
  }, [file])

  const setActiveFile = useCallback((nextFile) => {
    if (!nextFile) {
      setError('Choose an image or scanned PDF.')
      return
    }

    if (!isPdfFile(nextFile) && !nextFile.type.startsWith('image/')) {
      setError('Choose a PNG, JPG, WEBP, HEIC, screenshot, camera photo, or scanned PDF.')
      return
    }

    activeRunRef.current += 1
    setFile(nextFile)
    setResult(createEmptyResult())
    setError('')
    setProgress(0)
    setStatus('Queued')
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }

    if (isPdfFile(file)) {
      let cancelled = false
      setPreviewUrl('')

      import('../lib/pdf.js')
        .then(({ renderPdfPreviewDataUrl }) => renderPdfPreviewDataUrl(file))
        .then((url) => {
          if (!cancelled) setPreviewUrl(url)
        })
        .catch(() => {
          if (!cancelled) setPreviewUrl('')
        })

      return () => {
        cancelled = true
      }
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const handlePaste = (event) => {
      const item = Array.from(event.clipboardData?.items || []).find((entry) =>
        entry.type.startsWith('image/'),
      )

      if (!item) return
      const pastedFile = item.getAsFile()
      if (pastedFile) {
        setActiveFile(
          new File([pastedFile], `pasted-screenshot-${Date.now()}.png`, {
            type: pastedFile.type,
          }),
        )
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [setActiveFile])

  useEffect(() => {
    if (!file) return undefined

    const runId = activeRunRef.current + 1
    activeRunRef.current = runId
    const controller = new AbortController()
    const isActive = () => activeRunRef.current === runId && !controller.signal.aborted

    setIsProcessing(true)
    setProgress(1)
    setStatus('Starting automatic OCR')
    setResult(createEmptyResult())
    setError('')

    runAutoOCR(file, {
      signal: controller.signal,
      onProgress: (value) => {
        if (isActive()) setProgress(value)
      },
      onStatus: (value) => {
        if (isActive()) setStatus(value)
      },
    })
      .then((nextResult) => {
        if (!isActive()) return
        setResult(nextResult)
        setProgress(100)
        setStatus('Complete')

        if (!nextResult.text.trim() && !nextResult.latex.trim()) {
          setError('No text was detected. Try a clearer crop or a higher-resolution image.')
        }
      })
      .catch((ocrError) => {
        if (!isActive() || ocrError?.name === 'AbortError') return
        setError(
          ocrError instanceof Error
            ? ocrError.message
            : 'Something went wrong while extracting text from the image.',
        )
      })
      .finally(() => {
        if (isActive()) setIsProcessing(false)
      })

    return () => {
      controller.abort()
    }
  }, [file])

  const handleFileInput = (event) => {
    setActiveFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    setActiveFile(event.dataTransfer.files?.[0])
  }

  const copyOutput = async (type = 'text') => {
    const value = type === 'latex' ? result.latex : result.text
    if (!value.trim()) return
    await navigator.clipboard.writeText(value)
    setCopied(type)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const downloadOutput = async (type = 'txt') => {
    if (!result.text.trim() && !result.latex.trim()) return

    const date = new Date().toISOString().slice(0, 10)
    if (type === 'latex') {
      downloadBlob(result.latex || result.text, `visiontext-ocr-${date}.tex`, 'application/x-tex;charset=utf-8')
      return
    }

    if (type === 'pdf') {
      await downloadPdf(result)
      return
    }

    downloadBlob(result.text, `visiontext-ocr-${date}.txt`, 'text/plain;charset=utf-8')
  }

  const clearFile = () => {
    activeRunRef.current += 1
    setFile(null)
    setPreviewUrl('')
    setResult(createEmptyResult())
    setError('')
    setProgress(0)
    setStatus('')
    setIsProcessing(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Background />
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-2"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/8 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-50/78">
                <BrainCircuit className="h-4 w-4 text-ion" aria-hidden="true" />
                Automatic AI OCR
              </p>
              <h1 className="mt-5 text-balance text-[2rem] font-black leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                Extract exact text from images.
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
              <div className="glass-panel overflow-hidden rounded-xl sm:col-span-2">
                <img
                  src="/visionocr-logo.png"
                  alt="VisionOCR futuristic logo"
                  className="h-44 w-full object-cover object-center sm:h-56"
                />
              </div>
              <Feature icon={<Sparkles className="h-5 w-5" />} label="Automatic equation, symbol, and language handling" />
              <Feature icon={<BadgeCheck className="h-5 w-5" />} label={fileStats} />
            </div>
          </div>
        </MotionDiv>

        <UploadBox
          file={file}
          previewUrl={previewUrl}
          isDragging={isDragging}
          isProcessing={isProcessing}
          progress={progress}
          status={status}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onFileChange={handleFileInput}
          onCameraChange={handleFileInput}
          onClear={clearFile}
        />

        <OCRResult
          result={result}
          copied={copied}
          isProcessing={isProcessing}
          error={error}
          onCopy={copyOutput}
          onDownload={downloadOutput}
        />
      </section>
    </main>
  )
}

function Feature({ icon, label }) {
  return (
    <div className="glass-panel flex min-h-16 items-center gap-3 overflow-hidden rounded-xl px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-200/10 text-ion">
        {icon}
      </span>
      <p className="min-w-0 break-words text-sm leading-5 text-white/72">{label}</p>
    </div>
  )
}

function createEmptyResult() {
  return {
    text: '',
    latex: '',
    html: '',
    confidence: null,
    tesseractConfidence: null,
    mathpixConfidence: null,
    source: '',
    rawText: '',
    warnings: [],
    preprocessing: null,
    classification: null,
    mathpix: null,
  }
}

function isPdfFile(file) {
  return Boolean(file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')))
}
