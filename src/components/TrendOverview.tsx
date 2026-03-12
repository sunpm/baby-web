import { ChartLineUp, ClockCounterClockwise } from '@phosphor-icons/react'
import { memo, useMemo } from 'react'
import type { TrendCardData, TrendDigestItem, TrendLatestItem } from '../lib/insights'

interface TrendOverviewProps {
  cards: TrendCardData[]
  latestItems: TrendLatestItem[]
  recentItems: TrendDigestItem[]
}

export const TrendOverview = memo(function TrendOverview({
  cards,
  latestItems,
  recentItems,
}: TrendOverviewProps) {
  const isEmpty = useMemo(
    () => cards.every((card) => card.points.every((point) => point.value === 0)),
    [cards],
  )

  return (
    <section id="panel-trends" role="tabpanel" aria-labelledby="tab-trends" className="mt-2.5 pb-1">
      <div className="mb-2.5">
        <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
          <ChartLineUp size={13} />
          趋势概览
        </div>
        <p className="mt-1 text-[0.84rem] leading-5 text-secondary">
          先看近24小时，再看近 7 天，用更轻的走势线来读变化。
        </p>
      </div>

      {isEmpty ? (
        <div className="surface rounded-lg px-4 py-5 text-center">
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-200">
            <ChartLineUp size={20} />
          </div>
          <p className="mt-3 text-[0.94rem] font-medium text-primary">趋势还没开始累积</p>
          <p className="mt-1 text-[0.8rem] text-muted">先用底部按钮记下一次，近24小时和近7天都会开始更新。</p>
        </div>
      ) : (
        <div className="space-y-2">
          <section className="surface rounded-lg p-2.5">
            <div className="mb-1.5 flex items-center gap-2">
              <ChartLineUp size={14} className="text-muted" />
              <h2 className="text-[0.94rem] font-semibold text-primary">近24小时</h2>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {recentItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-[var(--surface-border)] bg-[var(--control-bg)] px-2.5 py-2"
                >
                  <p className="text-[0.64rem] tracking-[0.08em] text-muted">{item.title}</p>
                  <p className={`mt-1 text-[0.92rem] font-semibold ${item.toneClass}`}>{item.value}</p>
                  <p className="mt-1 text-[0.7rem] text-muted">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="surface rounded-lg p-2.5">
            <div className="mb-1.5 flex items-center gap-2">
              <ClockCounterClockwise size={14} className="text-muted" />
              <h2 className="text-[0.94rem] font-semibold text-primary">各类型最近一次</h2>
            </div>
            <div className="space-y-1.5">
              {latestItems.map((item) => (
                <article
                  key={item.title}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--control-bg)] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className={`text-[0.82rem] font-medium ${item.toneClass}`}>{item.title}</p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-muted">{item.detail}</p>
                  </div>
                  <p className="shrink-0 text-[0.76rem] text-secondary">{item.timeLabel}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            {cards.map((card) => (
              <article key={card.title} className="surface rounded-lg p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.66rem] uppercase tracking-[0.14em] text-muted">7天走势</p>
                    <h2 className="mt-1 text-[0.98rem] font-semibold text-primary">{card.title}</h2>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[0.66rem] ${card.badgeClass}`}>
                    {card.todayLabel}
                  </span>
                </div>

                <TrendSparkline card={card} />

                <div className="mt-1.5 grid grid-cols-7 gap-0">
                  {card.points.map((point, index) => {
                    const isLast = index === card.points.length - 1
                    return (
                      <div key={`${card.title}-${point.label}`} className="px-0.5 text-center">
                        <div
                          className={`rounded-lg px-1 py-1 ${
                            isLast
                              ? 'bg-[var(--control-bg)] ring-1 ring-[var(--surface-border-strong)]'
                              : 'bg-transparent'
                          }`}
                        >
                          <p className={`tabular-nums text-[0.66rem] font-medium ${card.toneClass}`}>
                            {point.value}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">{point.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="mt-2 text-[0.74rem] text-muted">{card.footerLabel}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
})

const TrendSparkline = memo(function TrendSparkline({ card }: { card: TrendCardData }) {
  const width = 280
  const height = 64
  const paddingX = width / (card.points.length * 2)
  const top = 10
  const bottom = 10
  const points = useMemo(
    () => normalizePoints(card.points, width, height, paddingX, top, bottom),
    [bottom, card.points, height, paddingX, top, width],
  )
  const linePath = useMemo(() => buildLinePath(points), [points])
  const areaPath = useMemo(() => buildAreaPath(points, height - bottom), [bottom, height, points])

  return (
    <div className={`mt-2.5 ${card.toneClass}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={height - bottom}
          y2={height - bottom}
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1"
        />
        <path d={areaPath} fill="currentColor" fillOpacity="0.08" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
        {points.map((point, index) => {
          const isLast = index === points.length - 1
          return (
            <g key={`${card.title}-${point.label}-dot`}>
              {isLast && <circle cx={point.x} cy={point.y} r="5.8" fill="currentColor" fillOpacity="0.12" />}
              <circle
                cx={point.x}
                cy={point.y}
                r={isLast ? 3.4 : 2.5}
                fill="currentColor"
                stroke="var(--surface-bg)"
                strokeWidth="2"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
})

function normalizePoints(
  points: TrendCardData['points'],
  width: number,
  height: number,
  paddingX: number,
  top: number,
  bottom: number,
) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const usableWidth = width - paddingX * 2
  const usableHeight = height - top - bottom

  return points.map((point, index) => {
    const x = paddingX + (usableWidth / Math.max(points.length - 1, 1)) * index
    const y = height - bottom - (point.value / maxValue) * usableHeight

    return {
      ...point,
      x,
      y,
    }
  })
}

function buildLinePath(points: Array<TrendCardData['points'][number] & { x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
}

function buildAreaPath(
  points: Array<TrendCardData['points'][number] & { x: number; y: number }>,
  baselineY: number,
) {
  if (points.length === 0) {
    return ''
  }

  const start = points[0]
  const end = points[points.length - 1]
  const line = buildLinePath(points)
  return `${line} L ${end.x.toFixed(2)} ${baselineY.toFixed(2)} L ${start.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
}
