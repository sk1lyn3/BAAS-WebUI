import { useRef, useEffect, useState } from 'react'
import { Play, Square, Sword, ChevronDown, MonitorUp, MonitorX, Power, RadioTower, Check } from 'lucide-react'
import type { LogEntry, RunState, ThenAction, VirtualDisplayStatus, ManagedModeStatus, ScreenshotMethod } from '../lib/types'
import { cn, formatTimestamp } from '../lib/utils'
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
  virtualDisplay: VirtualDisplayStatus
  managedMode: ManagedModeStatus
  screenshotMethod: ScreenshotMethod
  onStartVirtualDisplay: () => void
  onStopVirtualDisplay: () => void
  onWakeDevice: () => void
  onStartManagedMode: (configs: string[]) => void
  onStopManagedMode: () => void
  thenAction: ThenAction
  onThenActionChange: (action: ThenAction) => void
  configList: string[]
  activeConfig: string
  onSwitchConfig: (name: string) => void
  onCreateConfig: (name: string) => void
  onDeleteConfig: (name: string) => void
}

export default function Home({ runState, currentTask, logs, onToggleRun, serverOk, virtualDisplay, managedMode, screenshotMethod, onStartVirtualDisplay, onStopVirtualDisplay, onWakeDevice, onStartManagedMode, onStopManagedMode, thenAction, onThenActionChange, configList, activeConfig, onSwitchConfig, onCreateConfig, onDeleteConfig }: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showThen, setShowThen] = useState(false)
  const [managedConfigs, setManagedConfigs] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('baas-managed-configs') || '[]')
      return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  })


  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  useEffect(() => {
    if (configList.length === 0) return
    setManagedConfigs(prev => {
      const filtered = prev.filter(name => configList.includes(name))
      const next = filtered.length > 0 ? filtered : (activeConfig ? [activeConfig] : [])
      localStorage.setItem('baas-managed-configs', JSON.stringify(next))
      return next
    })
  }, [configList, activeConfig])

  const isRunning = runState === 'running'
  const isStopping = runState === 'stopping'
  const usesVirtualScrcpy = ['virtual_scrcpy', 'android_companion'].includes(screenshotMethod)
  const virtualReady = virtualDisplay.running
  const virtualStarting = virtualDisplay.starting
  const managedRunning = managedMode.running
  const managedBusy = managedMode.phase === 'starting' || managedMode.phase === 'stopping'
  const managedStatus = managedRunning
    ? managedMode.phase === 'running'
      ? managedMode.currentConfig ? `执行中 · ${managedMode.currentConfig}` : '执行中'
      : managedMode.phase === 'starting'
      ? '启动中'
      : managedMode.phase === 'stopping'
      ? '停止中'
      : managedMode.nextWakeAt
      ? `待机 · ${formatTimestamp(managedMode.nextWakeAt)}`
      : '待机'
    : '未启动'

  function toggleManagedConfig(name: string) {
    setManagedConfigs(prev => {
      const next = prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
      localStorage.setItem('baas-managed-configs', JSON.stringify(next))
      return next
    })
  }

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
        {usesVirtualScrcpy && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ba-border bg-ba-card px-2 py-2 shadow-sm">
            <button
              onClick={onStartVirtualDisplay}
              disabled={!serverOk || virtualReady || virtualStarting || isRunning || isStopping}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95',
                virtualReady
                  ? 'bg-ba-pale text-ba-primary'
                  : virtualStarting
                  ? 'bg-ba-bg text-ba-muted/60 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 dark:border dark:border-ba-primary/35 dark:bg-ba-primary/15 dark:text-ba-primary dark:hover:bg-ba-primary/25'
              )}
            >
              <MonitorUp size={15} strokeWidth={2.4} />
              {virtualReady ? '虚拟屏幕已启动' : virtualStarting ? '启动中...' : '启动虚拟屏幕'}
            </button>
            <button
              onClick={onStopVirtualDisplay}
              disabled={!serverOk || !virtualReady || isRunning || isStopping}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all active:scale-95',
                virtualReady && !isRunning && !isStopping
                  ? 'border-ba-border text-ba-muted hover:text-ba-error hover:border-ba-error/40 hover:bg-red-500/10'
                  : 'border-ba-border/60 text-ba-muted/50 cursor-not-allowed'
              )}
            >
              <MonitorX size={15} strokeWidth={2.4} />
              关闭虚拟屏幕
            </button>
            <button
              onClick={onWakeDevice}
              disabled={!serverOk || !virtualReady || virtualStarting}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all active:scale-95',
                serverOk && virtualReady && !virtualStarting
                  ? 'border-ba-primary/35 bg-ba-primary/10 text-ba-primary hover:bg-ba-primary/20'
                  : 'border-ba-border/60 text-ba-muted/50 cursor-not-allowed'
              )}
            >
              <Power size={15} strokeWidth={2.4} />
              唤醒设备
            </button>
            <span className="px-2 text-[11px] text-ba-muted tabular-nums">
              {virtualReady
                ? `Display ${virtualDisplay.displayId ?? '-'}`
                : virtualStarting
                ? '创建中'
                : '未启动'}
            </span>
          </div>
        )}

        <button
          onClick={onToggleRun}
          disabled={managedRunning || isStopping || (usesVirtualScrcpy && !virtualReady)}
          className={cn(
            'flex items-center gap-2.5 font-semibold px-8 py-3 rounded-xl transition-all duration-150 active:scale-95 select-none text-sm shadow-sm',
            managedRunning || isStopping || (usesVirtualScrcpy && !virtualReady)
              ? 'bg-ba-border/60 text-ba-muted/60 cursor-not-allowed'
              : isRunning
              ? 'bg-ba-error hover:bg-red-500 text-white shadow-sm'
              : 'bg-ba-primary hover:bg-ba-hover text-white shadow-ba-pale'
          )}
        >
          {isRunning ? <Square size={15} strokeWidth={2.5} /> : <Play size={15} strokeWidth={2.5} />}
          {managedRunning ? '托管运行中' : isStopping ? '停止中...' : isRunning ? '停止' : '档案，启动！'}
        </button>

        {/* Then action */}
        <div className="relative">
          <button
            onClick={() => setShowThen(v => !v)}
            className="flex items-center gap-2 text-sm text-ba-muted hover:text-ba-navy border border-ba-border rounded-lg px-3 py-2.5 bg-ba-card hover:bg-ba-pale transition-all"
          >
            <Sword size={13} />
            完成后：<span className="text-ba-navy font-medium">{thenAction}</span>
            <ChevronDown size={13} className={cn('transition-transform', showThen && 'rotate-180')} />
          </button>
          {showThen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThen(false)} />
              <div className="absolute top-full left-0 mt-1 bg-ba-card border border-ba-border rounded-xl shadow-xl z-20 py-1 min-w-max overflow-hidden">
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

      {usesVirtualScrcpy && (
        <div className="ba-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center border',
                managedRunning
                  ? 'border-ba-primary/30 bg-ba-primary/10 text-ba-primary'
                  : 'border-ba-border bg-ba-pale text-ba-muted'
              )}>
                <RadioTower size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ba-navy">托管模式</div>
                <div className="text-xs text-ba-muted">{managedStatus}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {managedRunning ? (
                <button
                  onClick={onStopManagedMode}
                  disabled={!serverOk || managedMode.phase === 'stopping'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-ba-error/35 text-ba-error hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Square size={14} />
                  停止托管
                </button>
              ) : (
                <button
                  onClick={() => onStartManagedMode(managedConfigs)}
                  disabled={!serverOk || isRunning || managedConfigs.length === 0 || managedBusy}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95',
                    !serverOk || isRunning || managedConfigs.length === 0 || managedBusy
                      ? 'bg-ba-border/60 text-ba-muted/60 cursor-not-allowed'
                      : 'bg-ba-primary text-white hover:bg-ba-hover'
                  )}
                >
                  <Play size={14} />
                  启动托管
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {configList.map(name => {
              const selected = managedConfigs.includes(name)
              return (
                <button
                  key={name}
                  onClick={() => toggleManagedConfig(name)}
                  disabled={managedRunning}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                    selected
                      ? 'border-ba-primary/40 bg-ba-primary/10 text-ba-primary'
                      : 'border-ba-border bg-ba-card text-ba-muted hover:border-ba-primary/30 hover:text-ba-primary',
                    managedRunning && 'cursor-not-allowed opacity-70'
                  )}
                >
                  {selected && <Check size={12} />}
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}

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
