import { useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface Props {
  configList: string[]
  activeConfig: string
  onSwitchConfig: (name: string) => void
  onCreateConfig: (name: string) => void
  onDeleteConfig?: (name: string) => void
  className?: string
}

export default function ConfigSwitcher({ configList, activeConfig, onSwitchConfig, onCreateConfig, onDeleteConfig, className }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function confirmCreate() {
    if (!newName.trim()) return
    onCreateConfig(newName.trim())
    setNewName('')
    setShowNewInput(false)
    setShowMenu(false)
  }

  function handleDelete(name: string) {
    if (confirmDelete === name) {
      onDeleteConfig?.(name)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(name)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => { setShowMenu(v => !v); setShowNewInput(false); setConfirmDelete(null) }}
        className="flex items-center gap-1.5 text-xs text-ba-muted hover:text-ba-navy border border-ba-border rounded-md px-2.5 py-1 bg-white hover:bg-ba-pale transition-all"
      >
        配置: <span className="font-medium text-ba-navy">{activeConfig}</span>
        <ChevronDown size={11} className={cn('transition-transform', showMenu && 'rotate-180')} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setConfirmDelete(null) }} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-ba-border rounded-xl shadow-xl z-20 py-1 min-w-[180px] overflow-hidden">
            {configList.map(name => (
              <div key={name} className="group flex items-center">
                <button
                  onClick={() => { onSwitchConfig(name); setShowMenu(false) }}
                  className={cn(
                    'flex-1 text-left px-3 py-2 text-xs transition-colors',
                    name === activeConfig ? 'text-ba-primary bg-ba-pale font-medium' : 'text-ba-navy hover:bg-ba-pale'
                  )}
                >
                  {name}
                </button>
                {onDeleteConfig && name !== activeConfig && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(name) }}
                    title={confirmDelete === name ? '再次点击确认删除' : '删除配置'}
                    className={cn(
                      'mr-2 p-1 rounded transition-colors shrink-0',
                      confirmDelete === name
                        ? 'text-ba-error bg-red-50'
                        : 'text-ba-border hover:text-ba-error opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            <div className="border-t border-ba-border/50 mt-1 pt-1">
              {showNewInput ? (
                <div className="px-2 pb-2 pt-1 flex gap-1">
                  <input
                    autoFocus
                    className="ba-input text-xs flex-1 py-1"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="配置名称"
                    onKeyDown={e => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') setShowNewInput(false) }}
                  />
                  <button onClick={confirmCreate} className="text-xs px-2 py-1 bg-ba-primary text-white rounded-md">确定</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewInput(true)}
                  className="w-full text-left px-3 py-2 text-xs text-ba-primary hover:bg-ba-pale flex items-center gap-1.5"
                >
                  <Plus size={11} /> 新建配置
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
