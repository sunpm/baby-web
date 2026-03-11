import { dateGroupKey, dateGroupLabel, kindName, relativeMinutes, shortTime } from './ui'
import type { BabyEvent, EventKind } from './types'

export interface SummaryData {
  feedCount: number
  feedTotal: number
  poopCount: number
  probioticCount: number
}

export interface TrendPoint {
  label: string
  value: number
}

export interface TrendCardData {
  badgeClass: string
  footerLabel: string
  points: TrendPoint[]
  title: string
  todayLabel: string
  toneClass: string
}

export interface TrendDigestItem {
  detail: string
  title: string
  toneClass: string
  value: string
}

export interface TrendLatestItem {
  detail: string
  timeLabel: string
  title: string
  toneClass: string
}

export interface TrendOverviewData {
  latestItems: TrendLatestItem[]
  todayItems: TrendDigestItem[]
}

const TREND_KINDS = ['feeding', 'poop', 'probiotic'] as const satisfies readonly EventKind[]

const TREND_CARD_STYLE: Record<
  EventKind,
  { badgeClass: string; toneClass: string; unitLabel: string }
> = {
  feeding: {
    badgeClass:
      'bg-emerald-500/18 text-emerald-700 dark:bg-emerald-400/22 dark:text-emerald-200',
    toneClass: 'text-emerald-600 dark:text-emerald-300',
    unitLabel: 'ml',
  },
  poop: {
    badgeClass: 'bg-slate-500/14 text-slate-700 dark:bg-slate-400/22 dark:text-slate-200',
    toneClass: 'text-slate-500 dark:text-slate-300',
    unitLabel: '次',
  },
  probiotic: {
    badgeClass: 'bg-cyan-500/18 text-cyan-700 dark:bg-cyan-400/22 dark:text-cyan-200',
    toneClass: 'text-cyan-600 dark:text-cyan-300',
    unitLabel: '次',
  },
}

const TREND_ITEM_TONE: Record<EventKind, string> = {
  feeding: 'text-emerald-700 dark:text-emerald-200',
  poop: 'text-slate-700 dark:text-slate-100',
  probiotic: 'text-cyan-700 dark:text-cyan-200',
}

export function eventDefaultAmount(event: BabyEvent) {
  if (typeof event.amount === 'number' && event.amount > 0) {
    return event.amount
  }

  return event.kind === 'feeding' ? 90 : 1
}

export function buildSummary(events: BabyEvent[]): SummaryData {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

  let feedCount = 0
  let feedTotal = 0
  let poopCount = 0
  let probioticCount = 0

  for (const event of events) {
    if (Date.parse(event.eventAt) < oneDayAgo) {
      continue
    }

    if (event.kind === 'feeding') {
      feedCount += 1
      feedTotal += typeof event.amount === 'number' ? event.amount : 0
      continue
    }

    if (event.kind === 'poop') {
      poopCount += 1
      continue
    }

    probioticCount += 1
  }

  return {
    feedCount,
    feedTotal,
    poopCount,
    probioticCount,
  }
}

export function buildTrendCards(events: BabyEvent[]): TrendCardData[] {
  const series = buildTrendSeries(events)

  return TREND_KINDS.map((kind) => {
    const points = series[kind]
    const style = TREND_CARD_STYLE[kind]
    const todayValue = points.at(-1)?.value ?? 0

    return {
      badgeClass: style.badgeClass,
      footerLabel: `近7天累计 ${sumSeries(points)} ${style.unitLabel}`,
      points,
      title: kindName(kind),
      todayLabel: `今天 ${todayValue} ${style.unitLabel}`,
      toneClass: style.toneClass,
    }
  })
}

export function buildTrendOverviewData(events: BabyEvent[]): TrendOverviewData {
  const todayKey = dateGroupKey(new Date())

  let todayFeedCount = 0
  let todayFeedTotal = 0
  let todayPoopCount = 0
  let todayProbioticCount = 0

  const latestByKind: Record<EventKind, BabyEvent | null> = {
    feeding: null,
    poop: null,
    probiotic: null,
  }

  for (const event of events) {
    if (dateGroupKey(event.eventAt) === todayKey) {
      if (event.kind === 'feeding') {
        todayFeedCount += 1
        todayFeedTotal += typeof event.amount === 'number' ? event.amount : 0
      } else if (event.kind === 'poop') {
        todayPoopCount += 1
      } else {
        todayProbioticCount += 1
      }
    }

    const latestEvent = latestByKind[event.kind]
    if (!latestEvent || Date.parse(event.eventAt) > Date.parse(latestEvent.eventAt)) {
      latestByKind[event.kind] = event
    }
  }

  return {
    latestItems: TREND_KINDS.map((kind) => buildLatestTrendItem(kind, latestByKind[kind])),
    todayItems: [
      {
        detail: todayFeedCount > 0 ? `${todayFeedCount} 次` : '今天还没记',
        title: kindName('feeding'),
        toneClass: TREND_ITEM_TONE.feeding,
        value: `${todayFeedTotal} ml`,
      },
      {
        detail: todayPoopCount > 0 ? `${todayPoopCount} 次` : '今天还没记',
        title: kindName('poop'),
        toneClass: TREND_ITEM_TONE.poop,
        value: `${todayPoopCount} 次`,
      },
      {
        detail: todayProbioticCount > 0 ? `${todayProbioticCount} 次` : '今天还没记',
        title: kindName('probiotic'),
        toneClass: TREND_ITEM_TONE.probiotic,
        value: `${todayProbioticCount} 次`,
      },
    ],
  }
}

function buildTrendSeries(events: BabyEvent[]) {
  const dates: { key: string; label: string }[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    dates.push({
      key: dateGroupKey(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    })
  }

  const totals: Record<EventKind, Map<string, number>> = {
    feeding: new Map<string, number>(),
    poop: new Map<string, number>(),
    probiotic: new Map<string, number>(),
  }

  for (const event of events) {
    const key = dateGroupKey(event.eventAt)

    if (event.kind === 'feeding') {
      totals.feeding.set(key, (totals.feeding.get(key) ?? 0) + (event.amount ?? 0))
      continue
    }

    if (event.kind === 'poop') {
      totals.poop.set(key, (totals.poop.get(key) ?? 0) + 1)
      continue
    }

    totals.probiotic.set(key, (totals.probiotic.get(key) ?? 0) + 1)
  }

  return {
    feeding: dates.map((date) => ({ label: date.label, value: totals.feeding.get(date.key) ?? 0 })),
    poop: dates.map((date) => ({ label: date.label, value: totals.poop.get(date.key) ?? 0 })),
    probiotic: dates.map((date) => ({
      label: date.label,
      value: totals.probiotic.get(date.key) ?? 0,
    })),
  }
}

function buildLatestTrendItem(kind: EventKind, event: BabyEvent | null): TrendLatestItem {
  if (!event) {
    return {
      detail: '还没有记录',
      timeLabel: '暂无',
      title: kindName(kind),
      toneClass: TREND_ITEM_TONE[kind],
    }
  }

  return {
    detail: relativeMinutes(event.eventAt),
    timeLabel: `${dateGroupLabel(event.eventAt)} ${shortTime(event.eventAt)}`,
    title: kindName(kind),
    toneClass: TREND_ITEM_TONE[kind],
  }
}

function sumSeries(points: TrendPoint[]) {
  return points.reduce((sum, point) => sum + point.value, 0)
}
