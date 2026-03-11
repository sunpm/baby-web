interface SummaryGridProps {
  feedCount: number
  feedTotal: number
  poopCount: number
  probioticCount: number
  pendingCount: number
  syncEnabled: boolean
}

export function SummaryGrid({
  feedCount,
  feedTotal,
  poopCount,
  probioticCount,
  pendingCount,
  syncEnabled,
}: SummaryGridProps) {
  const items = [
    { title: '喂奶', value: feedCount, detail: `${feedTotal} ml` },
    { title: '拉粑粑', value: poopCount, detail: '近24h' },
    { title: '益生菌', value: probioticCount, detail: '近24h' },
    { title: '待同步', value: pendingCount, detail: syncEnabled ? '待发送' : '本地' },
  ]

  return (
    <section className="grid grid-cols-4 gap-1.5" aria-label="24小时概览">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--surface-border)] bg-white/62 px-2 py-3 shadow-[0_4px_10px_-2px_rgba(15,23,42,0.04)] ring-1 ring-black/3 backdrop-blur-md dark:border-[var(--surface-border-strong)] dark:bg-white/6 dark:ring-white/6 sm:px-2.5 sm:py-3.5"
        >
          <p className="truncate text-center text-[0.64rem] font-medium tracking-[0.1em] text-slate-500 dark:text-zinc-300">
            {item.title}
          </p>
          <p className="mt-1 text-center tabular-nums text-[clamp(1.1rem,4.5vw,1.4rem)] font-bold leading-none text-primary">
            {item.value}
          </p>
          <p className="mt-1.5 truncate text-center text-[0.68rem] font-medium text-slate-500 dark:text-zinc-200">
            {item.detail}
          </p>
        </div>
      ))}
    </section>
  )
}
