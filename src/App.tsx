import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { QuickActionBar } from './components/QuickActionBar'
import { RecentEventList } from './components/RecentEventList'
import { StatusHeader } from './components/StatusHeader'
import { SummaryGrid } from './components/SummaryGrid'
import { UndoToast } from './components/UndoToast'
import { ViewTabs } from './components/ViewTabs'
import { useEventComposer } from './hooks/useEventComposer'
import { useFamilySharing } from './hooks/useFamilySharing'
import { usePwaInstall } from './hooks/usePwaInstall'
import { useStoreSync } from './hooks/useStoreSync'
import { buildSummary, buildTrendCards, buildTrendOverviewData } from './lib/insights'
import { hasSupabaseConfig } from './lib/supabase'
import { countPendingRecords, isLocalHouseholdId, loadStore, persistStore } from './lib/storage'
import { normalizeHouseholdName } from './lib/ui'
import type { AppStore } from './lib/types'

const DEFAULT_HOUSEHOLD_NAME = normalizeHouseholdName(
  import.meta.env.VITE_BABY_HOUSEHOLD_NAME ?? '我家宝宝',
)
const RECENT_EVENT_LIMIT = 30
const STORE_PERSIST_DEBOUNCE_MS = 260
const TrendOverview = lazy(async () => ({
  default: (await import('./components/TrendOverview')).TrendOverview,
}))
const InstallGuideSheet = lazy(async () => ({
  default: (await import('./components/InstallGuideSheet')).InstallGuideSheet,
}))
const FamilyPanelSheet = lazy(async () => ({
  default: (await import('./components/FamilyPanelSheet')).FamilyPanelSheet,
}))
const EventEditorSheet = lazy(async () => ({
  default: (await import('./components/EventEditorSheet')).EventEditorSheet,
}))

function App() {
  const [store, setStore] = useState<AppStore>(() => loadStore(DEFAULT_HOUSEHOLD_NAME))
  const [activeTab, setActiveTab] = useState<'log' | 'trends'>('log')
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [composerHeight, setComposerHeight] = useState(0)

  const composerRef = useRef<HTMLElement | null>(null)
  const storeRef = useRef(store)
  const persistTimerRef = useRef<number | null>(null)

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    immediate: true,
  })
  const { isBooting, syncMessage, syncNow, syncPhase } = useStoreSync({
    setStore,
    store,
  })

  const composer = useEventComposer({ setStore, store })
  const familySharing = useFamilySharing({
    onPanelToggle: () => {
      composer.closeEditor()
      setShowInstallGuide(false)
    },
    onSyncLifecycleReset: composer.resetTransientState,
    store,
    syncNow,
  })
  const {
    entryTone: installEntryTone,
    guideMode: installGuideMode,
    isInstalled,
    requestInstall,
    showInstallEntry,
  } = usePwaInstall()

  const hasJoinedHousehold = useMemo(
    () => !isLocalHouseholdId(store.householdId),
    [store.householdId],
  )
  const isTrendTab = activeTab === 'trends'
  const summary = useMemo(() => buildSummary(store.events), [store.events])
  const trendCards = useMemo(
    () => (isTrendTab ? buildTrendCards(store.events) : []),
    [isTrendTab, store.events],
  )
  const trendOverviewData = useMemo(
    () =>
      isTrendTab
        ? buildTrendOverviewData(store.events)
        : {
            latestItems: [],
            recentItems: [],
          },
    [isTrendTab, store.events],
  )
  const recentEvents = useMemo(
    () => (isTrendTab ? [] : store.events.slice(0, RECENT_EVENT_LIMIT)),
    [isTrendTab, store.events],
  )
  const pendingCount = useMemo(
    () => countPendingRecords(store.pendingMutations),
    [store.pendingMutations],
  )

  const handleManualSync = useCallback(() => {
    void syncNow('manual')
  }, [syncNow])

  const handleInstallClick = useCallback(async () => {
    familySharing.closeFamilyPanel()
    composer.closeEditor()

    const result = await requestInstall()

    if (result === 'guide' && installGuideMode) {
      setShowInstallGuide(true)
      return
    }

    if (result === 'unavailable') {
      familySharing.notifyFamily(
        '当前浏览器暂时没有可用安装入口，建议用 HTTPS 下的 Chrome 或 Edge 打开。',
        'error',
      )
    }
  }, [composer, familySharing, installGuideMode, requestInstall])

  const closeInstallGuide = useCallback(() => {
    setShowInstallGuide(false)
  }, [])

  useEffect(() => {
    storeRef.current = store
  }, [store])

  useEffect(() => {
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
    }

    persistTimerRef.current = window.setTimeout(() => {
      persistStore(storeRef.current)
      persistTimerRef.current = null
    }, STORE_PERSIST_DEBOUNCE_MS)

    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
      }
    }
  }, [store])

  useEffect(() => {
    const flushPersist = () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }

      persistStore(storeRef.current)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPersist()
      }
    }

    window.addEventListener('pagehide', flushPersist)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushPersist)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushPersist()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let frameOneId = 0
    let frameTwoId = 0

    frameOneId = window.requestAnimationFrame(() => {
      frameTwoId = window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('app-mounted'))
      })
    })

    return () => {
      if (frameOneId) {
        window.cancelAnimationFrame(frameOneId)
      }
      if (frameTwoId) {
        window.cancelAnimationFrame(frameTwoId)
      }
    }
  }, [])

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
          familyMessage={familySharing.familyMessage}
          familyMessageTone={familySharing.familyMessageTone}
          hasJoinedHousehold={hasJoinedHousehold}
          installButtonTone={installEntryTone}
          lastSyncedAt={store.lastSyncedAt}
          needRefresh={needRefresh[0]}
          offlineReady={offlineReady[0]}
          onInstallClick={() => {
            void handleInstallClick()
          }}
          onShareInviteLink={() => {
            void familySharing.shareInviteLink()
          }}
          onSyncNow={handleManualSync}
          onToggleFamilyPanel={familySharing.toggleFamilyPanel}
          onUpdateServiceWorker={() => {
            void updateServiceWorker(true)
          }}
          showFamilyPanel={familySharing.showFamilyPanel}
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
            lastCreatedId={composer.lastCreatedId}
            onDeleteEvent={composer.deleteEventById}
            onEditEvent={composer.openEventEditor}
          />
        ) : (
          <Suspense
            fallback={
              <section className="surface px-3 py-3 text-[0.8rem] text-muted">
                加载趋势中…
              </section>
            }
          >
            <TrendOverview
              cards={trendCards}
              latestItems={trendOverviewData.latestItems}
              recentItems={trendOverviewData.recentItems}
            />
          </Suspense>
        )}
      </main>

      {showInstallGuide && !isInstalled && (
        <Suspense fallback={null}>
          <InstallGuideSheet
            mode={installGuideMode}
            onClose={closeInstallGuide}
            show={showInstallGuide}
          />
        </Suspense>
      )}

      {familySharing.showFamilyPanel && (
        <Suspense fallback={null}>
          <FamilyPanelSheet
            currentHouseholdInviteCode={store.householdInviteCode}
            currentHouseholdName={store.householdName}
            familyMessage={familySharing.familyMessage}
            familyMessageTone={familySharing.familyMessageTone}
            hasJoinedHousehold={hasJoinedHousehold}
            householdNameDraft={familySharing.householdNameDraft}
            inviteCodeDraft={familySharing.inviteCodeDraft}
            mode={familySharing.familyPanelMode}
            onClose={familySharing.closeFamilyPanel}
            onCopyInviteCode={() => {
              void familySharing.copyInviteCode()
            }}
            onCreateHousehold={() => {
              void familySharing.createHousehold()
            }}
            onHouseholdNameDraftChange={familySharing.handleHouseholdNameDraftChange}
            onInviteCodeDraftChange={familySharing.handleInviteCodeDraftChange}
            onJoinHousehold={() => {
              void familySharing.joinHousehold()
            }}
            onModeChange={familySharing.handleFamilyPanelModeChange}
            onShareInviteLink={() => {
              void familySharing.shareInviteLink()
            }}
            show={familySharing.showFamilyPanel}
            syncEnabled={hasSupabaseConfig}
          />
        </Suspense>
      )}

      {composer.undoAction && (
        <UndoToast
          bottomOffset={composerHeight + 12}
          label={composer.undoAction.label}
          onUndo={composer.undoLastAction}
          showUndoAction={composer.undoAction.type === 'delete'}
        />
      )}

      <QuickActionBar
        ref={composerRef}
        activeKind={composer.composerKind}
        doseAmount={composer.doseAmount}
        milkAmountInput={composer.milkAmountInput}
        onActiveKindChange={composer.setComposerKind}
        onAddEvent={composer.addEvent}
        onDoseAmountChange={composer.setDoseAmount}
        onMilkAmountInputChange={composer.setMilkAmountInput}
      />

      {composer.editingEvent && (
        <Suspense fallback={null}>
          <EventEditorSheet
            draftAmount={composer.draftAmount}
            draftNote={composer.draftNote}
            event={composer.editingEvent}
            onAmountChange={composer.setDraftAmount}
            onClose={composer.closeEditor}
            onDelete={() => {
              if (composer.editingEvent) {
                composer.deleteEvent(composer.editingEvent)
              }
            }}
            onNoteChange={composer.setDraftNote}
            onSave={composer.saveEditedEvent}
          />
        </Suspense>
      )}
    </div>
  )
}

export default App
