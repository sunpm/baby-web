import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { EventEditorSheet } from './components/EventEditorSheet'
import { FamilyPanelSheet, type FamilyPanelMode } from './components/FamilyPanelSheet'
import { InstallGuideSheet } from './components/InstallGuideSheet'
import { QuickActionBar } from './components/QuickActionBar'
import { RecentEventList } from './components/RecentEventList'
import { StatusHeader } from './components/StatusHeader'
import { SummaryGrid } from './components/SummaryGrid'
import { TrendOverview } from './components/TrendOverview'
import { UndoToast } from './components/UndoToast'
import { ViewTabs } from './components/ViewTabs'
import { usePwaInstall } from './hooks/usePwaInstall'
import { useStoreSync } from './hooks/useStoreSync'
import {
  buildSummary,
  buildTrendCards,
  buildTrendOverviewData,
  eventDefaultAmount,
} from './lib/insights'
import {
  createHouseholdMembership,
  hasSupabaseConfig,
  joinHouseholdMembership,
} from './lib/supabase'
import {
  applyMutations,
  countPendingRecords,
  createDeleteMutation,
  createEvent,
  createUpsertMutation,
  isLocalHouseholdId,
  loadStore,
  persistStore,
} from './lib/storage'
import {
  buildInviteShareUrl,
  getErrorMessage,
  kindName,
  normalizeHouseholdName,
  normalizeInviteCode,
  parsePositiveInt,
  readInviteCodeFromUrl,
} from './lib/ui'
import type { AppStore, BabyEvent, EventKind, EventMutation } from './lib/types'

type UndoAction =
  | { label: string; type: 'create'; event: BabyEvent }
  | { label: string; type: 'update'; event: BabyEvent; previousEvent: BabyEvent }
  | { label: string; type: 'delete'; event: BabyEvent }

type FamilyMessageTone = 'neutral' | 'success' | 'error'

const DEFAULT_HOUSEHOLD_NAME = normalizeHouseholdName(
  import.meta.env.VITE_BABY_HOUSEHOLD_NAME ?? '我家宝宝',
)
const RECENT_EVENT_LIMIT = 30

function App() {
  const [store, setStore] = useState<AppStore>(() => loadStore(DEFAULT_HOUSEHOLD_NAME))
  const initialInviteCode = readInviteCodeFromUrl()
  const [milkAmountInput, setMilkAmountInput] = useState('90')
  const [doseAmount, setDoseAmount] = useState(1)
  const [composerKind, setComposerKind] = useState<EventKind>('feeding')
  const [showFamilyPanel, setShowFamilyPanel] = useState(Boolean(initialInviteCode))
  const [familyPanelMode, setFamilyPanelMode] = useState<FamilyPanelMode>(
    initialInviteCode ? 'join' : 'create',
  )
  const [householdNameDraft, setHouseholdNameDraft] = useState(store.householdName)
  const [inviteCodeDraft, setInviteCodeDraft] = useState(initialInviteCode)
  const [familyMessage, setFamilyMessage] = useState(
    initialInviteCode ? '已从分享链接填入邀请码，点加入即可。' : '',
  )
  const [familyMessageTone, setFamilyMessageTone] = useState<FamilyMessageTone>(
    initialInviteCode ? 'neutral' : 'success',
  )
  const [lastCreatedId, setLastCreatedId] = useState('')
  const [composerHeight, setComposerHeight] = useState(0)
  const [editingEventId, setEditingEventId] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [draftNote, setDraftNote] = useState('')
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)
  const [activeTab, setActiveTab] = useState<'log' | 'trends'>('log')
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const storeRef = useRef(store)
  const composerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    storeRef.current = store
  }, [store])

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()
  const { isBooting, syncMessage, syncNow, syncPhase } = useStoreSync({
    setStore,
    store,
  })
  const {
    entryTone: installEntryTone,
    guideMode: installGuideMode,
    isInstalled,
    requestInstall,
    showInstallEntry,
  } = usePwaInstall()

  const editingEvent = useMemo(() => {
    if (!editingEventId) {
      return null
    }

    return store.events.find((event) => event.id === editingEventId) ?? null
  }, [editingEventId, store.events])

  const hasJoinedHousehold = useMemo(
    () => !isLocalHouseholdId(store.householdId),
    [store.householdId],
  )
  const summary = useMemo(() => buildSummary(store.events), [store.events])
  const trendCards = useMemo(() => buildTrendCards(store.events), [store.events])
  const trendOverviewData = useMemo(() => buildTrendOverviewData(store.events), [store.events])
  const recentEvents = useMemo(() => store.events.slice(0, RECENT_EVENT_LIMIT), [store.events])
  const pendingCount = useMemo(
    () => countPendingRecords(store.pendingMutations),
    [store.pendingMutations],
  )

  const setFamilyNotice = useCallback((message: string, tone: FamilyMessageTone = 'neutral') => {
    setFamilyMessage(message)
    setFamilyMessageTone(tone)
  }, [])

  const handleHouseholdNameDraftChange = useCallback(
    (value: string) => {
      setHouseholdNameDraft(value)
      if (familyMessage) {
        setFamilyNotice('')
      }
    },
    [familyMessage, setFamilyNotice],
  )

  const handleInviteCodeDraftChange = useCallback(
    (value: string) => {
      setInviteCodeDraft(normalizeInviteCode(value))
      if (familyMessage) {
        setFamilyNotice('')
      }
    },
    [familyMessage, setFamilyNotice],
  )

  const handleFamilyPanelModeChange = useCallback((mode: FamilyPanelMode) => {
    setFamilyPanelMode(mode)
    if (familyMessage) {
      setFamilyNotice('')
    }
  }, [familyMessage, setFamilyNotice])

  const commitMutation = useCallback((mutation: EventMutation) => {
    setStore((previous) => ({
      ...previous,
      events: applyMutations(previous.events, [mutation]),
      pendingMutations: [...previous.pendingMutations, mutation],
    }))
  }, [])

  const addEvent = useCallback(
    (kind: EventKind) => {
      const payload =
        kind === 'feeding'
          ? { amount: parsePositiveInt(milkAmountInput, 90), unit: 'ml' as const }
          : kind === 'probiotic'
            ? { amount: doseAmount, unit: 'dose' as const }
            : {}

      const event = createEvent({
        deviceId: storeRef.current.deviceId,
        householdId: storeRef.current.householdId,
        kind,
        ...payload,
      })

      commitMutation(createUpsertMutation(event))
      setLastCreatedId(event.id)
      setUndoAction({ label: `${kindName(kind)} 已添加`, type: 'create', event })
    },
    [commitMutation, doseAmount, milkAmountInput],
  )

  const openEventEditor = useCallback((eventId: string) => {
    const event = storeRef.current.events.find((current) => current.id === eventId)
    if (!event) {
      return
    }

    setDraftAmount(String(eventDefaultAmount(event)))
    setDraftNote(event.note ?? '')
    setEditingEventId(eventId)
  }, [])

  const closeEditor = useCallback(() => {
    setEditingEventId('')
  }, [])

  const deleteEvent = useCallback(
    (event: BabyEvent) => {
      commitMutation(
        createDeleteMutation({
          eventId: event.id,
          householdId: event.householdId,
        }),
      )
      setUndoAction({ label: `${kindName(event.kind)} 已删除`, type: 'delete', event })
      setLastCreatedId('')
      setEditingEventId('')
    },
    [commitMutation],
  )

  const deleteEventById = useCallback(
    (eventId: string) => {
      const event = storeRef.current.events.find((current) => current.id === eventId)
      if (event) {
        deleteEvent(event)
      }
    },
    [deleteEvent],
  )

  const saveEditedEvent = useCallback(() => {
    if (!editingEvent) {
      return
    }

    const trimmedNote = draftNote.trim()
    const updatedEvent: BabyEvent = {
      ...editingEvent,
      amount:
        editingEvent.kind === 'poop'
          ? undefined
          : parsePositiveInt(draftAmount, eventDefaultAmount(editingEvent)),
      unit:
        editingEvent.kind === 'feeding'
          ? 'ml'
          : editingEvent.kind === 'probiotic'
            ? 'dose'
            : undefined,
      note: trimmedNote || undefined,
    }

    commitMutation(createUpsertMutation(updatedEvent))
    setUndoAction({
      label: `${kindName(updatedEvent.kind)} 已更新`,
      type: 'update',
      event: updatedEvent,
      previousEvent: editingEvent,
    })
    setLastCreatedId('')
    setEditingEventId('')
  }, [commitMutation, draftAmount, draftNote, editingEvent])

  const undoLastAction = useCallback(() => {
    if (!undoAction) {
      return
    }

    if (undoAction.type === 'create') {
      commitMutation(
        createDeleteMutation({
          eventId: undoAction.event.id,
          householdId: undoAction.event.householdId,
        }),
      )
      setLastCreatedId('')
      setUndoAction(null)
      return
    }

    if (undoAction.type === 'update') {
      commitMutation(createUpsertMutation(undoAction.previousEvent))
      setLastCreatedId('')
      setUndoAction(null)
      return
    }

    commitMutation(createUpsertMutation(undoAction.event))
    setLastCreatedId(undoAction.event.id)
    setUndoAction(null)
  }, [commitMutation, undoAction])

  const createHousehold = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setFamilyNotice('还没有配置 Supabase URL 和 Anon Key。', 'error')
      return
    }

    setFamilyNotice('')

    try {
      const membership = await createHouseholdMembership(
        normalizeHouseholdName(householdNameDraft || store.householdName),
      )
      setHouseholdNameDraft(membership.householdName)
      setInviteCodeDraft(membership.householdInviteCode)
      setShowFamilyPanel(false)
      setEditingEventId('')
      setUndoAction(null)
      setLastCreatedId('')
      setFamilyPanelMode('create')
      setFamilyNotice('已创建家庭，现在可以把链接发给家人一起记录。', 'success')
      void syncNow(
        'manual',
        membership,
        !isLocalHouseholdId(storeRef.current.householdId) &&
          storeRef.current.householdId !== membership.householdId,
      )
    } catch (error) {
      setFamilyNotice(getErrorMessage(error), 'error')
    }
  }, [householdNameDraft, setFamilyNotice, store.householdName, syncNow])

  const joinHousehold = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setFamilyNotice('还没有配置 Supabase URL 和 Anon Key。', 'error')
      return
    }

    const normalizedInviteCode = normalizeInviteCode(inviteCodeDraft)
    if (!normalizedInviteCode) {
      setFamilyNotice('请先输入邀请码。', 'error')
      return
    }

    setFamilyNotice('')

    try {
      const membership = await joinHouseholdMembership(normalizedInviteCode)
      setHouseholdNameDraft(membership.householdName)
      setInviteCodeDraft(membership.householdInviteCode)
      setShowFamilyPanel(false)
      setEditingEventId('')
      setUndoAction(null)
      setLastCreatedId('')
      setFamilyPanelMode('join')
      setFamilyNotice('已加入家庭，之后的记录会同步到同一个空间。', 'success')
      void syncNow(
        'manual',
        membership,
        !isLocalHouseholdId(storeRef.current.householdId) &&
          storeRef.current.householdId !== membership.householdId,
      )
    } catch (error) {
      setFamilyNotice(getErrorMessage(error), 'error')
    }
  }, [inviteCodeDraft, setFamilyNotice, syncNow])

  const copyInviteCode = useCallback(async () => {
    if (!store.householdInviteCode) {
      setFamilyNotice('当前家庭还没有可复制的邀请码。', 'error')
      return
    }

    if (typeof navigator.clipboard?.writeText !== 'function') {
      setFamilyNotice('当前浏览器不支持复制，请手动抄一下邀请码。', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(store.householdInviteCode)
      setFamilyNotice('邀请码已复制。', 'success')
    } catch {
      setFamilyNotice('复制失败，请手动抄一下邀请码。', 'error')
    }
  }, [setFamilyNotice, store.householdInviteCode])

  const shareInviteLink = useCallback(async () => {
    if (!store.householdInviteCode) {
      setFamilyNotice('当前家庭还没有可分享的邀请码。', 'error')
      return
    }

    const inviteLink = buildInviteShareUrl(store.householdInviteCode)
    const shareTitle = `${store.householdName} · 宝宝记录共享`
    const shareText = `${store.householdName} 邀请你一起记录宝宝日常，打开链接后点加入即可。`

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteLink,
        })
        setFamilyNotice('已打开系统分享。', 'success')
        return
      } catch (error) {
        const isAbortError =
          (error instanceof DOMException && error.name === 'AbortError') ||
          (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name?: string }).name === 'AbortError')

        if (isAbortError) {
          return
        }
      }
    }

    if (typeof navigator.clipboard?.writeText !== 'function') {
      setFamilyNotice('当前浏览器不支持系统分享，也无法复制链接。', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      setFamilyNotice('分享链接已复制，发给家人即可。', 'success')
    } catch {
      setFamilyNotice('复制分享链接失败，请稍后再试。', 'error')
    }
  }, [setFamilyNotice, store.householdInviteCode, store.householdName])

  const handleManualSync = useCallback(() => {
    void syncNow('manual')
  }, [syncNow])

  const handleInstallClick = useCallback(async () => {
    setShowFamilyPanel(false)
    setEditingEventId('')

    const result = await requestInstall()

    if (result === 'guide' && installGuideMode) {
      setShowInstallGuide(true)
      return
    }

    if (result === 'unavailable') {
      setFamilyNotice('当前浏览器暂时没有可用安装入口，建议用 HTTPS 下的 Chrome 或 Edge 打开。', 'error')
    }
  }, [installGuideMode, requestInstall, setFamilyNotice])

  const toggleFamilyPanel = useCallback(() => {
    setEditingEventId('')
    setShowInstallGuide(false)
    setFamilyPanelMode(inviteCodeDraft ? 'join' : 'create')
    setShowFamilyPanel((previous) => !previous)
  }, [inviteCodeDraft])

  const closeFamilyPanel = useCallback(() => {
    setShowFamilyPanel(false)
  }, [])

  const closeInstallGuide = useCallback(() => {
    setShowInstallGuide(false)
  }, [])

  useEffect(() => {
    const inviteCode = readInviteCodeFromUrl()
    if (!inviteCode || typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    const nextSearch = url.searchParams.toString()
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`,
    )
  }, [])

  useEffect(() => {
    persistStore(store)
  }, [store])

  useEffect(() => {
    if (!lastCreatedId) {
      return
    }

    const timer = window.setTimeout(() => {
      setLastCreatedId('')
    }, 4000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [lastCreatedId])

  useEffect(() => {
    if (!familyMessage) {
      return
    }

    const timer = window.setTimeout(() => {
      setFamilyMessage('')
    }, 4800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [familyMessage])

  useEffect(() => {
    if (!undoAction) {
      return
    }

    const timer = window.setTimeout(() => {
      setUndoAction(null)
    }, 6000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [undoAction])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyThemeColor = () => {
      meta.setAttribute('content', media.matches ? '#081018' : '#f6f8f2')
    }

    applyThemeColor()
    media.addEventListener('change', applyThemeColor)
    return () => {
      media.removeEventListener('change', applyThemeColor)
    }
  }, [])

  useEffect(() => {
    const node = composerRef.current
    if (!node) {
      return
    }

    const updateHeight = () => {
      setComposerHeight(node.offsetHeight)
    }

    updateHeight()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeight())
      observer.observe(node)
      return () => {
        observer.disconnect()
      }
    }

    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <div className="min-h-[100dvh] bg-app text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-300 focus:px-3 focus:py-2 focus:text-slate-950"
      >
        跳到主要内容
      </a>

      <div className="mx-auto max-w-3xl px-2.5 pb-0.5 pt-1.5 sm:px-4 sm:pb-1 sm:pt-2">
        <StatusHeader
          currentHouseholdInviteCode={store.householdInviteCode}
          currentHouseholdName={store.householdName}
          familyMessage={familyMessage}
          familyMessageTone={familyMessageTone}
          hasJoinedHousehold={hasJoinedHousehold}
          installButtonTone={installEntryTone}
          lastSyncedAt={store.lastSyncedAt}
          needRefresh={needRefresh[0]}
          offlineReady={offlineReady[0]}
          onInstallClick={() => {
            void handleInstallClick()
          }}
          onShareInviteLink={() => {
            void shareInviteLink()
          }}
          onSyncNow={handleManualSync}
          onToggleFamilyPanel={toggleFamilyPanel}
          onUpdateServiceWorker={() => {
            void updateServiceWorker(true)
          }}
          showFamilyPanel={showFamilyPanel}
          showInstallEntry={showInstallEntry}
          syncEnabled={hasSupabaseConfig}
          syncMessage={syncMessage}
          syncPhase={syncPhase}
        />
      </div>

      <div className="sticky-shell sticky top-0 z-20 px-2.5 pb-1 pt-0.5 sm:px-4">
        <div className="mx-auto max-w-3xl space-y-1.5">
          <SummaryGrid
            feedCount={summary.feedCount}
            feedTotal={summary.feedTotal}
            poopCount={summary.poopCount}
            probioticCount={summary.probioticCount}
            pendingCount={pendingCount}
            syncEnabled={hasSupabaseConfig}
          />

          <ViewTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <main
        id="main-content"
        className="mx-auto max-w-3xl px-2.5 sm:px-4"
        style={{ paddingBottom: composerHeight + 16 }}
      >
        {activeTab === 'log' ? (
          <RecentEventList
            events={recentEvents}
            isBooting={isBooting}
            lastCreatedId={lastCreatedId}
            onDeleteEvent={deleteEventById}
            onEditEvent={openEventEditor}
          />
        ) : (
          <TrendOverview
            cards={trendCards}
            latestItems={trendOverviewData.latestItems}
            recentItems={trendOverviewData.recentItems}
          />
        )}
      </main>

      <InstallGuideSheet
        mode={installGuideMode}
        onClose={closeInstallGuide}
        show={showInstallGuide && !isInstalled}
      />

      <FamilyPanelSheet
        currentHouseholdInviteCode={store.householdInviteCode}
        currentHouseholdName={store.householdName}
        familyMessage={familyMessage}
        familyMessageTone={familyMessageTone}
        hasJoinedHousehold={hasJoinedHousehold}
        householdNameDraft={householdNameDraft}
        inviteCodeDraft={inviteCodeDraft}
        mode={familyPanelMode}
        onClose={closeFamilyPanel}
        onCopyInviteCode={() => {
          void copyInviteCode()
        }}
        onCreateHousehold={() => {
          void createHousehold()
        }}
        onHouseholdNameDraftChange={handleHouseholdNameDraftChange}
        onInviteCodeDraftChange={handleInviteCodeDraftChange}
        onJoinHousehold={() => {
          void joinHousehold()
        }}
        onModeChange={handleFamilyPanelModeChange}
        onShareInviteLink={() => {
          void shareInviteLink()
        }}
        show={showFamilyPanel}
        syncEnabled={hasSupabaseConfig}
      />

      {undoAction && (
        <UndoToast
          bottomOffset={composerHeight + 12}
          label={undoAction.label}
          onUndo={undoLastAction}
        />
      )}

      <QuickActionBar
        ref={composerRef}
        activeKind={composerKind}
        doseAmount={doseAmount}
        milkAmountInput={milkAmountInput}
        onActiveKindChange={setComposerKind}
        onAddEvent={addEvent}
        onDoseAmountChange={setDoseAmount}
        onMilkAmountInputChange={setMilkAmountInput}
      />

      <EventEditorSheet
        draftAmount={draftAmount}
        draftNote={draftNote}
        event={editingEvent}
        onAmountChange={setDraftAmount}
        onClose={closeEditor}
        onDelete={() => {
          if (editingEvent) {
            deleteEvent(editingEvent)
          }
        }}
        onNoteChange={setDraftNote}
        onSave={saveEditedEvent}
      />
    </div>
  )
}

export default App
