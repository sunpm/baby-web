export type EventKind = 'feeding' | 'poop' | 'probiotic'
export type EventUnit = 'ml' | 'dose'
export type EventMutationType = 'upsert' | 'delete'

export interface BabyEvent {
  id: string
  householdId: string
  kind: EventKind
  eventAt: string
  createdAt: string
  amount?: number
  unit?: EventUnit
  note?: string
  createdByDeviceId: string
}

export interface EventMutation {
  id: string
  eventId: string
  householdId: string
  type: EventMutationType
  createdAt: string
  event?: BabyEvent
}

export interface HouseholdMembership {
  householdId: string
  householdInviteCode: string
  householdName: string
}

export interface AppStore {
  deviceId: string
  householdId: string
  householdInviteCode?: string
  householdName: string
  events: BabyEvent[]
  pendingMutations: EventMutation[]
  lastSyncedAt?: string
}

export type SyncPhase = 'local-only' | 'offline' | 'syncing' | 'ready' | 'error' | 'setup'
