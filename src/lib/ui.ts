import type { BabyEvent, EventKind, SyncPhase } from './types'

export const MILK_PRESETS = [60, 90, 120] as const
export const DOSE_PRESETS = [1, 2] as const

export function normalizeHouseholdName(value: string) {
  const safeValue = value.trim().replace(/\s+/g, ' ').slice(0, 48)
  return safeValue || '我家宝宝'
}

export function normalizeInviteCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-f0-9]/g, '').slice(0, 12)
}

export function buildInviteShareUrl(inviteCode: string) {
  const normalizedInviteCode = normalizeInviteCode(inviteCode)
  if (!normalizedInviteCode) {
    return ''
  }

  if (typeof window === 'undefined') {
    return `?invite=${normalizedInviteCode}`
  }

  const url = new URL(window.location.href)
  url.searchParams.set('invite', normalizedInviteCode)
  return url.toString()
}

export function readInviteCodeFromUrl() {
  if (typeof window === 'undefined') {
    return ''
  }

  const url = new URL(window.location.href)
  return normalizeInviteCode(url.searchParams.get('invite') ?? '')
}

export function shortTime(isoText: string) {
  return new Date(isoText).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function relativeMinutes(isoText: string) {
  const elapsed = Date.now() - Date.parse(isoText)
  const minutes = Math.max(1, Math.round(elapsed / 60_000))
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }
  const days = Math.round(hours / 24)
  return `${days} 天前`
}

export function kindName(kind: EventKind) {
  if (kind === 'feeding') {
    return '喂奶'
  }
  if (kind === 'poop') {
    return '拉粑粑'
  }
  return '益生菌'
}

export function kindClassName(kind: EventKind) {
  if (kind === 'feeding') {
    return 'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-200 dark:ring-emerald-400/40'
  }
  if (kind === 'poop') {
    return 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-400/30 dark:bg-zinc-400/20 dark:text-zinc-200 dark:ring-zinc-400/40'
  }
  return 'bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-400/35 dark:bg-cyan-400/20 dark:text-cyan-200 dark:ring-cyan-400/40'
}

export function formatEventAmount(event: BabyEvent) {
  if (typeof event.amount !== 'number' || !event.unit) {
    return '已记录'
  }

  const unitLabel = event.unit === 'dose' ? '剂' : 'ml'
  return `${event.amount} ${unitLabel}`
}

export function dateGroupKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateGroupLabel(isoText: string) {
  const target = new Date(isoText)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const targetKey = dateGroupKey(target)
  const todayKey = dateGroupKey(today)
  const yesterdayKey = dateGroupKey(yesterday)

  if (targetKey === todayKey) {
    return '今天'
  }
  if (targetKey === yesterdayKey) {
    return '昨天'
  }

  return target.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return '同步失败，请稍后重试。'
  }

  const message = (error as { message?: string }).message
  if (!message) {
    return '同步失败，请稍后重试。'
  }
  if (message.includes('Invalid API key')) {
    return 'Supabase Key 无效，请检查环境变量。'
  }
  if (message.includes('permission denied')) {
    return '数据库权限不足，请确认 RLS 配置。'
  }
  if (message.toLowerCase().includes('anonymous sign-ins are disabled')) {
    return 'Supabase 未开启匿名登录，请到 Authentication / Sign In 打开 Anonymous sign-ins。'
  }
  if (message.toLowerCase().includes('invite code not found')) {
    return '邀请码无效，请检查后重试。'
  }
  if (message.toLowerCase().includes('household name is required')) {
    return '请先填写家庭名称。'
  }
  if (message.toLowerCase().includes('not authenticated')) {
    return '登录状态失效，请稍后再试。'
  }
  if (message.toLowerCase().includes('supabase is not configured')) {
    return '还没有配置 Supabase URL 和 Anon Key。'
  }
  return message
}

export function buildSyncLabel(phase: SyncPhase) {
  if (phase === 'local-only') {
    return '仅本机'
  }
  if (phase === 'offline') {
    return '离线待传'
  }
  if (phase === 'syncing') {
    return '同步中'
  }
  if (phase === 'ready') {
    return '已同步'
  }
  if (phase === 'setup') {
    return '待加入家庭'
  }
  return '同步异常'
}

export function getSyncBadgeClass(phase: SyncPhase) {
  if (phase === 'ready') {
    return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100'
  }
  if (phase === 'syncing') {
    return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-100'
  }
  if (phase === 'setup') {
    return 'border-amber-400/35 bg-amber-500/12 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100'
  }
  if (phase === 'error') {
    return 'border-red-400/35 bg-red-500/12 text-red-700 dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-100'
  }
  return 'border-slate-300/55 bg-slate-500/10 text-slate-700 dark:border-zinc-400/35 dark:bg-zinc-500/20 dark:text-zinc-200'
}

export function parsePositiveInt(value: string, fallback: number) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return fallback
  }

  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(parsed, 999)
}
