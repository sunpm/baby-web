import { ChartLineUp, ListBullets } from '@phosphor-icons/react'

interface ViewTabsProps {
  activeTab: 'log' | 'trends'
  onChange: (tab: 'log' | 'trends') => void
}

const tabs = [
  { id: 'log' as const, label: '记录', Icon: ListBullets },
  { id: 'trends' as const, label: '趋势', Icon: ChartLineUp },
]

export function ViewTabs({ activeTab, onChange }: ViewTabsProps) {
  return (
    <nav className="surface rounded-[1.25rem] p-[0.3125rem]" aria-label="页面视图">
      <div
        role="tablist"
        aria-label="记录与趋势切换"
        className="grid grid-cols-2 gap-1 rounded-[1rem] bg-black/[0.03] p-[0.125rem] dark:bg-white/[0.03]"
      >
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id

          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              onClick={() => onChange(id)}
              className={`action-tap relative flex h-[2.2rem] items-center justify-center gap-1.5 overflow-hidden rounded-[0.9rem] px-2.5 text-[0.82rem] font-semibold transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-secondary hover:bg-white/25 dark:hover:bg-white/4'}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-[0.9rem] border transition-colors ${isActive ? 'border-slate-200 bg-white/96 ring-1 ring-black/4 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-white/6' : 'border-transparent bg-transparent ring-0'}`}
              />
              <span className="relative z-[1] inline-flex items-center gap-1.5">
                <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                <span>{label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
