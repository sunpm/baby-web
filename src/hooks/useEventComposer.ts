import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { eventDefaultAmount } from '../lib/insights'
import {
  applyMutations,
  createDeleteMutation,
  createEvent,
  createUpsertMutation,
} from '../lib/storage'
import { kindName, parsePositiveInt, SUPPLEMENT_PRESETS, type SupplementPreset } from '../lib/ui'
import type { AppStore, BabyEvent, EventKind, EventMutation } from '../lib/types'

export type UndoAction =
  | { label: string; type: 'create'; event: BabyEvent }
  | { label: string; type: 'update'; event: BabyEvent; previousEvent: BabyEvent }
  | { label: string; type: 'delete'; event: BabyEvent }

interface UseEventComposerOptions {
  setStore: Dispatch<SetStateAction<AppStore>>
  store: AppStore
}

export function useEventComposer({ setStore, store }: UseEventComposerOptions) {
  const [milkAmountInput, setMilkAmountInput] = useState('90')
  const [supplementPreset, setSupplementPreset] = useState<SupplementPreset>(
    SUPPLEMENT_PRESETS[0],
  )
  const [composerKind, setComposerKind] = useState<EventKind>('feeding')
  const [lastCreatedId, setLastCreatedId] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [draftNote, setDraftNote] = useState('')
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)

  const storeRef = useRef(store)

  useEffect(() => {
    storeRef.current = store
  }, [store])

  const editingEvent = useMemo(() => {
    if (!editingEventId) {
      return null
    }

    return store.events.find((event) => event.id === editingEventId) ?? null
  }, [editingEventId, store.events])

  const commitMutation = useCallback((mutation: EventMutation) => {
    setStore((previous) => ({
      ...previous,
      events: applyMutations(previous.events, [mutation]),
      pendingMutations: [...previous.pendingMutations, mutation],
    }))
  }, [setStore])

  const addEvent = useCallback((kind: EventKind) => {
    const payload =
      kind === 'feeding'
        ? { amount: parsePositiveInt(milkAmountInput, 90), unit: 'ml' as const }
        : kind === 'probiotic'
          ? { note: supplementPreset }
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
  }, [commitMutation, milkAmountInput, supplementPreset])

  const openEventEditor = useCallback((eventId: string) => {
    const event = storeRef.current.events.find((current) => current.id === eventId)
    if (!event) {
      return
    }

    if (event.kind === 'probiotic') {
      const matchedPreset = SUPPLEMENT_PRESETS.find((preset) => preset === event.note)
      if (matchedPreset) {
        setSupplementPreset(matchedPreset)
      }
    }

    setDraftAmount(event.kind === 'feeding' ? String(eventDefaultAmount(event)) : '')
    setDraftNote(event.note ?? '')
    setEditingEventId(eventId)
  }, [])

  const closeEditor = useCallback(() => {
    setEditingEventId('')
  }, [])

  const clearComposerHighlights = useCallback(() => {
    setLastCreatedId('')
    setUndoAction(null)
  }, [])

  const resetTransientState = useCallback(() => {
    setLastCreatedId('')
    setEditingEventId('')
    setUndoAction(null)
  }, [])

  const deleteEvent = useCallback((event: BabyEvent) => {
    commitMutation(
      createDeleteMutation({
        eventId: event.id,
        householdId: event.householdId,
      }),
    )
    setUndoAction({ label: `${kindName(event.kind)} 已删除`, type: 'delete', event })
    setLastCreatedId('')
    setEditingEventId('')
  }, [commitMutation])

  const deleteEventById = useCallback((eventId: string) => {
    const event = storeRef.current.events.find((current) => current.id === eventId)
    if (event) {
      deleteEvent(event)
    }
  }, [deleteEvent])

  const saveEditedEvent = useCallback(() => {
    if (!editingEvent) {
      return
    }

    const trimmedNote = draftNote.trim()
    const updatedEvent: BabyEvent = {
      ...editingEvent,
      amount:
        editingEvent.kind === 'feeding'
          ? parsePositiveInt(draftAmount, eventDefaultAmount(editingEvent))
          : undefined,
      unit: editingEvent.kind === 'feeding' ? 'ml' : undefined,
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
      clearComposerHighlights()
      return
    }

    if (undoAction.type === 'update') {
      commitMutation(createUpsertMutation(undoAction.previousEvent))
      clearComposerHighlights()
      return
    }

    commitMutation(createUpsertMutation(undoAction.event))
    setLastCreatedId(undoAction.event.id)
    setUndoAction(null)
  }, [clearComposerHighlights, commitMutation, undoAction])

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
    if (!undoAction) {
      return
    }

    const timeoutMs = undoAction.type === 'delete' ? 6000 : 2200
    const timer = window.setTimeout(() => {
      setUndoAction(null)
    }, timeoutMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [undoAction])

  return {
    addEvent,
    closeEditor,
    composerKind,
    deleteEvent,
    deleteEventById,
    draftAmount,
    draftNote,
    editingEvent,
    lastCreatedId,
    milkAmountInput,
    openEventEditor,
    resetTransientState,
    saveEditedEvent,
    setComposerKind,
    setDraftAmount,
    setDraftNote,
    setMilkAmountInput,
    setSupplementPreset,
    supplementPreset,
    undoAction,
    undoLastAction,
  }
}
