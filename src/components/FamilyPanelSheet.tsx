import {
  CheckCircle,
  CopySimple,
  LinkSimple,
  UsersThree,
  WarningCircle,
  X,
} from '@phosphor-icons/react'

export type FamilyPanelMode = 'create' | 'join'

interface FamilyPanelSheetProps {
  currentHouseholdInviteCode?: string
  currentHouseholdName: string
  familyMessage: string
  familyMessageTone: 'neutral' | 'success' | 'error'
  hasJoinedHousehold: boolean
  householdNameDraft: string
  inviteCodeDraft: string
  mode: FamilyPanelMode
  onClose: () => void
  onCopyInviteCode: () => void
  onCreateHousehold: () => void
  onHouseholdNameDraftChange: (value: string) => void
  onInviteCodeDraftChange: (value: string) => void
  onJoinHousehold: () => void
  onModeChange: (mode: FamilyPanelMode) => void
  onShareInviteLink: () => void
  show: boolean
  syncEnabled: boolean
}

export function FamilyPanelSheet({
  currentHouseholdInviteCode,
  currentHouseholdName,
  familyMessage,
  familyMessageTone,
  hasJoinedHousehold,
  householdNameDraft,
  inviteCodeDraft,
  mode,
  onClose,
  onCopyInviteCode,
  onCreateHousehold,
  onHouseholdNameDraftChange,
  onInviteCodeDraftChange,
  onJoinHousehold,
  onModeChange,
  onShareInviteLink,
  show,
  syncEnabled,
}: FamilyPanelSheetProps) {
  if (!show) {
    return null
  }

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

  const canCreateHousehold = householdNameDraft.trim().length > 0
  const canJoinHousehold = inviteCodeDraft.trim().length === 12
  const createButtonClass = canCreateHousehold
    ? 'bg-emerald-400 text-slate-950 shadow-[0_8px_18px_rgba(16,185,129,0.18)]'
    : 'bg-slate-200/90 text-slate-500 shadow-none dark:bg-zinc-800 dark:text-zinc-500'
  const joinButtonClass = canJoinHousehold
    ? 'border-emerald-400/35 bg-emerald-400/12 text-emerald-700 shadow-[0_8px_18px_rgba(16,185,129,0.12)] dark:text-emerald-200'
    : 'border-[var(--surface-border-strong)] bg-[var(--control-bg)] text-secondary'

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/36 backdrop-blur-sm dark:bg-slate-950/72">
      <button
        type="button"
        aria-label="关闭家庭共享面板"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="家庭共享"
        className="sheet-surface absolute inset-x-0 bottom-0 mx-auto max-w-3xl rounded-t-[24px] px-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--surface-border-strong)]" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              <UsersThree size={12} />
              家庭共享
            </p>
            <h2 className="mt-1 truncate text-[1.08rem] font-semibold text-primary">
              {hasJoinedHousehold ? currentHouseholdName : '还没有加入家庭'}
            </h2>
            <p className="mt-1 text-[0.8rem] text-muted">
              {syncEnabled
                ? '选择创建新家庭，或用邀请码加入现有家庭。'
                : '配置 Supabase 后，才可以跨设备同步和共享。'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="action-tap inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--surface-border-strong)] bg-[var(--control-bg)] text-secondary"
            aria-label="关闭家庭共享面板"
          >
            <X size={14} />
          </button>
        </div>

        {hasJoinedHousehold && currentHouseholdInviteCode && syncEnabled && (
          <div className="mt-3 rounded-xl border border-[var(--surface-border)] bg-[var(--control-bg)] px-3 py-2.5">
            <p className="text-[0.66rem] uppercase tracking-[0.14em] text-muted">当前邀请码</p>
            <p className="mt-1.5 truncate font-mono text-[0.92rem] tracking-[0.14em] text-primary">
              {currentHouseholdInviteCode}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onShareInviteLink}
                className="action-tap inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 text-[0.8rem] font-medium text-emerald-700 dark:text-emerald-200"
              >
                <LinkSimple size={13} />
                分享链接
              </button>
              <button
                type="button"
                onClick={onCopyInviteCode}
                className="action-tap inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-3 text-[0.8rem] font-medium text-secondary"
              >
                <CopySimple size={13} />
                复制邀请码
              </button>
            </div>
          </div>
        )}

        {familyMessage && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[0.78rem] ${familyMessageClass}`}
          >
            <FamilyMessageIcon size={14} />
            {familyMessage}
          </div>
        )}

        {syncEnabled ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex gap-1 rounded-xl border border-[var(--surface-border)] bg-black/[0.03] p-1 ring-1 ring-black/2 dark:bg-white/[0.03] dark:ring-white/3">
              <button
                type="button"
                onClick={() => onModeChange('create')}
                className={`action-tap inline-flex h-8 flex-1 items-center justify-center rounded-lg text-[0.79rem] font-medium ${mode === 'create' ? 'bg-[var(--surface-bg)] text-primary shadow-[0_4px_10px_rgba(15,23,42,0.08)] ring-1 ring-[var(--surface-border)]' : 'text-muted'}`}
              >
                创建家庭
              </button>
              <button
                type="button"
                onClick={() => onModeChange('join')}
                className={`action-tap inline-flex h-8 flex-1 items-center justify-center rounded-lg text-[0.79rem] font-medium ${mode === 'join' ? 'bg-[var(--surface-bg)] text-primary shadow-[0_4px_10px_rgba(15,23,42,0.08)] ring-1 ring-[var(--surface-border)]' : 'text-muted'}`}
              >
                加入家庭
              </button>
            </div>

            {mode === 'create' ? (
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <label
                  htmlFor="householdName"
                  className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted"
                >
                  家庭名称
                </label>
                <input
                  id="householdName"
                  value={householdNameDraft}
                  onChange={(event) => onHouseholdNameDraftChange(event.target.value)}
                  className="control-surface mt-1.5 h-9 w-full rounded-lg px-2.5 text-[0.82rem] text-primary outline-none placeholder:text-[color:var(--text-muted)] focus:border-emerald-400"
                  placeholder={currentHouseholdName || '例如：我家宝宝'}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <button
                  type="button"
                  onClick={onCreateHousehold}
                  disabled={!canCreateHousehold}
                  className={`action-tap mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg px-3 text-[0.8rem] font-semibold transition-opacity ${createButtonClass} ${canCreateHousehold ? '' : 'cursor-not-allowed opacity-72'}`}
                >
                  创建家庭
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <label
                  htmlFor="inviteCode"
                  className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted"
                >
                  邀请码
                </label>
                <input
                  id="inviteCode"
                  value={inviteCodeDraft}
                  onChange={(event) => onInviteCodeDraftChange(event.target.value)}
                  className="control-surface mt-1.5 h-9 w-full rounded-lg px-2.5 font-mono text-[0.82rem] tracking-[0.08em] text-primary outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-[color:var(--text-muted)] focus:border-emerald-400"
                  placeholder="例如：8fa0c1d2e3b4"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <button
                  type="button"
                  onClick={onJoinHousehold}
                  disabled={!canJoinHousehold}
                  className={`action-tap mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg border px-3 text-[0.8rem] font-semibold transition-colors ${joinButtonClass} ${canJoinHousehold ? '' : 'cursor-not-allowed opacity-72'}`}
                >
                  加入当前家庭
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-3 text-[0.8rem] text-muted">
            配置 Supabase URL 和 Anon Key 后，这里会出现创建家庭、加入家庭、分享链接等能力。
          </div>
        )}
      </section>
    </div>
  )
}
