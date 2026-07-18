import type { TaskConfig, DeviceConfig, HelpDoc } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE = ((import.meta as any).env?.VITE_API_BASE as string | undefined) ?? ''
export const WS_URL = (BASE ? BASE.replace(/^http/, 'ws') : `ws://${location.host}`) + '/ws'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      message = data.detail ?? data.error ?? message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  return res.json()
}

export const api = {
  getStatus:      ()                          => req<Record<string, unknown>>('/api/status'),
  getTasks:       ()                          => req<TaskConfig[]>('/api/tasks'),
  putTasks:       (tasks: TaskConfig[])       => req('/api/tasks',         { method: 'PUT',  body: JSON.stringify(tasks) }),
  getConfig:      ()                          => req<Record<string, unknown>>('/api/config'),
  putConfig:      (cfg: Record<string, unknown>) => req('/api/config',     { method: 'PUT',  body: JSON.stringify(cfg) }),
  getStaticConfig:()                          => req<Record<string, unknown>>('/api/static-config'),
  getHelp:        (lang = 'zh_CN')            => req<{ docs: HelpDoc[] }>(`/api/help?lang=${encodeURIComponent(lang)}`),
  getConfigs:     ()                          => req<{ configs: string[]; active: string }>('/api/configs'),
  createConfig:   (name: string)              => req<{ ok: boolean; name: string }>('/api/configs', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteConfig:   (name: string)              => req<{ ok: boolean }>(`/api/configs/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  setActiveConfig:(configDir: string)         => req('/api/active-config',  { method: 'PUT',  body: JSON.stringify({ configDir }) }),
  start:          (configDir?: string)        => req('/api/start',          { method: 'POST', body: JSON.stringify({ configDir }) }),
  stop:           ()                          => req('/api/stop',           { method: 'POST' }),
  startVirtualDisplay: (configDir?: string)   => req<{ ok: boolean; error?: string }>('/api/virtual-display/start', { method: 'POST', body: JSON.stringify({ configDir }) }),
  stopVirtualDisplay:  ()                     => req<{ ok: boolean; error?: string }>('/api/virtual-display/stop',  { method: 'POST' }),
  adbConnect:     (serial: string)            => req<{ ok: boolean; output?: string; error?: string }>(
    '/api/adb/connect', { method: 'POST', body: JSON.stringify({ serial }) }
  ),
  getActivity:    ()                          => req<Record<string, { name: string; stages: Record<string, unknown> } | null>>('/api/activity'),
  runTask:        (task: string)              => req<{ ok: boolean }>('/api/run-task', { method: 'POST', body: JSON.stringify({ task }) }),
}
