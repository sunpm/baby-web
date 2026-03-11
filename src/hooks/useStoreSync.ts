import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  applyMutations,
  isLocalHouseholdId,
  mergeEvents,
  remapEventHousehold,
  remapMutationHousehold,
} from '../lib/storage'
import {
  ensureSupabaseSession,
  fetchCurrentHouseholdMembership,
  fetchHouseholdEvents,
  hasSupabaseConfig,
  pushPendingMutations,
  subscribeHouseholdEvents,
} from '../lib/supabase'
import { getErrorMessage } from '../lib/ui'
import type { AppStore, HouseholdMembership, SyncPhase } from '../lib/types'

export type SyncReason = 'init' | 'record' | 'manual' | 'realtime'

interface SyncRequest {
  householdOverride?: HouseholdMembership
  reason: SyncReason
  replaceLocalHouseholdData: boolean
}

interface UseStoreSyncOptions {
  setStore: Dispatch<SetStateAction<AppStore>>
  store: AppStore
}

export function useStoreSync({ setStore, store }: UseStoreSyncOptions) {
  const [syncPhase, setSyncPhase] = useState<SyncPhase>(
    hasSupabaseConfig ? 'syncing' : 'local-only',
  )
  const [syncMessage, setSyncMessage] = useState('')
  const [isBooting, setIsBooting] = useState(true)

  const storeRef = useRef(store)
  const queueRef = useRef<{ inFlight: boolean; pending: SyncRequest | null }>({
    inFlight: false,
    pending: null,
  })

  useEffect(() => {
    storeRef.current = store
  }, [store])

  const resolveHouseholdMembership = useCallback(async (override?: HouseholdMembership) => {
    if (override) {
      return override
    }

    const persistedMembership = isLocalHouseholdId(storeRef.current.householdId)
      ? null
      : {
          householdId: storeRef.current.householdId,
          householdInviteCode: storeRef.current.householdInviteCode ?? '',
          householdName: storeRef.current.householdName,
        }

    if (!persistedMembership || !storeRef.current.householdInviteCode) {
      const remoteMembership = await fetchCurrentHouseholdMembership()
      if (remoteMembership) {
        return remoteMembership
      }
    }

    return persistedMembership
  }, [])

  const performSync = useCallback(
    async ({ householdOverride, reason, replaceLocalHouseholdData }: SyncRequest) => {
      if (!hasSupabaseConfig) {
        setSyncPhase('local-only')
        setIsBooting(false)
        return
      }

      if (!navigator.onLine) {
        setSyncPhase('offline')
        setIsBooting(false)
        return
      }

      const activeHousehold = await resolveHouseholdMembership(householdOverride)
      if (!activeHousehold) {
        setSyncPhase('setup')
        setSyncMessage('还没有加入家庭，请先创建家庭或输入邀请码。')
        if (reason === 'init') {
          setIsBooting(false)
        }
        return
      }

      const shouldCarryCurrentData =
        !replaceLocalHouseholdData &&
        (storeRef.current.householdId === activeHousehold.householdId ||
          isLocalHouseholdId(storeRef.current.householdId))
      const pendingSnapshot = shouldCarryCurrentData
        ? storeRef.current.pendingMutations.map((mutation) =>
            storeRef.current.householdId === activeHousehold.householdId
              ? mutation
              : remapMutationHousehold(mutation, activeHousehold.householdId),
          )
        : []
      const pendingIds = new Set(pendingSnapshot.map((mutation) => mutation.id))

      setSyncPhase('syncing')
      setSyncMessage('')

      try {
        await pushPendingMutations(pendingSnapshot)
        const remoteEvents = await fetchHouseholdEvents(activeHousehold.householdId)

        setStore((previous) => {
          const canMergePreviousData =
            !replaceLocalHouseholdData &&
            (previous.householdId === activeHousehold.householdId ||
              isLocalHouseholdId(previous.householdId))
          const baseEvents = canMergePreviousData
            ? previous.events.map((event) =>
                previous.householdId === activeHousehold.householdId
                  ? event
                  : remapEventHousehold(event, activeHousehold.householdId),
              )
            : []
          const basePendingMutations = canMergePreviousData
            ? previous.pendingMutations.map((mutation) =>
                previous.householdId === activeHousehold.householdId
                  ? mutation
                  : remapMutationHousehold(mutation, activeHousehold.householdId),
              )
            : []
          const remainingPendingMutations = basePendingMutations.filter(
            (mutation) => !pendingIds.has(mutation.id),
          )
          const mergedEvents = mergeEvents(baseEvents, remoteEvents)

          return {
            ...previous,
            householdId: activeHousehold.householdId,
            householdInviteCode: activeHousehold.householdInviteCode,
            householdName: activeHousehold.householdName,
            events: applyMutations(mergedEvents, remainingPendingMutations),
            pendingMutations: remainingPendingMutations,
            lastSyncedAt: new Date().toISOString(),
          }
        })
        setSyncPhase('ready')
      } catch (error) {
        setSyncPhase('error')
        setSyncMessage(getErrorMessage(error))
      } finally {
        if (reason === 'init') {
          setIsBooting(false)
        }
      }
    },
    [resolveHouseholdMembership, setStore],
  )

  const syncNow = useCallback(
    async (
      reason: SyncReason,
      householdOverride?: HouseholdMembership,
      replaceLocalHouseholdData = false,
    ) => {
      const nextRequest: SyncRequest = {
        householdOverride,
        reason,
        replaceLocalHouseholdData,
      }

      if (queueRef.current.inFlight) {
        queueRef.current.pending = nextRequest
        return
      }

      queueRef.current.inFlight = true

      try {
        let currentRequest: SyncRequest | null = nextRequest

        while (currentRequest) {
          queueRef.current.pending = null
          await performSync(currentRequest)
          currentRequest = queueRef.current.pending
        }
      } finally {
        queueRef.current.inFlight = false
      }
    },
    [performSync],
  )

  useEffect(() => {
    void syncNow('init')
  }, [syncNow])

  useEffect(() => {
    if (isBooting || store.pendingMutations.length === 0) {
      return
    }

    void syncNow('record')
  }, [isBooting, store.pendingMutations.length, syncNow])

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return
    }

    const timer = window.setInterval(() => {
      void syncNow('manual')
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [syncNow])

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return
    }

    const onOnline = () => {
      void syncNow('manual')
    }

    const onOffline = () => {
      setSyncPhase('offline')
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [syncNow])

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return
    }

    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncNow('manual')
      }
    }

    const syncWhenFocused = () => {
      if (document.visibilityState !== 'hidden') {
        void syncNow('manual')
      }
    }

    document.addEventListener('visibilitychange', syncWhenVisible)
    window.addEventListener('focus', syncWhenFocused)

    return () => {
      document.removeEventListener('visibilitychange', syncWhenVisible)
      window.removeEventListener('focus', syncWhenFocused)
    }
  }, [syncNow])

  useEffect(() => {
    if (!hasSupabaseConfig || isLocalHouseholdId(store.householdId)) {
      return
    }

    let unsubscribe: (() => void) | null = null
    let cancelled = false

    void ensureSupabaseSession()
      .then(() => {
        if (cancelled) {
          return
        }

        unsubscribe = subscribeHouseholdEvents(store.householdId, () => {
          void syncNow('realtime')
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setSyncPhase('error')
        setSyncMessage(getErrorMessage(error))
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [store.householdId, syncNow])

  return {
    isBooting,
    syncMessage,
    syncNow,
    syncPhase,
  }
}
