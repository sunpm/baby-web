import { CheckCircle, Trash } from '@phosphor-icons/react'
import { memo, useMemo, useRef, useState } from 'react'
import {
  formatEventAmount,
  kindClassName,
  kindName,
  relativeMinutes,
  shortTime,
} from '../lib/ui'
import type { BabyEvent } from '../lib/types'

const ACTION_WIDTH = 82

interface TimelineEventRowProps {
  event: BabyEvent
  isJustCreated: boolean
  isSwipeOpen: boolean
  onDeleteEvent: (eventId: string) => void
  onEditEvent: (eventId: string) => void
  onSetSwipeOpen: (eventId: string | null) => void
  viewerDeviceId: string
}

function TimelineEventRowImpl({
  event,
  isJustCreated,
  isSwipeOpen,
  onDeleteEvent,
  onEditEvent,
  onSetSwipeOpen,
  viewerDeviceId,
}: TimelineEventRowProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)

  const displayOffset = isDragging ? dragOffset : isSwipeOpen ? -ACTION_WIDTH : 0
  const revealOpacity = Math.max(Math.abs(displayOffset) / ACTION_WIDTH, isSwipeOpen ? 1 : 0)
  const amountLabel = useMemo(() => formatEventAmount(event), [event])
  const timeLabel = useMemo(() => shortTime(event.eventAt), [event.eventAt])
  const relativeTimeLabel = useMemo(() => relativeMinutes(event.eventAt), [event.eventAt])
  const sourceLabel = event.createdByDeviceId === viewerDeviceId ? '本机' : '协同'
  const sourceLabelClass =
    sourceLabel === '本机'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200'
      : 'border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-200'

  const handlePointerDown = (clientX: number) => {
    draggingRef.current = true
    movedRef.current = false
    setIsDragging(true)
    startXRef.current = clientX
    startOffsetRef.current = isSwipeOpen ? -ACTION_WIDTH : 0
    setDragOffset(startOffsetRef.current)
  }

  const handlePointerMove = (clientX: number) => {
    if (!draggingRef.current) {
      return
    }

    const delta = clientX - startXRef.current
    if (Math.abs(delta) > 6) {
      movedRef.current = true
    }

    const nextOffset = Math.min(0, Math.max(-ACTION_WIDTH, startOffsetRef.current + delta))
    setDragOffset(nextOffset)
  }

  const handlePointerEnd = () => {
    if (!draggingRef.current) {
      return
    }

    draggingRef.current = false
    setIsDragging(false)
    const shouldOpen = dragOffset <= -ACTION_WIDTH / 2
    onSetSwipeOpen(shouldOpen ? event.id : null)
  }

  const handleRowClick = () => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }

    if (isSwipeOpen) {
      onSetSwipeOpen(null)
      return
    }

    onEditEvent(event.id)
  }

  return (
    <li className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-y-0 right-0 flex w-[82px] items-center justify-center rounded-lg"
        style={{ opacity: revealOpacity, pointerEvents: revealOpacity > 0.2 ? 'auto' : 'none' }}
      >
        <div className="danger-lane absolute inset-y-1 left-0 right-0 rounded-2xl" />
        <button
          type="button"
          onClick={() => onDeleteEvent(event.id)}
          className="action-tap relative inline-flex h-[calc(100%-12px)] w-[68px] items-center justify-center gap-1.5 rounded-xl bg-[var(--danger-solid)] text-[0.8rem] font-semibold text-white shadow-[0_4px_14px_rgba(239,68,68,0.3)]"
        >
          <Trash size={16} weight="fill" />
          删除
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(eventKey) => {
          if (eventKey.key === 'Enter' || eventKey.key === ' ') {
            eventKey.preventDefault()
            handleRowClick()
          }
        }}
        onPointerDown={(eventPointer) => {
          handlePointerDown(eventPointer.clientX)
        }}
        onPointerMove={(eventPointer) => {
          handlePointerMove(eventPointer.clientX)
        }}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        className="row-surface action-tap touch-pan-y rounded-2xl px-3.5 py-3.5 sm:px-4 sm:py-4"
        style={{ transform: `translate3d(${displayOffset}px, 0, 0)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.05em] ${kindClassName(event.kind)}`}
              >
                {kindName(event.kind)}
              </span>
              <p className="truncate text-[0.88rem] font-medium text-slate-700 dark:text-slate-300">
                {amountLabel}
                {event.note ? (
                  <span className="font-normal text-slate-500"> · {event.note}</span>
                ) : (
                  ''
                )}
              </p>
            </div>
            {isJustCreated && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={13} weight="fill" />
                刚刚记录完成
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[0.8rem] font-medium tabular-nums text-slate-500">
                {timeLabel}
              </span>
              <span className="rounded-md ring-1 ring-[var(--surface-border)] bg-black/[0.02] dark:bg-white/[0.04] px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-muted">
                编辑
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <p className="text-[0.7rem] text-muted">{relativeTimeLabel}</p>
              <span
                className={`inline-flex items-center rounded-md border px-1.5 py-[1px] text-[0.62rem] font-medium tracking-[0.03em] ${sourceLabelClass}`}
              >
                {sourceLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export const TimelineEventRow = memo(
  TimelineEventRowImpl,
  (prevProps, nextProps) =>
    prevProps.event === nextProps.event &&
    prevProps.isJustCreated === nextProps.isJustCreated &&
    prevProps.isSwipeOpen === nextProps.isSwipeOpen &&
    prevProps.onDeleteEvent === nextProps.onDeleteEvent &&
    prevProps.onEditEvent === nextProps.onEditEvent &&
    prevProps.onSetSwipeOpen === nextProps.onSetSwipeOpen &&
    prevProps.viewerDeviceId === nextProps.viewerDeviceId,
)
