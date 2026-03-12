import type { SupabaseClient } from '@supabase/supabase-js'
import { squashMutations } from './storage'
import type { BabyEvent, EventMutation, HouseholdMembership } from './types'

interface BabyEventRow {
  id: string
  household_id: string
  kind: BabyEvent['kind']
  event_at: string
  created_at: string
  amount: number | null
  unit: BabyEvent['unit'] | null
  note: string | null
  created_by_device_id: string
}

interface HouseholdMembershipRow {
  household_id: string
  display_name: string
  invite_code: string
}

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(url && anonKey)

let supabaseClient: SupabaseClient | null = null
let supabaseClientPromise: Promise<SupabaseClient> | null = null

async function getSupabaseClient() {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase is not configured.')
  }

  if (supabaseClient) {
    return supabaseClient
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      const createdClient = createClient(url as string, anonKey as string, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })

      supabaseClient = createdClient
      return createdClient
    })
  }

  return supabaseClientPromise
}

function getCachedSupabaseClient() {
  return supabaseClient
}

function toRow(event: BabyEvent): BabyEventRow {
  return {
    id: event.id,
    household_id: event.householdId,
    kind: event.kind,
    event_at: event.eventAt,
    created_at: event.createdAt,
    amount: typeof event.amount === 'number' ? event.amount : null,
    unit: event.unit ?? null,
    note: event.note ?? null,
    created_by_device_id: event.createdByDeviceId,
  }
}

function fromRow(row: BabyEventRow): BabyEvent {
  return {
    id: row.id,
    householdId: row.household_id,
    kind: row.kind,
    eventAt: row.event_at,
    createdAt: row.created_at,
    amount: row.amount ?? undefined,
    unit: row.unit ?? undefined,
    note: row.note ?? undefined,
    createdByDeviceId: row.created_by_device_id,
  }
}

function toMembership(row: HouseholdMembershipRow): HouseholdMembership {
  return {
    householdId: row.household_id,
    householdInviteCode: row.invite_code,
    householdName: row.display_name,
  }
}

export async function ensureSupabaseSession() {
  const client = await getSupabaseClient()

  const sessionResult = await client.auth.getSession()
  if (sessionResult.error) {
    throw sessionResult.error
  }

  const currentUser = sessionResult.data.session?.user
  if (currentUser) {
    return currentUser.id
  }

  const anonymousSignIn = await client.auth.signInAnonymously()
  if (anonymousSignIn.error) {
    throw anonymousSignIn.error
  }

  const signedInUser = anonymousSignIn.data.user
  if (!signedInUser) {
    throw new Error('Anonymous sign-in returned no user.')
  }

  return signedInUser.id
}

export async function fetchCurrentHouseholdMembership() {
  if (!hasSupabaseConfig) {
    return null as HouseholdMembership | null
  }

  await ensureSupabaseSession()
  const client = await getSupabaseClient()
  const result = await client.rpc('get_my_household').maybeSingle()

  if (result.error) {
    throw result.error
  }
  if (!result.data) {
    return null
  }

  return toMembership(result.data as HouseholdMembershipRow)
}

export async function createHouseholdMembership(householdName: string) {
  await ensureSupabaseSession()
  const client = await getSupabaseClient()
  const result = await client
    .rpc('create_household_with_profile', { p_display_name: householdName })
    .single()

  if (result.error) {
    throw result.error
  }

  return toMembership(result.data as HouseholdMembershipRow)
}

export async function joinHouseholdMembership(inviteCode: string) {
  await ensureSupabaseSession()
  const client = await getSupabaseClient()
  const result = await client
    .rpc('join_household_with_invite', { p_invite_code: inviteCode })
    .single()

  if (result.error) {
    throw result.error
  }

  return toMembership(result.data as HouseholdMembershipRow)
}

export async function pushPendingMutations(mutations: EventMutation[]) {
  if (!hasSupabaseConfig || mutations.length === 0) {
    return
  }

  await ensureSupabaseSession()
  const client = await getSupabaseClient()
  const { upserts, deletes } = squashMutations(mutations)

  if (upserts.length > 0) {
    const upsertResult = await client
      .from('baby_events')
      .upsert(upserts.map(toRow), { onConflict: 'id' })

    if (upsertResult.error) {
      throw upsertResult.error
    }
  }

  if (deletes.length > 0) {
    const deleteResult = await client.from('baby_events').delete().in('id', deletes)

    if (deleteResult.error) {
      throw deleteResult.error
    }
  }
}

export async function fetchHouseholdEvents(householdId: string, limit = 240) {
  if (!hasSupabaseConfig) {
    return [] as BabyEvent[]
  }

  await ensureSupabaseSession()
  const client = await getSupabaseClient()
  const result = await client
    .from('baby_events')
    .select(
      'id, household_id, kind, event_at, created_at, amount, unit, note, created_by_device_id',
    )
    .eq('household_id', householdId)
    .order('event_at', { ascending: false })
    .limit(limit)

  if (result.error) {
    throw result.error
  }

  return (result.data as BabyEventRow[]).map(fromRow)
}

export function subscribeHouseholdEvents(
  householdId: string,
  onChange: () => void,
): (() => void) | null {
  if (!hasSupabaseConfig) {
    return null
  }

  const client = getCachedSupabaseClient()
  if (!client) {
    return null
  }

  const channel = client
    .channel(`baby-events-${householdId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'baby_events',
        filter: `household_id=eq.${householdId}`,
      },
      () => {
        onChange()
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
