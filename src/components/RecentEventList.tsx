import { Baby, ListHeart } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { dateGroupKey, dateGroupLabel } from '../lib/ui'
import type { BabyEvent } from '../lib/types'
import { TimelineEventRow } from './TimelineEventRow'

interface RecentEventListProps {
  events: BabyEvent[]
  isBooting: boolean
  lastCreatedId: string
  onDeleteEvent: (eventId: string) => void
  onEditEvent: (eventId: string) => void
}

interface EventGroup {
  dateKey: string
  label: string
  events: BabyEvent[]
}

export function RecentEventList({
  events,
  isBooting,
  lastCreatedId,
  onDeleteEvent,
  onEditEvent,
}: RecentEventListProps) {
  const [swipeOpenEventId, setSwipeOpenEventId] = useState<string | null>(null)

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
      <div className="mb-3 px-1">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted">
          <ListHeart size={14} weight="fill" />
          最近记录
        </div>
        <p className="mt-1 text-[0.8rem] text-secondary">点开编辑，向左滑就能删除。</p>
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
            <section key={group.dateKey} className="pb-1">
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
                    onDeleteEvent={(eventId) => {
                      setSwipeOpenEventId(null)
                      onDeleteEvent(eventId)
                    }}
                    onEditEvent={(eventId) => {
                      setSwipeOpenEventId(null)
                      onEditEvent(eventId)
                    }}
                    onSetSwipeOpen={setSwipeOpenEventId}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
