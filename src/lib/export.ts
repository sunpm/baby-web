import type { AppStore, BabyEvent } from './types'

const CSV_HEADER = [
  'event_at',
  'kind',
  'amount',
  'unit',
  'note',
  'created_by_device_id',
  'household_id',
] as const

function escapeCsvField(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}

function toCsvRow(event: BabyEvent) {
  const fields = [
    event.eventAt,
    event.kind,
    typeof event.amount === 'number' ? String(event.amount) : '',
    event.unit ?? '',
    event.note ?? '',
    event.createdByDeviceId,
    event.householdId,
  ]

  return fields.map((field) => escapeCsvField(field)).join(',')
}

export function buildEventExportCsv(events: BabyEvent[]) {
  const rows = [CSV_HEADER.join(','), ...events.map((event) => toCsvRow(event))]
  return rows.join('\n')
}

export function buildEventExportJson(store: AppStore) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      store,
    },
    null,
    2,
  )
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Download is only available in browser')
  }

  const blob = new Blob([content], { type: mimeType })
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 0)
}
