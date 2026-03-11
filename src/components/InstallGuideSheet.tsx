import {
  Browser,
  CheckCircle,
  DownloadSimple,
  ShareNetwork,
  X,
} from '@phosphor-icons/react'
import type { InstallGuideMode } from '../hooks/usePwaInstall'

interface InstallGuideSheetProps {
  mode: InstallGuideMode | null
  onClose: () => void
  show: boolean
}

export function InstallGuideSheet({ mode, onClose, show }: InstallGuideSheetProps) {
  if (!show || !mode) {
    return null
  }

  const isIosGuide = mode === 'ios'

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/36 backdrop-blur-sm dark:bg-slate-950/72">
      <button
        type="button"
        aria-label="关闭安装说明"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="sheet-surface absolute inset-x-0 bottom-0 mx-auto max-w-3xl rounded-t-[24px] px-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--surface-border-strong)]" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">安装到设备</p>
            <h2 className="mt-1 flex items-center gap-2 text-[1.08rem] font-semibold text-primary">
              <DownloadSimple size={18} weight="fill" />
              {isIosGuide ? '添加到主屏幕' : '保存到桌面'}
            </h2>
            <p className="mt-1 text-[0.8rem] leading-[1.5] text-muted">
              {isIosGuide
                ? 'iPhone / iPad 需要通过 Safari 手动添加。'
                : '桌面浏览器现在通常把安装入口放在地址栏或浏览器菜单里，不一定会给明显的大按钮。'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="action-tap inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--surface-border-strong)] bg-[var(--control-bg)] text-secondary"
            aria-label="关闭安装说明"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {isIosGuide ? (
            <>
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <Browser size={16} />
                  1. 请先用 Safari 打开这个页面
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  其他 iOS 浏览器通常还是走 Safari 内核，但主屏安装入口最稳定的还是 Safari。
                </p>
              </div>

              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <ShareNetwork size={16} />
                  2. 点底部“分享”
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  在系统分享面板里，找到“添加到主屏幕”。
                </p>
              </div>

              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <CheckCircle size={16} weight="fill" />
                  3. 确认添加
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  添加后会像普通 App 一样出现在主屏，打开更快，也更像原生工具。
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <DownloadSimple size={16} />
                  1. 看地址栏右侧有没有安装图标
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  Chrome、Edge 一般会在地址栏附近显示安装应用入口。
                </p>
              </div>

              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <Browser size={16} />
                  2. 或者打开浏览器菜单
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  找“安装应用”“添加到桌面”或类似名称的入口。
                </p>
              </div>

              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[0.82rem] font-medium text-primary">
                  <CheckCircle size={16} weight="fill" />
                  3. 如果还是没有入口
                </p>
                <p className="mt-1 text-[0.76rem] leading-[1.45] text-muted">
                  先确认页面走的是 HTTPS，再优先用 Chrome 或 Edge 打开最新版站点。
                </p>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="action-tap mt-3 h-9 w-full rounded-lg bg-emerald-400 text-[0.84rem] font-semibold text-slate-950 shadow-[0_10px_24px_rgba(16,185,129,0.2)]"
        >
          知道了
        </button>
      </section>
    </div>
  )
}
