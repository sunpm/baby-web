import type { AppStore, BabyEvent, EventKind, EventMutation } from './types'

const STORE_KEY = 'baby-log-store-v1'
const DEVICE_KEY = 'baby-log-device-id'
const LOCAL_HOUSEHOLD_PREFIX = 'local-household-'

function makeDeviceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.round(Math.random() * 10_000)}`
}

function makeEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `event-${Date.now()}-${Math.round(Math.random() * 10_000)}`
}

function makeMutationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `mutation-${Date.now()}-${Math.round(Math.random() * 10_000)}`
}

export function getDeviceId() {
  const cached = localStorage.getItem(DEVICE_KEY)
  if (cached) {
    return cached
  }
  const created = makeDeviceId()
  localStorage.setItem(DEVICE_KEY, created)
  return created
}

export function makeLocalHouseholdId(deviceId: string) {
  return `${LOCAL_HOUSEHOLD_PREFIX}${deviceId}`
}

export function isLocalHouseholdId(value?: string | null) {
  return !value || value.startsWith(LOCAL_HOUSEHOLD_PREFIX)
}

export function createEmptyStore(defaultHouseholdName: string): AppStore {
  const deviceId = getDeviceId()

  return {
    deviceId,
    householdId: makeLocalHouseholdId(deviceId),
    householdName: defaultHouseholdName,
    events: [],
    pendingMutations: [],
  }
}

function isValidKind(value: unknown): value is EventKind {
  return value === 'feeding' || value === 'poop' || value === 'probiotic'
}

function sanitizeEvent(raw: unknown, fallbackHouseholdId: string): BabyEvent | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<BabyEvent> & { familyCode?: string }
  const householdId =
    typeof candidate.householdId === 'string' && candidate.householdId.trim()
      ? candidate.householdId.trim()
      : fallbackHouseholdId

  if (
    typeof candidate.id !== 'string' ||
    !isValidKind(candidate.kind) ||
    typeof candidate.eventAt !== 'string' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.createdByDeviceId !== 'string'
  ) {
    return null
  }

  const amount =
    typeof candidate.amount === 'number' && Number.isFinite(candidate.amount)
      ? candidate.amount
      : undefined
  const unit =
    candidate.unit === 'ml' || candidate.unit === 'dose'
      ? candidate.unit
      : undefined
  const note =
    typeof candidate.note === 'string' && candidate.note.trim().length > 0
      ? candidate.note.trim()
      : undefined

  return {
    id: candidate.id,
    householdId,
    kind: candidate.kind,
    eventAt: candidate.eventAt,
    createdAt: candidate.createdAt,
    amount,
    unit,
    note,
    createdByDeviceId: candidate.createdByDeviceId,
  }
}

function sanitizeMutation(raw: unknown, fallbackHouseholdId: string): EventMutation | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<EventMutation> & { familyCode?: string }
  const householdId =
    typeof candidate.householdId === 'string' && candidate.householdId.trim()
      ? candidate.householdId.trim()
      : fallbackHouseholdId

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.eventId !== 'string' ||
    (candidate.type !== 'upsert' && candidate.type !== 'delete') ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null
  }

  if (candidate.type === 'upsert') {
    const event = sanitizeEvent(candidate.event, householdId)
    if (!event) {
      return null
    }

    return {
      id: candidate.id,
      eventId: candidate.eventId,
      householdId,
      type: candidate.type,
      createdAt: candidate.createdAt,
      event,
    }
  }

  return {
    id: candidate.id,
    eventId: candidate.eventId,
    householdId,
    type: candidate.type,
    createdAt: candidate.createdAt,
  }
}

function toTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function mergeEvents(...groups: BabyEvent[][]) {
  const map = new Map<string, BabyEvent>()
  for (const group of groups) {
    for (const event of group) {
      const existing = map.get(event.id)
      if (!existing) {
        map.set(event.id, event)
        continue
      }
      const preferCurrent = toTimestamp(event.createdAt) >= toTimestamp(existing.createdAt)
      map.set(event.id, preferCurrent ? event : existing)
    }
  }

  return [...map.values()].sort(
    (left, right) => toTimestamp(right.eventAt) - toTimestamp(left.eventAt),
  )
}

export function applyMutations(events: BabyEvent[], mutations: EventMutation[]) {
  const eventMap = new Map(events.map((event) => [event.id, event]))

  for (const mutation of mutations) {
    if (mutation.type === 'upsert' && mutation.event) {
      eventMap.set(mutation.event.id, mutation.event)
      continue
    }

    eventMap.delete(mutation.eventId)
  }

  return mergeEvents([...eventMap.values()])
}

export function squashMutations(mutations: EventMutation[]) {
  const latestByEventId = new Map<string, EventMutation>()

  for (const mutation of mutations) {
    latestByEventId.set(mutation.eventId, mutation)
  }

  const upserts: BabyEvent[] = []
  const deletes: string[] = []

  for (const mutation of latestByEventId.values()) {
    if (mutation.type === 'upsert' && mutation.event) {
      upserts.push(mutation.event)
      continue
    }

    deletes.push(mutation.eventId)
  }

  return { upserts, deletes }
}

export function remapEventHousehold(event: BabyEvent, householdId: string): BabyEvent {
  return {
    ...event,
    householdId,
  }
}

export function remapMutationHousehold(
  mutation: EventMutation,
  householdId: string,
): EventMutation {
  return {
    ...mutation,
    householdId,
    event:
      mutation.type === 'upsert' && mutation.event
        ? remapEventHousehold(mutation.event, householdId)
        : mutation.event,
  }
}

export function createUpsertMutation(event: BabyEvent): EventMutation {
  return {
    id: makeMutationId(),
    eventId: event.id,
    householdId: event.householdId,
    type: 'upsert',
    createdAt: new Date().toISOString(),
    event,
  }
}

export function createDeleteMutation(input: {
  eventId: string
  householdId: string
}): EventMutation {
  return {
    id: makeMutationId(),
    eventId: input.eventId,
    householdId: input.householdId,
    type: 'delete',
    createdAt: new Date().toISOString(),
  }
}

export function countPendingRecords(mutations: EventMutation[]) {
  return new Set(mutations.map((mutation) => mutation.eventId)).size
}

export function loadStore(defaultHouseholdName: string): AppStore {
  const fallback = createEmptyStore(defaultHouseholdName)

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<AppStore> & {
      familyCode?: string
      pending?: unknown[]
      pendingMutations?: unknown[]
    }

    const deviceId =
      typeof parsed.deviceId === 'string' && parsed.deviceId.trim()
        ? parsed.deviceId.trim()
        : fallback.deviceId
    const fallbackHouseholdId = makeLocalHouseholdId(deviceId)
    const legacyHouseholdName =
      typeof parsed.familyCode === 'string' && parsed.familyCode.trim()
        ? parsed.familyCode.trim()
        : ''
    const householdName =
      typeof parsed.householdName === 'string' && parsed.householdName.trim()
        ? parsed.householdName.trim().slice(0, 48)
        : legacyHouseholdName || fallback.householdName
    const householdId =
      typeof parsed.householdId === 'string' && parsed.householdId.trim()
        ? parsed.householdId.trim()
        : fallbackHouseholdId

    const events = Array.isArray(parsed.events)
      ? parsed.events.map((event) => sanitizeEvent(event, householdId)).filter(Boolean)
      : []
    const pendingMutations = Array.isArray(parsed.pendingMutations)
      ? parsed.pendingMutations
          .map((mutation) => sanitizeMutation(mutation, householdId))
          .filter(Boolean)
      : Array.isArray(parsed.pending)
        ? parsed.pending
            .map((event) => sanitizeEvent(event, householdId))
            .filter(Boolean)
            .map((event) => createUpsertMutation(event as BabyEvent))
        : []

    return {
      deviceId,
      householdId,
      householdInviteCode:
        typeof parsed.householdInviteCode === 'string' && parsed.householdInviteCode.trim()
          ? parsed.householdInviteCode.trim()
          : undefined,
      householdName,
      events: mergeEvents(events as BabyEvent[]),
      pendingMutations: pendingMutations as EventMutation[],
      lastSyncedAt:
        typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : undefined,
    }
  } catch {
    return fallback
  }
}

export function persistStore(store: AppStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function createEvent(input: {
  deviceId: string
  householdId: string
  kind: EventKind
  amount?: number
  note?: string
  unit?: 'ml' | 'dose'
}): BabyEvent {
  const now = new Date().toISOString()
  return {
    id: makeEventId(),
    householdId: input.householdId,
    kind: input.kind,
    eventAt: now,
    createdAt: now,
    amount: input.amount,
    note: input.note?.trim() ? input.note.trim() : undefined,
    unit: input.unit,
    createdByDeviceId: input.deviceId,
  }
}
