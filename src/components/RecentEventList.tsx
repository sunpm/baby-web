import { Baby, ListHeart } from '@phosphor-icons/react'
import { memo, useCallback, useMemo, useState } from 'react'
import { dateGroupKey, dateGroupLabel } from '../lib/ui'
import type { BabyEvent } from '../lib/types'
import { TimelineEventRow } from './TimelineEventRow'

interface RecentEventListProps {
  events: BabyEvent[]
  isBooting: boolean
  lastCreatedId: string
  onDeleteEvent: (eventId: string) => void
  onEditEvent: (eventId: string) => void
  viewerDeviceId: string
}

interface EventGroup {
  dateKey: string
  label: string
  events: BabyEvent[]
}

interface EventGroupSectionProps {
  group: EventGroup
  lastCreatedId: string
  onDeleteEvent: (eventId: string) => void
  onEditEvent: (eventId: string) => void
  onSetSwipeOpen: (eventId: string | null) => void
  swipeOpenEventId: string | null
  viewerDeviceId: string
}

function isIdInsideGroup(group: EventGroup, eventId: string | null) {
  if (!eventId) {
    return false
  }

  return group.events.some((event) => event.id === eventId)
}

function getGroupSwipeOpenId(group: EventGroup, eventId: string | null) {
  return isIdInsideGroup(group, eventId) ? eventId : null
}

const EventGroupSection = memo(
  function EventGroupSection({
    group,
    lastCreatedId,
    onDeleteEvent,
    onEditEvent,
    onSetSwipeOpen,
    swipeOpenEventId,
    viewerDeviceId,
  }: EventGroupSectionProps) {
    return (
      <section className="pb-1">
        <div className="mb-2.5 mt-3 flex items-center gap-3 px-1">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted">
            {group.label}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--surface-border)] to-transparent" />
        </div>
        <ul className="space-y-2">
          {group.events.map((event) => (
            <TimelineEventRow
              key={event.id}
              event={event}
              isJustCreated={event.id === lastCreatedId}
              isSwipeOpen={swipeOpenEventId === event.id}
              onDeleteEvent={onDeleteEvent}
              onEditEvent={onEditEvent}
              onSetSwipeOpen={onSetSwipeOpen}
              viewerDeviceId={viewerDeviceId}
            />
          ))}
        </ul>
      </section>
    )
  },
  (prevProps, nextProps) => {
    if (
      prevProps.group !== nextProps.group ||
      prevProps.onDeleteEvent !== nextProps.onDeleteEvent ||
      prevProps.onEditEvent !== nextProps.onEditEvent ||
      prevProps.onSetSwipeOpen !== nextProps.onSetSwipeOpen ||
      prevProps.viewerDeviceId !== nextProps.viewerDeviceId
    ) {
      return false
    }

    const swipeOpenStable =
      getGroupSwipeOpenId(prevProps.group, prevProps.swipeOpenEventId) ===
      getGroupSwipeOpenId(nextProps.group, nextProps.swipeOpenEventId)
    const lastCreatedStable =
      getGroupSwipeOpenId(prevProps.group, prevProps.lastCreatedId) ===
      getGroupSwipeOpenId(nextProps.group, nextProps.lastCreatedId)

    return swipeOpenStable && lastCreatedStable
  },
)

export function RecentEventList({
  events,
  isBooting,
  lastCreatedId,
  onDeleteEvent,
  onEditEvent,
  viewerDeviceId,
}: RecentEventListProps) {
  const [swipeOpenEventId, setSwipeOpenEventId] = useState<string | null>(null)
  const activeSwipeOpenEventId = useMemo(
    () => (events.some((event) => event.id === swipeOpenEventId) ? swipeOpenEventId : null),
    [events, swipeOpenEventId],
  )

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      setSwipeOpenEventId(null)
      onDeleteEvent(eventId)
    },
    [onDeleteEvent],
  )

  const handleEditEvent = useCallback(
    (eventId: string) => {
      setSwipeOpenEventId(null)
      onEditEvent(eventId)
    },
    [onEditEvent],
  )

  const groups = useMemo<EventGroup[]>(() => {
    const map = new Map<string, EventGroup>()

    for (const event of events) {
      const key = dateGroupKey(event.eventAt)
      const existing = map.get(key)
      if (existing) {
        existing.events.push(event)
        continue
      }

      map.set(key, {
        dateKey: key,
        label: dateGroupLabel(event.eventAt),
        events: [event],
      })
    }

    return [...map.values()]
  }, [events])

  return (
    <section
      id="panel-log"
      role="tabpanel"
      aria-labelledby="tab-log"
      className="mt-2 pb-0.5"
      aria-label="最近记录"
    >
      <div className="mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted">
          <ListHeart size={14} weight="fill" />
          最近记录
        </div>
      </div>

      {isBooting && (
        <div className="space-y-2">
          <div className="h-[72px] animate-pulse rounded-2xl bg-white/40 ring-1 ring-[var(--surface-border)] dark:bg-white/5" />
          <div className="h-[72px] animate-pulse rounded-2xl bg-white/40 ring-1 ring-[var(--surface-border)] dark:bg-white/5" />
          <div className="h-[72px] animate-pulse rounded-2xl bg-white/40 ring-1 ring-[var(--surface-border)] dark:bg-white/5" />
        </div>
      )}

      {!isBooting && events.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/40 px-5 py-10 text-center ring-1 ring-[var(--surface-border)] dark:bg-black/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm dark:text-emerald-300">
            <Baby size={28} weight="duotone" />
          </div>
          <p className="mt-4 text-[1rem] font-semibold text-primary">还没有记录</p>
          <p className="mt-1.5 max-w-[14rem] text-[0.85rem] text-muted">底部三个按钮任意点一下，就会生成第一条日志。</p>
        </div>
      )}

      {!isBooting && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => (
            <EventGroupSection
              key={group.dateKey}
              group={group}
              lastCreatedId={lastCreatedId}
              onDeleteEvent={handleDeleteEvent}
              onEditEvent={handleEditEvent}
              onSetSwipeOpen={setSwipeOpenEventId}
              swipeOpenEventId={activeSwipeOpenEventId}
              viewerDeviceId={viewerDeviceId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
