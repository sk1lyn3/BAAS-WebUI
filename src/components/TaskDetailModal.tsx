import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { TaskConfig } from '../lib/types'
import { formatInterval } from '../lib/utils'
import { cn } from '../lib/utils'

interface Props {
  task: TaskConfig
  allTasks: TaskConfig[]
  onSave: (updated: TaskConfig) => void
  onClose: () => void
}

export default function TaskDetailModal({ task, allTasks, onSave, onClose }: Props) {
  const [form, setForm] = useState<TaskConfig>({ ...task })

  const otherTasks = allTasks.filter(t => t.func_name !== task.func_name)

  function toggleList(key: 'pre_task' | 'post_task', name: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(name)
        ? f[key].filter(x => x !== name)
        : [...f[key], name]
    }))
  }

  function handleSave() {
    onSave(form)
    onClose()
  }

  const INTERVALS = [
    { label: '每半小时', v: 1800 },
    { label: '每小时', v: 3600 },
    { label: '每天', v: 86400 },
    { label: '一次性', v: -1 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ba-border">
          <div>
            <div className="text-xs text-ba-muted mb-0.5">任务详细配置</div>
            <div className="font-semibold text-ba-navy">{form.event_name}</div>
          </div>
          <button onClick={onClose} className="text-ba-muted hover:text-ba-navy p-1 rounded-lg hover:bg-ba-pale transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Priority + Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ba-label">优先级</label>
              <input
                type="number"
                className="ba-input"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))}
                min={1}
              />
              <div className="text-[10px] text-ba-muted mt-1">数值越小越优先</div>
            </div>
            <div>
              <label className="ba-label">执行间隔</label>
              <select
                className="ba-select"
                value={form.interval}
                onChange={e => setForm(f => ({ ...f, interval: +e.target.value }))}
              >
                {INTERVALS.map(o => (
                  <option key={o.v} value={o.v}>{o.label}</option>
                ))}
                {!INTERVALS.find(o => o.v === form.interval) && (
                  <option value={form.interval}>{formatInterval(form.interval)}</option>
                )}
              </select>
            </div>
          </div>

          {/* Daily reset */}
          <div>
            <label className="ba-label">每日重置时间</label>
            <div className="space-y-2">
              {form.daily_reset.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={23}
                    className="ba-input w-16 text-center"
                    value={t[0]}
                    onChange={e => setForm(f => {
                      const r = [...f.daily_reset]
                      r[i] = [+e.target.value, r[i][1], r[i][2]]
                      return { ...f, daily_reset: r }
                    })}
                  />
                  <span className="text-ba-muted text-sm">:</span>
                  <input
                    type="number" min={0} max={59}
                    className="ba-input w-16 text-center"
                    value={t[1]}
                    onChange={e => setForm(f => {
                      const r = [...f.daily_reset]
                      r[i] = [r[i][0], +e.target.value, r[i][2]]
                      return { ...f, daily_reset: r }
                    })}
                  />
                  <span className="text-ba-muted text-xs ml-1">UTC</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, daily_reset: f.daily_reset.filter((_, j) => j !== i) }))}
                    className="ml-auto text-ba-muted hover:text-ba-error p-1 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, daily_reset: [...f.daily_reset, [4, 0, 0]] }))}
                className="flex items-center gap-1.5 text-xs text-ba-primary hover:text-ba-hover font-medium py-1"
              >
                <Plus size={13} /> 添加重置时间
              </button>
            </div>
          </div>

          {/* Pre/Post tasks */}
          {['pre_task', 'post_task'].map(key => (
            <div key={key}>
              <label className="ba-label">{key === 'pre_task' ? '前置任务' : '后置任务'}</label>
              <div className="flex flex-wrap gap-1.5">
                {otherTasks.map(t => {
                  const selected = (form[key as 'pre_task' | 'post_task'] as string[]).includes(t.func_name)
                  return (
                    <button
                      key={t.func_name}
                      onClick={() => toggleList(key as 'pre_task' | 'post_task', t.func_name)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border transition-all',
                        selected
                          ? 'bg-ba-primary text-white border-ba-primary'
                          : 'bg-white text-ba-muted border-ba-border hover:border-ba-primary hover:text-ba-primary'
                      )}
                    >
                      {t.event_name}
                    </button>
                  )
                })}
              </div>
              {(form[key as 'pre_task' | 'post_task'] as string[]).length === 0 && (
                <div className="text-[11px] text-ba-muted mt-1">无</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ba-border bg-gray-50/50">
          <button onClick={onClose} className="ba-btn-ghost text-sm">取消</button>
          <button onClick={handleSave} className="ba-btn-primary text-sm">保存</button>
        </div>
      </div>
    </div>
  )
}
