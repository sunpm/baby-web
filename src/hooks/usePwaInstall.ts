import { useCallback, useEffect, useMemo, useState } from 'react'

const STANDALONE_MEDIA_QUERY = '(display-mode: standalone)'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export type InstallGuideMode = 'ios' | 'desktop'
export type InstallEntryTone = 'native' | 'guide'
export type InstallRequestResult =
  | 'prompted'
  | 'dismissed'
  | 'guide'
  | 'installed'
  | 'unavailable'

function getIsInstalled() {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  const inStandaloneDisplay =
    typeof window.matchMedia === 'function' &&
    window.matchMedia(STANDALONE_MEDIA_QUERY).matches

  return inStandaloneDisplay || navigatorWithStandalone.standalone === true
}

function getIsIosDevice() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function getIsSafariBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent
  return /safari/i.test(userAgent) && !/crios|fxios|edgios|opr\//i.test(userAgent)
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(getIsInstalled)

  const isIosDevice = useMemo(() => getIsIosDevice(), [])
  const isSafariBrowser = useMemo(() => getIsSafariBrowser(), [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncInstalledState = () => {
      setIsInstalled(getIsInstalled())
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    syncInstalledState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(STANDALONE_MEDIA_QUERY)
        : null

    if (media) {
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', syncInstalledState)
      } else if (typeof media.addListener === 'function') {
        media.addListener(syncInstalledState)
      }
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)

      if (!media) {
        return
      }

      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', syncInstalledState)
      } else if (typeof media.removeListener === 'function') {
        media.removeListener(syncInstalledState)
      }
    }
  }, [])

  const guideMode = useMemo<InstallGuideMode | null>(() => {
    if (isInstalled || deferredPrompt) {
      return null
    }

    if (isIosDevice && isSafariBrowser) {
      return 'ios'
    }

    return 'desktop'
  }, [deferredPrompt, isInstalled, isIosDevice, isSafariBrowser])

  const entryTone: InstallEntryTone | null = deferredPrompt ? 'native' : guideMode ? 'guide' : null
  const showInstallEntry = !isInstalled && Boolean(entryTone)

  const requestInstall = useCallback(async (): Promise<InstallRequestResult> => {
    if (isInstalled) {
      return 'installed'
    }

    if (!deferredPrompt) {
      return guideMode ? 'guide' : 'unavailable'
    }

    await deferredPrompt.prompt()
    const userChoice = await deferredPrompt.userChoice.catch(() => null)
    setDeferredPrompt(null)

    if (userChoice?.outcome === 'accepted') {
      return 'prompted'
    }

    return 'dismissed'
  }, [deferredPrompt, guideMode, isInstalled])

  return {
    entryTone,
    guideMode,
    isInstalled,
    requestInstall,
    showInstallEntry,
  }
}
