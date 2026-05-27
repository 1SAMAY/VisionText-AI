import katex from 'katex'

export default function EquationPreview({ latex }) {
  if (!latex?.trim()) {
    return (
      <div className="grid min-h-40 place-items-center rounded-lg border border-white/10 bg-slate-950/70 p-5 text-center text-sm text-white/45">
        LaTeX output from Mathpix or reconstruction will render here.
      </div>
    )
  }

  const html = katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
    strict: false,
    trust: false,
  })

  return (
    <div className="math-render scrollbar-soft min-h-40 overflow-auto rounded-lg border border-cyan-200/20 bg-slate-950/80 p-5 text-cyan-50">
      <div className="min-w-max" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
