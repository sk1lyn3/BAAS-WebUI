import { Home, Clock, Settings, ScrollText, Zap, CircleHelp, Monitor, Moon, Sun } from 'lucide-react'
import type { Page, ThemeMode } from '../lib/types'
import { cn } from '../lib/utils'

const NAV = [
  { id: 'home',      label: '主页',   icon: Home       },
  { id: 'scheduler', label: '调度',   icon: Clock      },
  { id: 'settings',  label: '设置',   icon: Settings   },
  { id: 'help',      label: '帮助',   icon: CircleHelp },
  { id: 'logs',      label: '日志',   icon: ScrollText },
] as const

interface Props {
  page: Page
  onNav: (p: Page) => void
  running: boolean
  currentTask: string | null
  serverOk: boolean
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { mode: 'system', label: '系统', icon: Monitor },
  { mode: 'light',  label: '浅色', icon: Sun },
  { mode: 'dark',   label: '深色', icon: Moon },
]

export default function Sidebar({ page, onNav, running, currentTask, serverOk, themeMode, onThemeChange }: Props) {
  return (
    <>
      {/* ── 桌面左侧栏 ── */}
      <aside className="hidden md:flex w-56 h-screen flex-col bg-ba-card border-r border-ba-border shrink-0 sticky top-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-ba-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ba-primary rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-ba-navy leading-none">BAAS</div>
              <div className="text-[10px] text-ba-muted mt-0.5 leading-none">蔚蓝档案自动脚本</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNav(id as Page)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                page === id
                  ? 'bg-ba-pale text-ba-primary'
                  : 'text-ba-muted hover:bg-ba-pale/60 hover:text-ba-navy'
              )}
            >
              <Icon size={16} strokeWidth={page === id ? 2.5 : 2} />
              {label}
              {page === id && (
                <span className="ml-auto w-1 h-4 bg-ba-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-4 py-4 border-t border-ba-border">
          <div className="mb-4 grid grid-cols-3 rounded-lg border border-ba-border bg-ba-bg/70 p-1">
            {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                title={`主题：${label}`}
                onClick={() => onThemeChange(mode)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all',
                  themeMode === mode
                    ? 'bg-ba-card text-ba-primary shadow-sm'
                    : 'text-ba-muted hover:text-ba-navy hover:bg-ba-card/70'
                )}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0',
              running ? 'bg-ba-success animate-pulse' : serverOk ? 'bg-ba-primary' : 'bg-ba-border'
            )} />
            <span className="text-xs text-ba-muted font-medium">
              {running ? '运行中' : serverOk ? '已连接' : '未连接'}
            </span>
          </div>
          {running && currentTask && (
            <div className="text-[11px] text-ba-primary bg-ba-pale rounded-md px-2 py-1.5 leading-snug">
              {currentTask}
            </div>
          )}
          <div className="mt-3 text-[10px] text-ba-border text-center select-none">
            v0.1.0 · UI Preview
          </div>
        </div>
      </aside>

      {/* ── 移动端底部 Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-ba-card border-t border-ba-border flex safe-area-inset-bottom">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNav(id as Page)}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              page === id ? 'text-ba-primary' : 'text-ba-muted'
            )}
          >
            <Icon size={20} strokeWidth={page === id ? 2.5 : 2} />
            {label}
            {id === 'home' && running && (
              <span className="absolute top-1.5 right-1/4 w-1.5 h-1.5 bg-ba-success rounded-full animate-pulse" />
            )}
          </button>
        ))}
        <button
          onClick={() => onThemeChange(themeMode === 'dark' ? 'system' : themeMode === 'system' ? 'light' : 'dark')}
          className="relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-ba-muted transition-colors"
        >
          {themeMode === 'dark' ? <Moon size={20} /> : themeMode === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
          主题
        </button>
      </nav>
    </>
  )
}
