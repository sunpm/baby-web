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
      <div role="tablist" aria-label="记录与趋势切换" className="grid grid-cols-2 gap-1">
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
              className={`action-tap flex h-[2.15rem] items-center justify-center gap-1.5 rounded-[0.85rem] px-2.5 text-[0.82rem] font-semibold transition-colors ${isActive
                  ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
                  : 'text-secondary hover:bg-white/40 dark:hover:bg-white/5'
                }`}
            >
              <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
