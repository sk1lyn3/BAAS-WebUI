import { useState, useMemo, useEffect, useRef } from 'react'
import { Settings2, RefreshCw, ArrowUpDown, GripVertical, Zap, Pencil } from 'lucide-react'
import type { TaskConfig } from '../lib/types'
import Toggle from '../components/Toggle'
import TaskDetailModal from '../components/TaskDetailModal'
import ConfigSwitcher from '../components/ConfigSwitcher'
import { formatTimestamp, timeUntil, formatInterval } from '../lib/utils'
import { cn } from '../lib/utils'

type SortMode = 'priority' | 'next_tick'

interface Props {
  tasks: TaskConfig[]
  onUpdateTask: (updated: TaskConfig) => void
  onToggleAll: (enabled: boolean) => void
  onReorderTasks: (reordered: TaskConfig[]) => void
  serverOk: boolean
  configList: string[]
  activeConfig: string
  onSwitchConfig: (name: string) => void
  onCreateConfig: (name: string) => void
  onDeleteConfig: (name: string) => void
}

const TAG_MAP: Record<string, { label: string; color: string }> = {
  cafe_reward:              { label: '咖啡厅', color: 'bg-pink-100 text-pink-600' },
  group:                    { label: '社团',   color: 'bg-green-100 text-green-600' },
  lesson:                   { label: '日程',   color: 'bg-purple-100 text-purple-600' },
  collect_reward:           { label: '奖励',   color: 'bg-ba-yellow-pale text-amber-600' },
  mail:                     { label: '邮箱',   color: 'bg-sky-100 text-sky-600' },
  arena:                    { label: '竞技',   color: 'bg-red-100 text-red-600' },
  common_shop:              { label: '商店',   color: 'bg-indigo-100 text-indigo-600' },
  tactical_challenge_shop:  { label: '商店',   color: 'bg-indigo-100 text-indigo-600' },
  create:                   { label: '制造',   color: 'bg-orange-100 text-orange-600' },
  rewarded_task:            { label: '通缉',   color: 'bg-red-100 text-red-600' },
  total_assault:            { label: '总力战', color: 'bg-ba-pale text-ba-primary' },
  scrimmage:                { label: '交流会', color: 'bg-teal-100 text-teal-600' },
  joint_firing_drill:       { label: '演习',   color: 'bg-orange-100 text-orange-600' },
  activity_sweep:           { label: '活动',   color: 'bg-fuchsia-100 text-fuchsia-600' },
}

function getTag(func_name: string) {
  return TAG_MAP[func_name] || { label: '其他', color: 'bg-gray-100 text-gray-500' }
}

function tsToLocal(ts: number): string {
  const d = new Date(ts * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function Scheduler({ tasks, onUpdateTask, onToggleAll, onReorderTasks, serverOk, configList, activeConfig, onSwitchConfig, onCreateConfig, onDeleteConfig }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('priority')
  const [detailTask, setDetailTask] = useState<TaskConfig | null>(null)
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  // Force re-render every 60s so timeUntil() stays fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  const dragEnabled = sortMode === 'priority' && filter === 'all'

  function handleDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Transparent drag ghost
    const ghost = document.createElement('div')
    ghost.style.position = 'absolute'
    ghost.style.top = '-9999px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (idx !== overIdx) setOverIdx(idx)
  }

  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null); setOverIdx(null); return
    }
    const newOrder = [...sorted]
    const [moved] = newOrder.splice(dragIdx, 1)
    newOrder.splice(dropIdx, 0, moved)
    onReorderTasks(newOrder.map((t, i) => ({ ...t, priority: i + 1 })))
    setDragIdx(null); setOverIdx(null)
  }

  function handleDragEnd() {
    setDragIdx(null); setOverIdx(null)
  }

  function handleToggle(task: TaskConfig, v: boolean) {
    onUpdateTask({ ...task, enabled: v })
    if (serverOk) {
      setLastSaved(task.func_name)
      setTimeout(() => setLastSaved(null), 1500)
    }
  }

  function startEditTick(task: TaskConfig) {
    setEditingTask(task.func_name)
    setEditValue(tsToLocal(task.next_tick))
    setTimeout(() => editRef.current?.focus(), 0)
  }

  function commitEditTick(task: TaskConfig) {
    if (!editValue) { setEditingTask(null); return }
    const ts = Math.floor(new Date(editValue).getTime() / 1000)
    if (!isNaN(ts)) onUpdateTask({ ...task, next_tick: ts })
    setEditingTask(null)
  }

  function handleSetNow(task: TaskConfig) {
    onUpdateTask({ ...task, next_tick: Math.floor(Date.now() / 1000) })
  }

  const allEnabled = tasks.every(t => t.enabled)
  const enabledCount = tasks.filter(t => t.enabled).length

  const sorted = useMemo(() => {
    const filtered = tasks.filter(t =>
      filter === 'all' ? true : filter === 'enabled' ? t.enabled : !t.enabled
    )
    if (sortMode === 'priority') return [...filtered].sort((a, b) => a.priority - b.priority)
    return [...filtered].sort((a, b) => (a.enabled === b.enabled ? a.next_tick - b.next_tick : a.enabled ? -1 : 1))
  }, [tasks, sortMode, filter])

  function handleRefreshAll() {
    const now = Math.floor(Date.now() / 1000)
    tasks.forEach(t => onUpdateTask({ ...t, next_tick: now }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-ba-navy">调度配置</h2>
          <p className="text-sm text-ba-muted mt-0.5">
            {enabledCount}/{tasks.length} 个任务已启用
            {lastSaved && <span className="ml-2 text-ba-success text-xs">✓ 已保存</span>}
            {!serverOk && <span className="ml-2 text-ba-warning text-xs">（离线模式，更改不会持久化）</span>}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAll(!allEnabled)}
            className="ba-btn-ghost text-sm"
          >
            {allEnabled ? '全部禁用' : '全部启用'}
          </button>
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-1.5 ba-btn-ghost text-sm"
          >
            <RefreshCw size={13} /> 立即刷新
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex rounded-lg border border-ba-border bg-white overflow-hidden">
          {(['all', 'enabled', 'disabled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-ba-primary text-white'
                  : 'text-ba-muted hover:text-ba-navy hover:bg-ba-pale'
              )}
            >
              {{ all: '全部', enabled: '已启用', disabled: '已禁用' }[f]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortMode(m => m === 'priority' ? 'next_tick' : 'priority')}
          className="flex items-center gap-1.5 text-xs text-ba-muted hover:text-ba-primary border border-ba-border rounded-lg px-3 py-1.5 bg-white hover:bg-ba-pale transition-all"
        >
          <ArrowUpDown size={12} />
          {sortMode === 'priority' ? '按优先级' : '按执行时间'}
        </button>

        {dragEnabled && (
          <span className="text-[11px] text-ba-muted flex items-center gap-1">
            <GripVertical size={11} className="text-ba-border" />
            可拖拽排序
          </span>
        )}
      </div>

      {/* Table */}
      <div className="ba-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ba-border bg-ba-pale/50">
              {dragEnabled && <th className="w-8" />}
              <th className="text-left text-xs font-semibold text-ba-muted px-4 py-3 w-8">#</th>
              <th className="text-left text-xs font-semibold text-ba-muted px-2 py-3">任务</th>
              <th className="text-left text-xs font-semibold text-ba-muted px-2 py-3 w-36">下次执行</th>
              <th className="text-left text-xs font-semibold text-ba-muted px-2 py-3 w-20">间隔</th>
              <th className="text-center text-xs font-semibold text-ba-muted px-2 py-3 w-16">启用</th>
              <th className="text-center text-xs font-semibold text-ba-muted px-4 py-3 w-16">配置</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, i) => {
              const tag = getTag(task.func_name)
              const soon = task.next_tick - Date.now() / 1000 < 3600
              const isDragging = dragIdx === i
              const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
              const dropAbove = isOver && dragIdx !== null && dragIdx > i
              const dropBelow = isOver && dragIdx !== null && dragIdx < i
              return (
                <tr
                  key={task.func_name}
                  draggable={dragEnabled}
                  onDragStart={dragEnabled ? e => handleDragStart(e, i) : undefined}
                  onDragOver={dragEnabled ? e => handleDragOver(e, i) : undefined}
                  onDrop={dragEnabled ? e => handleDrop(e, i) : undefined}
                  onDragEnd={dragEnabled ? handleDragEnd : undefined}
                  className={cn(
                    'border-b border-ba-border/50 last:border-0 transition-all duration-100',
                    task.enabled ? 'hover:bg-ba-pale/30' : 'opacity-50 hover:opacity-70',
                    isDragging && 'opacity-30 bg-ba-pale',
                    dropAbove && 'border-t-2 border-t-ba-primary',
                    dropBelow && 'border-b-2 border-b-ba-primary',
                  )}
                >
                  {dragEnabled && (
                    <td className="pl-3 pr-0 py-3 w-8">
                      <GripVertical
                        size={14}
                        className="text-ba-border hover:text-ba-muted cursor-grab active:cursor-grabbing transition-colors"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs text-ba-muted tabular-nums">{task.priority}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0', tag.color)}>
                        {tag.label}
                      </span>
                      <span className="font-medium text-ba-navy">{task.event_name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    {editingTask === task.func_name ? (
                      <input
                        ref={editRef}
                        type="datetime-local"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEditTick(task)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEditTick(task)
                          if (e.key === 'Escape') setEditingTask(null)
                        }}
                        className="ba-input text-xs py-1 w-[160px]"
                      />
                    ) : (
                      <div className="group flex items-center gap-1">
                        <div>
                          <div className="text-ba-navy text-xs tabular-nums">{formatTimestamp(task.next_tick)}</div>
                          <div className={cn('text-[10px] mt-0.5', soon && task.enabled ? 'text-ba-primary font-medium' : 'text-ba-muted')}>
                            {timeUntil(task.next_tick)}
                          </div>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                          <button
                            title="编辑时间"
                            onClick={() => startEditTick(task)}
                            className="p-1 rounded text-ba-muted hover:text-ba-primary hover:bg-ba-pale transition-colors"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            title="立即执行"
                            onClick={() => handleSetNow(task)}
                            className="p-1 rounded text-ba-muted hover:text-ba-yellow hover:bg-ba-yellow-pale transition-colors"
                          >
                            <Zap size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-ba-muted">{formatInterval(task.interval)}</td>
                  <td className="px-2 py-3 text-center">
                    <Toggle
                      checked={task.enabled}
                      onChange={v => handleToggle(task, v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDetailTask(task)}
                      className="text-ba-muted hover:text-ba-primary p-1.5 rounded-lg hover:bg-ba-pale transition-colors"
                    >
                      <Settings2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-ba-muted text-sm">无匹配任务</div>
        )}
      </div>

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          allTasks={tasks}
          onSave={onUpdateTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  )
}
