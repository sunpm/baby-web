import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createHouseholdMembership,
  hasSupabaseConfig,
  joinHouseholdMembership,
} from '../lib/supabase'
import { isLocalHouseholdId } from '../lib/storage'
import {
  buildInviteShareUrl,
  getErrorMessage,
  normalizeHouseholdName,
  normalizeInviteCode,
  readInviteCodeFromUrl,
} from '../lib/ui'
import type { AppStore, HouseholdMembership } from '../lib/types'
import type { SyncReason } from './useStoreSync'
import type { FamilyPanelMode } from '../components/FamilyPanelSheet'

export type FamilyMessageTone = 'neutral' | 'success' | 'error'

interface UseFamilySharingOptions {
  onPanelToggle?: () => void
  onSyncLifecycleReset?: () => void
  store: AppStore
  syncNow: (
    reason: SyncReason,
    householdOverride?: HouseholdMembership,
    replaceLocalHouseholdData?: boolean,
  ) => Promise<void>
}

export function useFamilySharing({
  onPanelToggle,
  onSyncLifecycleReset,
  store,
  syncNow,
}: UseFamilySharingOptions) {
  const initialInviteCode = useMemo(() => readInviteCodeFromUrl(), [])

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

  const storeRef = useRef(store)

  useEffect(() => {
    storeRef.current = store
  }, [store])

  const notifyFamily = useCallback((message: string, tone: FamilyMessageTone = 'neutral') => {
    setFamilyMessage(message)
    setFamilyMessageTone(tone)
  }, [])

  const handleHouseholdNameDraftChange = useCallback((value: string) => {
    setHouseholdNameDraft(value)
    setFamilyMessage('')
  }, [])

  const handleInviteCodeDraftChange = useCallback((value: string) => {
    setInviteCodeDraft(normalizeInviteCode(value))
    setFamilyMessage('')
  }, [])

  const handleFamilyPanelModeChange = useCallback((mode: FamilyPanelMode) => {
    setFamilyPanelMode(mode)
    setFamilyMessage('')
  }, [])

  const createHousehold = useCallback(async () => {
    if (!hasSupabaseConfig) {
      notifyFamily('还没有配置 Supabase URL 和 Anon Key。', 'error')
      return
    }

    notifyFamily('')

    try {
      const membership = await createHouseholdMembership(
        normalizeHouseholdName(householdNameDraft || store.householdName),
      )
      setHouseholdNameDraft(membership.householdName)
      setInviteCodeDraft(membership.householdInviteCode)
      setShowFamilyPanel(false)
      setFamilyPanelMode('create')
      onSyncLifecycleReset?.()
      notifyFamily('已创建家庭，现在可以把链接发给家人一起记录。', 'success')
      void syncNow(
        'manual',
        membership,
        !isLocalHouseholdId(storeRef.current.householdId) &&
          storeRef.current.householdId !== membership.householdId,
      )
    } catch (error) {
      notifyFamily(getErrorMessage(error), 'error')
    }
  }, [householdNameDraft, notifyFamily, onSyncLifecycleReset, store.householdName, syncNow])

  const joinHousehold = useCallback(async () => {
    if (!hasSupabaseConfig) {
      notifyFamily('还没有配置 Supabase URL 和 Anon Key。', 'error')
      return
    }

    const normalizedInviteCode = normalizeInviteCode(inviteCodeDraft)
    if (!normalizedInviteCode) {
      notifyFamily('请先输入邀请码。', 'error')
      return
    }

    notifyFamily('')

    try {
      const membership = await joinHouseholdMembership(normalizedInviteCode)
      setHouseholdNameDraft(membership.householdName)
      setInviteCodeDraft(membership.householdInviteCode)
      setShowFamilyPanel(false)
      setFamilyPanelMode('join')
      onSyncLifecycleReset?.()
      notifyFamily('已加入家庭，之后的记录会同步到同一个空间。', 'success')
      void syncNow(
        'manual',
        membership,
        !isLocalHouseholdId(storeRef.current.householdId) &&
          storeRef.current.householdId !== membership.householdId,
      )
    } catch (error) {
      notifyFamily(getErrorMessage(error), 'error')
    }
  }, [inviteCodeDraft, notifyFamily, onSyncLifecycleReset, syncNow])

  const copyInviteCode = useCallback(async () => {
    if (!store.householdInviteCode) {
      notifyFamily('当前家庭还没有可复制的邀请码。', 'error')
      return
    }

    if (typeof navigator.clipboard?.writeText !== 'function') {
      notifyFamily('当前浏览器不支持复制，请手动抄一下邀请码。', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(store.householdInviteCode)
      notifyFamily('邀请码已复制。', 'success')
    } catch {
      notifyFamily('复制失败，请手动抄一下邀请码。', 'error')
    }
  }, [notifyFamily, store.householdInviteCode])

  const shareInviteLink = useCallback(async () => {
    if (!store.householdInviteCode) {
      notifyFamily('当前家庭还没有可分享的邀请码。', 'error')
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
        notifyFamily('已打开系统分享。', 'success')
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
      notifyFamily('当前浏览器不支持系统分享，也无法复制链接。', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      notifyFamily('分享链接已复制，发给家人即可。', 'success')
    } catch {
      notifyFamily('复制分享链接失败，请稍后再试。', 'error')
    }
  }, [notifyFamily, store.householdInviteCode, store.householdName])

  const toggleFamilyPanel = useCallback(() => {
    onPanelToggle?.()
    setFamilyPanelMode(inviteCodeDraft ? 'join' : 'create')
    setShowFamilyPanel((previous) => !previous)
  }, [inviteCodeDraft, onPanelToggle])

  const closeFamilyPanel = useCallback(() => {
    setShowFamilyPanel(false)
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

  return {
    closeFamilyPanel,
    copyInviteCode,
    createHousehold,
    familyMessage,
    familyMessageTone,
    familyPanelMode,
    handleFamilyPanelModeChange,
    handleHouseholdNameDraftChange,
    handleInviteCodeDraftChange,
    householdNameDraft,
    inviteCodeDraft,
    joinHousehold,
    notifyFamily,
    shareInviteLink,
    showFamilyPanel,
    toggleFamilyPanel,
  }
}
