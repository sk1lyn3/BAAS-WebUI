import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Download, X } from 'lucide-react'
import type { LogEntry, LogLevel } from '../lib/types'
import { cn } from '../lib/utils'

const LEVELS: LogLevel[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']

const LEVEL_STYLE: Record<LogLevel, string> = {
  INFO:     'text-blue-400',
  WARNING:  'text-amber-400',
  ERROR:    'text-red-400',
  CRITICAL: 'text-purple-400',
}

const BADGE_STYLE: Record<LogLevel, string> = {
  INFO:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  WARNING:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ERROR:    'bg-red-500/20 text-red-400 border-red-500/30',
  CRITICAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

interface Props {
  logs: LogEntry[]
}

export default function Logs({ logs }: Props) {
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set(LEVELS))
  const [autoScroll, setAutoScroll] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    return logs.filter(l =>
      levelFilter.has(l.level) &&
      (query === '' || l.message.toLowerCase().includes(query.toLowerCase()))
    )
  }, [logs, levelFilter, query])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    logs.forEach(l => { c[l.level] = (c[l.level] || 0) + 1 })
    return c
  }, [logs])

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  function toggleLevel(l: LogLevel) {
    setLevelFilter(s => {
      const n = new Set(s)
      n.has(l) ? n.delete(l) : n.add(l)
      return n
    })
  }

  function exportLogs() {
    const text = filtered.map(l => `[${l.level}] ${l.time} ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `baas-logs-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-ba-navy">日志</h2>
          <p className="text-sm text-ba-muted mt-0.5">共 {logs.length} 条 · 显示 {filtered.length} 条</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(v => !v)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-all',
              autoScroll
                ? 'border-ba-primary text-ba-primary bg-ba-pale'
                : 'border-ba-border text-ba-muted hover:border-ba-primary'
            )}
          >
            自动滚动
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 text-xs ba-btn-ghost"
          >
            <Download size={12} /> 导出
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ba-muted" />
          <input
            className="ba-input pl-8 pr-8 text-xs"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索日志..."
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ba-muted hover:text-ba-navy">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Level badges */}
        <div className="flex items-center gap-1.5">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => toggleLevel(l)}
              className={cn(
                'text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all',
                levelFilter.has(l)
                  ? BADGE_STYLE[l]
                  : 'border-ba-border text-ba-muted/50 bg-ba-card opacity-50'
              )}
            >
              {l} {counts[l] ? `(${counts[l]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Log terminal */}
      <div className="flex-1 ba-card overflow-hidden">
        <div
          ref={logRef}
          className="h-full bg-[#0f172a] overflow-y-auto font-mono text-[12px] leading-relaxed p-4 log-scrollbar min-h-0"
          style={{ minHeight: 0, height: 'calc(100vh - 260px)' }}
        >
          {filtered.length === 0 ? (
            <div className="text-slate-600 text-center py-16">
              {query ? '无匹配结果' : '暂无日志'}
            </div>
          ) : (
            filtered.map(log => (
              <div
                key={log.id}
                className="flex gap-2 py-[2px] hover:bg-white/5 px-1 rounded group"
              >
                <span className={cn('shrink-0 font-bold w-[62px]', LEVEL_STYLE[log.level])}>
                  {log.level}
                </span>
                <span className="text-slate-500 shrink-0 tabular-nums">{log.time}</span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
