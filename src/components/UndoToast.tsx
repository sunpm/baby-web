import { CheckCircle, WarningCircle } from '@phosphor-icons/react'

interface UndoToastProps {
  bottomOffset: number
  label: string
  onUndo: () => void
  showUndoAction: boolean
}

export function UndoToast({ bottomOffset, label, onUndo, showUndoAction }: UndoToastProps) {
  const toastClass = showUndoAction
    ? 'border-amber-400/45 bg-amber-100/95 text-amber-900 shadow-[0_12px_30px_-12px_rgba(180,83,9,0.45)] dark:border-amber-300/45 dark:bg-amber-500/20 dark:text-amber-100 dark:shadow-[0_14px_32px_-14px_rgba(245,158,11,0.45)]'
    : 'border-emerald-400/45 bg-emerald-100/95 text-emerald-900 shadow-[0_12px_30px_-12px_rgba(5,150,105,0.45)] dark:border-emerald-300/45 dark:bg-emerald-500/20 dark:text-emerald-100 dark:shadow-[0_14px_32px_-14px_rgba(16,185,129,0.45)]'

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-30 w-[min(92vw,24rem)] -translate-x-1/2"
      style={{ bottom: bottomOffset }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ring-1 ring-white/55 backdrop-blur-xl ${toastClass} ${showUndoAction ? 'justify-between' : ''}`}
      >
        <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/8 dark:bg-white/10">
          {showUndoAction ? <WarningCircle size={13} weight="fill" /> : <CheckCircle size={13} weight="fill" />}
        </div>
        <p className="min-w-0 text-[0.84rem] font-medium">{label}</p>
        {showUndoAction && (
          <button
            type="button"
            onClick={onUndo}
            className="action-tap shrink-0 rounded-lg bg-amber-300 px-2.5 py-1 text-[0.78rem] font-semibold text-amber-950 shadow-[0_5px_12px_-6px_rgba(146,64,14,0.7)]"
          >
            撤销
          </button>
        )}
      </div>
    </div>
  )
}
