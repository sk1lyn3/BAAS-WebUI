import { useRef, useEffect, useState } from 'react'
import { Play, Square, Sword, ChevronDown } from 'lucide-react'
import type { LogEntry, RunState, ThenAction } from '../lib/types'
import { cn } from '../lib/utils'
import ConfigSwitcher from '../components/ConfigSwitcher'

const THEN_OPTIONS: ThenAction[] = ['无动作', '退出 Baas', '退出 模拟器', '退出 Baas 和 模拟器', '关机']

const LOG_COLORS: Record<string, string> = {
  INFO:     '#60a5fa',
  WARNING:  '#f59e0b',
  ERROR:    '#f87171',
  CRITICAL: '#c084fc',
}

interface Props {
  runState: RunState
  currentTask: string | null
  logs: LogEntry[]
  onToggleRun: () => void
  serverOk: boolean
  thenAction: ThenAction
  onThenActionChange: (action: ThenAction) => void
  configList: string[]
  activeConfig: string
  onSwitchConfig: (name: string) => void
  onCreateConfig: (name: string) => void
  onDeleteConfig: (name: string) => void
}

export default function Home({ runState, currentTask, logs, onToggleRun, serverOk, thenAction, onThenActionChange, configList, activeConfig, onSwitchConfig, onCreateConfig, onDeleteConfig }: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showThen, setShowThen] = useState(false)


  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const isRunning = runState === 'running'
  const isStopping = runState === 'stopping'

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      {/* Banner */}
      <div className="ba-card">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-ba-primary via-sky-400 to-ba-primary bg-[length:200%_100%] animate-[gradient_3s_ease_infinite]" />
        <div className="px-6 py-5">
          <div>
            <h1 className="text-lg font-bold text-ba-navy">蔚蓝档案自动脚本</h1>
            <p className="text-sm text-ba-muted mt-0.5">
              {isRunning
                ? <span className="text-ba-success font-medium">● 运行中{currentTask ? ` · ${currentTask}` : ''}</span>
                : isStopping
                ? <span className="text-ba-warning font-medium">◌ 正在停止...</span>
                : serverOk
                ? <span className="text-ba-primary">● 已连接后端 · 待机</span>
                : <span className="text-ba-muted">○ 未连接</span>
              }
            </p>
            <ConfigSwitcher
              configList={configList}
              activeConfig={activeConfig}
              onSwitchConfig={onSwitchConfig}
              onCreateConfig={onCreateConfig}
              onDeleteConfig={onDeleteConfig}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onToggleRun}
          disabled={isStopping}
          className={cn(
            'flex items-center gap-2.5 font-semibold px-8 py-3 rounded-xl transition-all duration-150 active:scale-95 select-none text-sm shadow-sm',
            isStopping
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isRunning
              ? 'bg-ba-error hover:bg-red-500 text-white shadow-red-100'
              : 'bg-ba-primary hover:bg-ba-hover text-white shadow-ba-pale'
          )}
        >
          {isRunning ? <Square size={15} strokeWidth={2.5} /> : <Play size={15} strokeWidth={2.5} />}
          {isStopping ? '停止中...' : isRunning ? '停止' : '档案，启动！'}
        </button>

        {/* Then action */}
        <div className="relative">
          <button
            onClick={() => setShowThen(v => !v)}
            className="flex items-center gap-2 text-sm text-ba-muted hover:text-ba-navy border border-ba-border rounded-lg px-3 py-2.5 bg-white hover:bg-ba-pale transition-all"
          >
            <Sword size={13} />
            完成后：<span className="text-ba-navy font-medium">{thenAction}</span>
            <ChevronDown size={13} className={cn('transition-transform', showThen && 'rotate-180')} />
          </button>
          {showThen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThen(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-ba-border rounded-xl shadow-xl z-20 py-1 min-w-max overflow-hidden">
                {THEN_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { onThenActionChange(opt); setShowThen(false) }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm transition-colors',
                      opt === thenAction
                        ? 'text-ba-primary bg-ba-pale font-medium'
                        : 'text-ba-navy hover:bg-ba-pale'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Log box */}
      <div className="ba-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ba-border">
          <span className="text-sm font-semibold text-ba-navy">实时日志</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoScroll(v => !v)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-md border transition-all',
                autoScroll
                  ? 'border-ba-primary text-ba-primary bg-ba-pale'
                  : 'border-ba-border text-ba-muted hover:border-ba-primary hover:text-ba-primary'
              )}
            >
              自动滚动
            </button>
            <span className="text-[11px] text-ba-muted tabular-nums">{logs.length} 条</span>
          </div>
        </div>
        <div
          ref={logRef}
          className="bg-[#0f172a] h-[360px] overflow-y-auto font-mono text-[12px] leading-relaxed p-4 log-scrollbar"
        >
          {logs.map(log => (
            <div key={log.id} className="flex gap-2 py-[1px] hover:bg-white/5 px-1 rounded">
              <span style={{ color: LOG_COLORS[log.level] }} className="shrink-0 w-[54px] font-semibold">
                {log.level}
              </span>
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-600 text-center py-12">暂无日志</div>
          )}
        </div>
      </div>

    </div>
  )
}
