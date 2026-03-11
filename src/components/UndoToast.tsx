interface UndoToastProps {
  bottomOffset: number
  label: string
  onUndo: () => void
}

export function UndoToast({ bottomOffset, label, onUndo }: UndoToastProps) {
  return (
    <div
      className="fixed left-1/2 z-30 w-[min(90vw,24rem)] -translate-x-1/2"
      style={{ bottom: bottomOffset }}
    >
      <div className="surface flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2">
        <p className="min-w-0 text-[0.9rem] text-secondary">{label}</p>
        <button
          type="button"
          onClick={onUndo}
          className="action-tap shrink-0 rounded-full bg-emerald-400 px-2.5 py-1 text-[0.84rem] font-semibold text-slate-950"
        >
          撤销
        </button>
      </div>
    </div>
  )
}
