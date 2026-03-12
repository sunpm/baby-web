import { kindName, parsePositiveInt, shortTime } from '../lib/ui'
import type { BabyEvent } from '../lib/types'

interface EventEditorSheetProps {
  draftAmount: string
  draftNote: string
  event: BabyEvent | null
  onAmountChange: (value: string) => void
  onClose: () => void
  onDelete: () => void
  onNoteChange: (value: string) => void
  onSave: () => void
}

export function EventEditorSheet({
  draftAmount,
  draftNote,
  event,
  onAmountChange,
  onClose,
  onDelete,
  onNoteChange,
  onSave,
}: EventEditorSheetProps) {
  if (!event) {
    return null
  }

  const showAmount = event.kind === 'feeding'
  const unitLabel = 'ml'
  const amountPlaceholder = String(event.amount ?? 90)
  const previewAmount = showAmount
    ? `${parsePositiveInt(draftAmount, Number(amountPlaceholder))} ${unitLabel}`
    : '已记录'

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/36 backdrop-blur-sm dark:bg-slate-950/72">
      <button
        type="button"
        aria-label="关闭编辑面板"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section className="sheet-surface absolute inset-x-0 bottom-0 mx-auto max-w-3xl rounded-t-[24px] px-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--surface-border-strong)]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">编辑记录</p>
            <h2 className="mt-1 text-[1.08rem] font-semibold text-primary">{kindName(event.kind)}</h2>
            <p className="mt-1 text-[0.8rem] text-muted">记录时间 {shortTime(event.eventAt)}</p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="action-tap rounded-lg border border-red-400/35 px-2.5 py-1.5 text-[0.78rem] font-medium text-red-700 hover:bg-red-500/10 dark:text-red-100"
          >
            删除
          </button>
        </div>

        <div className="mt-3.5 space-y-3">
          {showAmount && (
            <label className="block">
              <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                数量
              </span>
              <div className="control-surface flex h-9 items-center rounded-lg px-3 focus-within:border-emerald-400">
                <input
                  value={draftAmount}
                  onChange={(eventInput) =>
                    onAmountChange(eventInput.target.value.replace(/\D/g, '').slice(0, 3))
                  }
                  inputMode="numeric"
                  placeholder={amountPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-[0.84rem] text-primary outline-none placeholder:text-[color:var(--text-muted)]"
                />
                <span className="text-[0.72rem] text-muted">{unitLabel}</span>
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              备注
            </span>
            <textarea
              value={draftNote}
              onChange={(eventInput) => onNoteChange(eventInput.target.value)}
              rows={2}
              placeholder="补充一点说明"
              className="control-surface w-full rounded-lg px-3 py-2.5 text-[0.84rem] text-primary outline-none placeholder:text-[color:var(--text-muted)] focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="mt-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--control-bg)] px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">保存后预览</p>
          <p className="mt-1.5 text-[0.84rem] text-secondary">
            {previewAmount}
            {draftNote.trim() ? ` · ${draftNote.trim()}` : ''}
          </p>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="action-tap control-surface h-9 rounded-lg text-[0.84rem] text-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSave}
            className="action-tap h-9 rounded-lg bg-emerald-400 text-[0.84rem] font-semibold text-slate-950"
          >
            保存
          </button>
        </div>
      </section>
    </div>
  )
}
