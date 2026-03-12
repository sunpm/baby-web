import { Baby, BeerBottle, FlowerLotus } from '@phosphor-icons/react'
import { forwardRef } from 'react'
import {
  MILK_PRESETS,
  SUPPLEMENT_PRESETS,
  parsePositiveInt,
  type SupplementPreset,
} from '../lib/ui'
import type { EventKind } from '../lib/types'

interface QuickActionBarProps {
  activeKind: EventKind
  milkAmountInput: string
  supplementPreset: SupplementPreset
  onAddEvent: (kind: EventKind) => void
  onActiveKindChange: (kind: EventKind) => void
  onMilkAmountInputChange: (value: string) => void
  onSupplementPresetChange: (value: SupplementPreset) => void
}

const tabToneClass: Record<EventKind, string> = {
  feeding:
    'border-emerald-400/45 bg-emerald-400/16 text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:text-emerald-200',
  poop:
    'border-slate-400/35 bg-slate-500/10 text-slate-700 shadow-[0_4px_12px_rgba(51,65,85,0.08)] dark:text-slate-100',
  probiotic:
    'border-cyan-400/45 bg-cyan-400/16 text-cyan-700 shadow-[0_4px_12px_rgba(14,165,233,0.12)] dark:text-cyan-200',
}

const iconToneClass: Record<EventKind, string> = {
  feeding: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-200',
  poop: 'bg-slate-500/10 text-slate-700 dark:text-slate-100',
  probiotic: 'bg-cyan-500/14 text-cyan-700 dark:text-cyan-200',
}

const primaryToneClass: Record<EventKind, string> = {
  feeding:
    'bg-emerald-400 text-slate-950 ring-1 ring-emerald-200/65 shadow-[0_12px_28px_rgba(16,185,129,0.28)]',
  poop:
    'bg-[var(--text-primary)] text-[var(--app-bg)] ring-1 ring-slate-500/20 shadow-[0_12px_28px_rgba(15,23,42,0.24)]',
  probiotic:
    'bg-cyan-300 text-slate-950 ring-1 ring-cyan-100/70 shadow-[0_12px_28px_rgba(14,165,233,0.26)]',
}

const glowClass: Record<EventKind, string> = {
  feeding: 'bg-emerald-500/28',
  poop: 'bg-slate-950/22 dark:bg-slate-200/10',
  probiotic: 'bg-cyan-400/28',
}

const metaPillClass: Record<EventKind, string> = {
  feeding: 'bg-emerald-500/12 text-slate-950/80',
  poop: 'bg-white/10 text-[var(--app-bg)]/84 dark:bg-white/12',
  probiotic: 'bg-cyan-500/12 text-slate-950/80',
}

const primaryMeta = (kind: EventKind, milkAmountInput: string, supplementPreset: SupplementPreset) => {
  if (kind === 'feeding') {
    return `${parsePositiveInt(milkAmountInput, 90)} ml`
  }
  if (kind === 'probiotic') {
    return supplementPreset
  }
  return '一次'
}

const primaryLabel = (kind: EventKind) => {
  if (kind === 'feeding') {
    return '记录喂奶'
  }
  if (kind === 'probiotic') {
    return '记录补充'
  }
  return '记录拉粑粑'
}

export const QuickActionBar = forwardRef<HTMLElement, QuickActionBarProps>(
  function QuickActionBar(
    {
      activeKind,
      milkAmountInput,
      supplementPreset,
      onAddEvent,
      onActiveKindChange,
      onMilkAmountInputChange,
      onSupplementPresetChange,
    },
    ref,
  ) {
    const activeMilkAmount = parsePositiveInt(milkAmountInput, 90)
    const isCustomMilk = !MILK_PRESETS.some((preset) => preset === activeMilkAmount)

    return (
      <section
        ref={ref}
        className="floating-bar fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 sm:px-5"
      >
        <div className="mx-auto max-w-3xl space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { kind: 'feeding' as const, label: '喂奶', Icon: BeerBottle },
              { kind: 'poop' as const, label: '拉粑粑', Icon: Baby },
              { kind: 'probiotic' as const, label: '补充', Icon: FlowerLotus },
            ].map(({ kind, label, Icon }) => {
              const isActive = activeKind === kind

              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onActiveKindChange(kind)}
                  className={`action-tap flex h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-[0.85rem] font-semibold tracking-[0.02em] ${isActive
                    ? tabToneClass[kind]
                    : 'border-[var(--surface-border)] bg-[var(--control-bg)] text-secondary shadow-sm'
                    }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${isActive ? iconToneClass[kind] : 'bg-black/4 text-muted dark:bg-white/6'
                      }`}
                  >
                    <Icon size={14} />
                  </span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {activeKind === 'feeding' && (
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_108px] gap-1.5">
              {MILK_PRESETS.map((value) => {
                const isActive = activeMilkAmount === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onMilkAmountInputChange(String(value))}
                    className={`action-tap h-11 rounded-xl border text-[0.85rem] font-medium tabular-nums ${isActive
                      ? 'border-emerald-400/45 bg-emerald-400/16 text-emerald-700 shadow-[0_3px_10px_rgba(16,185,129,0.1)] dark:text-emerald-200'
                      : 'border-[var(--surface-border)] bg-[var(--control-bg)] text-secondary shadow-[0_2px_8px_-2px_rgba(15,23,42,0.02)]'
                      }`}
                  >
                    {value} ml
                  </button>
                )
              })}
              <label
                className={`flex h-11 items-center gap-1.5 rounded-xl border px-3 text-[0.85rem] ${isCustomMilk
                  ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-700 shadow-[0_3px_10px_rgba(16,185,129,0.08)] dark:text-emerald-200'
                  : 'border-[var(--surface-border)] bg-[var(--control-bg)] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.02)]'
                  } focus-within:border-emerald-400`}
              >
                <span className="text-[0.7rem] text-muted">自定义</span>
                <input
                  value={milkAmountInput}
                  onChange={(event) =>
                    onMilkAmountInputChange(event.target.value.replace(/\D/g, '').slice(0, 3))
                  }
                  inputMode="numeric"
                  placeholder="ml"
                  className="min-w-0 flex-1 bg-transparent text-right text-[0.82rem] text-primary outline-none placeholder:text-[color:var(--text-muted)]"
                />
              </label>
            </div>
          )}

          {activeKind === 'probiotic' && (
            <div className="grid grid-cols-4 gap-1.5">
              {SUPPLEMENT_PRESETS.map((value) => {
                const isActive = supplementPreset === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSupplementPresetChange(value)}
                    className={`action-tap h-11 rounded-xl border text-[0.82rem] font-medium ${isActive
                      ? 'border-cyan-400/45 bg-cyan-300/16 text-cyan-700 shadow-[0_3px_10px_rgba(14,165,233,0.1)] dark:text-cyan-200'
                      : 'border-[var(--surface-border)] bg-[var(--control-bg)] text-secondary shadow-[0_2px_8px_-2px_rgba(15,23,42,0.02)]'
                      }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          )}

          {activeKind === 'poop' && (
            <div className="surface flex h-11 items-center justify-center rounded-xl px-4 text-[0.82rem] font-medium tracking-[0.02em] text-secondary">
              拉粑粑不需要数量，点下面立即记录。
            </div>
          )}

          <div className="relative pt-3">
            <div
              className={`pointer-events-none absolute inset-x-5 -bottom-2 top-4 rounded-3xl blur-2xl ${glowClass[activeKind]}`}
            />
            <button
              type="button"
              onClick={() => onAddEvent(activeKind)}
              className={`action-tap relative flex h-[3.8rem] w-full items-center justify-between overflow-hidden rounded-[1.25rem] px-1 shadow-lg ${primaryToneClass[activeKind]} ring-1 ring-white/20`}
            >
              <div className="flex h-full flex-1 items-center justify-center pl-10">
                <span className="relative text-[1.05rem] font-bold tracking-[0.05em] drop-shadow-sm">
                  {primaryLabel(activeKind)}
                </span>
              </div>
              <div className="flex shrink-0 pr-3">
                <span
                  className={`relative flex min-w-[3rem] items-center justify-center rounded-xl px-3 py-1.5 text-[0.85rem] font-bold tabular-nums tracking-wide shadow-sm ring-1 ring-black/5 ${metaPillClass[activeKind]}`}
                >
                  {primaryMeta(activeKind, milkAmountInput, supplementPreset)}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>
    )
  },
)
