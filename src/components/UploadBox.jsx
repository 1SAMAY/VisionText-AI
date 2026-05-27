import { motion } from 'framer-motion'
import { Camera, FileImage, ImageUp, Loader2, Trash2 } from 'lucide-react'

const MotionSection = motion.section

export default function UploadBox({
  file,
  previewUrl,
  isDragging,
  isProcessing,
  progress,
  status,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileChange,
  onCameraChange,
  onClear,
}) {
  return (
    <MotionSection
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-panel neon-border w-full min-w-0 rounded-xl p-4 sm:p-5"
    >
      <div
        className={`relative grid min-h-[25rem] place-items-center overflow-hidden rounded-lg border border-dashed p-4 transition ${
          isDragging
            ? 'border-cyan-200 bg-cyan-200/15 shadow-neon'
            : 'border-white/16 bg-white/[0.04] hover:border-cyan-200/45 hover:bg-white/[0.06]'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {previewUrl ? (
          <div className="flex h-full w-full flex-col gap-4">
            <div className="relative grid min-h-[20rem] place-items-center overflow-hidden rounded-lg bg-black/35">
              <img
                src={previewUrl}
                alt={file?.name ? `Preview of ${file.name}` : 'Uploaded preview'}
                className="max-h-[32rem] max-w-full rounded-md object-contain"
              />

              {isProcessing && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/58 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-50">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    {status || 'Reading image'}
                  </div>
                </div>
              )}

              <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/75 backdrop-blur">
                <span className="block truncate font-medium text-white">{file?.name}</span>
                <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Clipboard image'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FileButtons onFileChange={onFileChange} onCameraChange={onCameraChange} />
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-200/20 bg-rose-400/10 px-3 text-sm text-rose-50 transition hover:border-rose-100/45 hover:bg-rose-400/16"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0 max-w-md text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl border border-cyan-200/30 bg-cyan-200/10 shadow-neon">
              <ImageUp className="h-8 w-8 text-ion" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Upload image or PDF</h2>
            <p className="mt-3 text-sm leading-6 text-white/64">
              Drop a screenshot, equation, document photo, whiteboard image, receipt, code capture, or scanned PDF.
            </p>
            <div className="mt-6 flex justify-center">
              <FileButtons onFileChange={onFileChange} onCameraChange={onCameraChange} />
            </div>
          </div>
        )}
      </div>

      {(isProcessing || progress > 0) && (
        <div className="mt-4 rounded-lg border border-cyan-200/20 bg-cyan-200/8 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-cyan-50/75">
            <span className="truncate">{status || 'Preparing OCR'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-ion to-plasma transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </MotionSection>
  )
}

function FileButtons({ onFileChange, onCameraChange }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <label className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-200 px-4 text-sm font-semibold text-slate-950 shadow-neon transition hover:bg-ion">
        <FileImage className="h-4 w-4" aria-hidden="true" />
        Upload
        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={onFileChange} />
      </label>
      <label className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-white/12">
        <Camera className="h-4 w-4" aria-hidden="true" />
        Camera
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onCameraChange} />
      </label>
    </div>
  )
}
