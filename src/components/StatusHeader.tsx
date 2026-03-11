import {
  ArrowClockwise,
  CaretRight,
  CheckCircle,
  CloudCheck,
  CloudSlash,
  LinkSimple,
  MoonStars,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react'
import { buildSyncLabel, getSyncBadgeClass, shortTime } from '../lib/ui'
import type { SyncPhase } from '../lib/types'

interface StatusHeaderProps {
  currentHouseholdInviteCode?: string
  currentHouseholdName: string
  familyMessage: string
  familyMessageTone: 'neutral' | 'success' | 'error'
  hasJoinedHousehold: boolean
  householdNameDraft: string
  inviteCodeDraft: string
  lastSyncedAt?: string
  needRefresh: boolean
  offlineReady: boolean
  onCopyInviteCode: () => void
  onCreateHousehold: () => void
  onHouseholdNameDraftChange: (value: string) => void
  onInviteCodeDraftChange: (value: string) => void
  onJoinHousehold: () => void
  onShareInviteLink: () => void
  onSyncNow: () => void
  onToggleFamilyPanel: () => void
  onUpdateServiceWorker: () => void
  showFamilyPanel: boolean
  syncEnabled: boolean
  syncMessage: string
  syncPhase: SyncPhase
}

export function StatusHeader({
  currentHouseholdInviteCode,
  currentHouseholdName,
  familyMessage,
  familyMessageTone,
  hasJoinedHousehold,
  lastSyncedAt,
  needRefresh,
  offlineReady,
  onShareInviteLink,
  onSyncNow,
  onToggleFamilyPanel,
  onUpdateServiceWorker,
  showFamilyPanel,
  syncEnabled,
  syncMessage,
  syncPhase,
}: StatusHeaderProps) {
  const familyMessageClass =
    familyMessageTone === 'error'
      ? 'border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-100'
      : familyMessageTone === 'success'
        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
        : 'border-[var(--surface-border-strong)] bg-[var(--control-bg)] text-secondary'

  const FamilyMessageIcon =
    familyMessageTone === 'error'
      ? WarningCircle
      : familyMessageTone === 'success'
        ? CheckCircle
        : UsersThree

  const canShareInvite = syncEnabled && hasJoinedHousehold && Boolean(currentHouseholdInviteCode)
  const syncButtonDisabled = syncPhase === 'syncing'
  const syncButtonClass = syncButtonDisabled
    ? 'border-cyan-400/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100'
    : 'border-[var(--surface-border-strong)] bg-[var(--surface-bg)] text-secondary shadow-[0_4px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_6px_14px_rgba(2,6,23,0.22)]'

  return (
    <header className="surface overflow-hidden px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted">
          <MoonStars size={12} weight="fill" />
          跟随系统
        </p>
        <h1 className="mt-1 text-[clamp(1.25rem,5vw,1.75rem)] font-bold tracking-tight text-primary">
          宝宝日常记录
        </h1>
        <p className="mt-1 max-w-[24rem] text-[0.8rem] leading-relaxed text-secondary sm:text-[0.85rem]">
          单手点一下，自动同步给家人。
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/[0.02] p-1.5 ring-1 ring-[var(--surface-border)] dark:bg-white/[0.02]">
        <div className="min-w-0 flex flex-1 items-center gap-[0.3125rem] overflow-hidden">
          <span
            className={`inline-flex h-[2rem] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[0.75rem] font-medium ring-1 ${getSyncBadgeClass(syncPhase)}`}
          >
            {syncPhase === 'ready' && <CloudCheck size={13} weight="fill" />}
            {syncPhase === 'syncing' && <ArrowClockwise size={13} className="animate-spin" />}
            {(syncPhase === 'offline' || syncPhase === 'local-only') && <CloudSlash size={13} />}
            {(syncPhase === 'error' || syncPhase === 'setup') && <WarningCircle size={13} />}
            {buildSyncLabel(syncPhase)}
          </span>

          {syncEnabled && lastSyncedAt && (
            <span className="truncate pl-1 text-[0.7rem] text-muted">{shortTime(lastSyncedAt)} 更新</span>
          )}
        </div>

        {syncEnabled && (
          <button
            type="button"
            onClick={onSyncNow}
            disabled={syncButtonDisabled}
            className={`action-tap inline-flex h-[2rem] shrink-0 items-center gap-[0.3125rem] rounded-xl border px-[0.6rem] text-[0.75rem] font-medium ${syncButtonClass} ${syncButtonDisabled ? 'cursor-default' : ''}`}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/4 dark:bg-white/8">
              <ArrowClockwise size={10} className={syncButtonDisabled ? 'animate-spin' : ''} />
            </span>
            {syncButtonDisabled ? '同步中' : '同步'}
          </button>
        )}
      </div>

      <section
        className={`mt-2 rounded-2xl bg-black/[0.02] px-3.5 py-3 ring-1 dark:bg-white/[0.02] ${showFamilyPanel
            ? 'ring-emerald-400 shadow-[0_8px_18px_rgba(16,185,129,0.08)]'
            : 'ring-[var(--surface-border)]'
          }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFamilyPanel}
            className="action-tap flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted">
                <UsersThree size={12} weight="fill" />
                家庭共享
              </p>
              <p className="mt-0.5 truncate text-[0.85rem] font-semibold text-primary">
                {hasJoinedHousehold
                  ? currentHouseholdName
                  : syncEnabled
                    ? '还没有加入家庭'
                    : '当前仅本机记录'}
              </p>
              <div className="mt-[0.25rem] flex flex-wrap items-center gap-[0.3125rem]">
                {hasJoinedHousehold && currentHouseholdInviteCode ? (
                  <span className="inline-flex max-w-full items-center rounded-lg bg-[var(--surface-bg)] px-2.5 py-0.5 font-mono text-[0.68rem] tracking-[0.12em] text-secondary ring-1 ring-[var(--surface-border)] shadow-sm">
                    邀请码 {currentHouseholdInviteCode}
                  </span>
                ) : (
                  <span className="text-[0.72rem] text-muted">
                    {syncEnabled ? '点开后可创建或加入。' : '配置 Supabase 后可共享。'}
                  </span>
                )}
              </div>
            </div>

            <span className="inline-flex h-[1.75rem] w-[1.75rem] shrink-0 items-center justify-center rounded-full bg-[var(--surface-bg)] text-secondary ring-1 ring-[var(--surface-border)] shadow-sm">
              <CaretRight size={14} />
            </span>
          </button>

          {canShareInvite && (
            <button
              type="button"
              onClick={onShareInviteLink}
              className="action-tap inline-flex h-[2rem] shrink-0 items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-3 text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-200"
            >
              <LinkSimple size={13} />
              分享
            </button>
          )}
        </div>
      </section>

      {familyMessage && (
        <div
          className={`mt-2.5 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[0.8rem] shadow-sm ${familyMessageClass}`}
        >
          <FamilyMessageIcon size={16} weight="fill" />
          {familyMessage}
        </div>
      )}

      {syncMessage && (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-2.5 py-1.25 text-[0.76rem] text-red-700 dark:text-red-100">
          <WarningCircle size={13} />
          {syncMessage}
        </div>
      )}

      {offlineReady && (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.25 text-[0.76rem] text-emerald-700 dark:text-emerald-100">
          <CheckCircle size={13} />
          已支持离线记录。
        </div>
      )}

      {needRefresh && (
        <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1.25 text-[0.76rem] text-cyan-700 dark:text-cyan-100">
          <span>有新版本可用。</span>
          <button
            type="button"
            onClick={onUpdateServiceWorker}
            className="action-tap rounded-md bg-cyan-300 px-[0.5625rem] py-1 text-[0.7rem] font-semibold text-slate-900"
          >
            立即更新
          </button>
        </div>
      )}
    </header>
  )
}
