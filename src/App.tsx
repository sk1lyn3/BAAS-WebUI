import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Scheduler from './pages/Scheduler'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Logs from './pages/Logs'
import type { Page, RunState, TaskConfig, LogEntry, DeviceConfig, ThenAction, VirtualDisplayStatus, ThemeMode } from './lib/types'
import { INITIAL_TASKS, INITIAL_LOGS, INITIAL_CONFIG } from './lib/mock-data'
import { api, WS_URL } from './lib/api'

let nextLogId = INITIAL_LOGS.length + 1

const SERVER_REVERSE: Record<string, DeviceConfig['server']> = {
  '官服': 'CN', 'B服': 'CN',
  '国际服': 'Global', '国际服青少年': 'Global', '韩国ONE': 'Global', 'Steam国际服': 'Global',
  '日服': 'JP', '日服PC端': 'JP',
}

const INITIAL_VIRTUAL_DISPLAY: VirtualDisplayStatus = {
  running: false,
  starting: false,
  displayId: null,
  configDir: null,
}

function mapRawToConfig(raw: Record<string, unknown>, prev: DeviceConfig): DeviceConfig {
  const ip   = (raw.adbIP as string | undefined) ?? ''
  const port = (raw.adbPort as string | undefined) ?? ''
  const serial = ip ? (port ? `${ip}:${port}` : ip) : prev.serial
  const rawServer = raw.server as string | undefined
  const server: DeviceConfig['server'] = (rawServer ? SERVER_REVERSE[rawServer] : undefined) ?? prev.server
  const fav1 = raw.favorStudent1 as string[] | undefined
  const fav2 = raw.favorStudent2 as string[] | undefined
  return {
    ...prev,
    serial,
    server,
    screenshotMethod:   (raw.screenshot_method as DeviceConfig['screenshotMethod']) ?? prev.screenshotMethod,
    screenshotInterval: Number(raw.screenshot_interval ?? prev.screenshotInterval),
    thenAction:         (raw.then as DeviceConfig['thenAction']) ?? prev.thenAction,
    autoStart:          Boolean(raw.autostart ?? prev.autoStart),
    cafeInvite1:        (fav1?.[0]) ?? prev.cafeInvite1,
    cafeInvite2:        (fav2?.[0]) ?? prev.cafeInvite2,
    normalStages:       (raw.mainlinePriority as string | undefined) ?? prev.normalStages,
    hardStages:         (raw.hardPriority as string | undefined) ?? prev.hardStages,
    notifyEnabled:      Boolean(raw.push_after_error ?? raw.push_after_completion ?? prev.notifyEnabled),
    notifyWebhook:      (raw.push_json as string | undefined) ?? prev.notifyWebhook,
  }
}

export default function App() {
  const [page, setPage]               = useState<Page>('home')
  const [runState, setRunState]       = useState<RunState>('idle')
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [tasks, setTasks]             = useState<TaskConfig[]>(INITIAL_TASKS)
  const [logs, setLogs]               = useState<LogEntry[]>(INITIAL_LOGS)
  const [config, setConfig]           = useState<DeviceConfig>(INITIAL_CONFIG)
  const [rawConfig, setRawConfig]     = useState<Record<string, unknown>>({})
  const [serverOk, setServerOk]       = useState(false)
  const [configList, setConfigList]   = useState<string[]>(['default'])
  const [activeConfig, setActiveConfig] = useState<string>('default')
  const [virtualDisplay, setVirtualDisplay] = useState<VirtualDisplayStatus>(INITIAL_VIRTUAL_DISPLAY)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('baas-theme')
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
  })

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const dark = themeMode === 'dark' || (themeMode === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    localStorage.setItem('baas-theme', themeMode)
    applyTheme()
    if (themeMode !== 'system') return
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [themeMode])

  // ── Append log entries ──────────────────────────────────────────────────
  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs(prev => [...prev.slice(-800), { ...entry, id: nextLogId++ }])
  }, [])

  // ── WebSocket connection ────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'init' || msg.type === 'status') {
          const d = msg.data ?? msg
          if (typeof d.running === 'boolean')
            setRunState(d.running ? 'running' : 'idle')
          if ('currentTask' in d) setCurrentTask(d.currentTask ?? null)
          if (d.virtualDisplay) setVirtualDisplay({ ...INITIAL_VIRTUAL_DISPLAY, ...d.virtualDisplay })
        } else if (msg.type === 'log' && msg.data) {
          addLog(msg.data)
        } else if (msg.type === 'history' && Array.isArray(msg.data)) {
          // 回放历史日志，按 id 去重合并并排序
          const entries: LogEntry[] = msg.data
            .filter((m: { type: string; data?: LogEntry }) => m.type === 'log' && m.data)
            .map((m: { data: LogEntry }) => m.data)
          if (entries.length > 0) {
            setLogs(prev => {
              const byId = new Map(entries.map(l => [l.id, l]))
              prev.forEach(l => { if (!byId.has(l.id)) byId.set(l.id, l) })
              return Array.from(byId.values()).sort((a, b) => a.id - b.id).slice(-800)
            })
          }
        }
      } catch { /* ignore */ }
    }

    ws.onopen  = () => setServerOk(true)
    ws.onclose = () => {
      setServerOk(false)
      setTimeout(connectWS, 3000)   // auto-reconnect
    }
    ws.onerror = () => ws.close()
  }, [addLog])

  // ── Refresh tasks from server ───────────────────────────────────────────
  const refreshTasks = useCallback(() => {
    api.getTasks().then(setTasks).catch(() => null)
  }, [])

  // ── Bootstrap: fetch data and connect WS ───────────────────────────────
  useEffect(() => {
    connectWS()

    api.getTasks().then(setTasks).catch(() => {/* use mock */})
    api.getConfig().then(raw => {
      setRawConfig(raw)
      setConfig(prev => mapRawToConfig(raw, prev))
    }).catch(() => {/* use mock */})

    api.getConfigs().then(({ configs, active }) => {
      setConfigList(configs)
      setActiveConfig(active)
    }).catch(() => {})

    api.getStatus().then(s => {
      setRunState(s.running ? 'running' : 'idle')
      setCurrentTask((s.currentTask as string | null) ?? null)
      if (s.virtualDisplay) setVirtualDisplay({ ...INITIAL_VIRTUAL_DISPLAY, ...(s.virtualDisplay as Partial<VirtualDisplayStatus>) })
    }).catch(() => {/* use mock */})

    // Poll tasks every 30s to pick up next_tick updates from running BAAS
    const tid = setInterval(refreshTasks, 30_000)

    return () => { wsRef.current?.close(); clearInterval(tid) }
  }, [connectWS, refreshTasks])

  // ── Start / Stop ────────────────────────────────────────────────────────
  async function handleStartRun() {
    if (!serverOk) {
      addLog({ level: 'WARNING', time: now(), message: '未连接到 BAAS 后端 (webui_server.py)，当前为 Demo 模式' })
      return
    }
    if (runState !== 'idle') return
    if (config.screenshotMethod === 'virtual_scrcpy' && !virtualDisplay.running) {
      addLog({ level: 'WARNING', time: now(), message: '请先启动虚拟屏幕' })
      return
    }
    setRunState('running')
    setCurrentTask(null)
    const res = await api.start(activeConfig).catch((err: unknown) => ({ ok: false, error: String(err) })) as { ok: boolean; error?: string }
    if (!res.ok) {
      setRunState('idle')
      addLog({ level: 'ERROR', time: now(), message: `启动失败: ${res.error ?? ''}` })
    }
  }

  async function handleStopRun() {
    if (!serverOk || runState === 'idle') return
    setRunState('stopping')
    await api.stop().catch(() => null)
    setCurrentTask(null)
    setTimeout(() => setRunState('idle'), 800)
  }

  async function handleStartVirtualDisplay() {
    if (!serverOk) {
      addLog({ level: 'WARNING', time: now(), message: '未连接到 BAAS 后端，无法启动虚拟屏幕' })
      return
    }
    if (config.screenshotMethod !== 'virtual_scrcpy') {
      addLog({ level: 'WARNING', time: now(), message: '当前截图方式不是 virtual_scrcpy' })
      return
    }
    if (virtualDisplay.running || virtualDisplay.starting) return
    setVirtualDisplay(prev => ({ ...prev, starting: true, configDir: activeConfig }))
    const res = await api.startVirtualDisplay(activeConfig).catch((err: unknown) => ({ ok: false, error: String(err) })) as { ok: boolean; error?: string }
    if (!res.ok) {
      setVirtualDisplay(prev => ({ ...prev, starting: false }))
      addLog({ level: 'ERROR', time: now(), message: `启动虚拟屏幕失败: ${res.error ?? ''}` })
    }
  }

  async function handleStopVirtualDisplay() {
    if (!serverOk) return
    if (runState !== 'idle') {
      addLog({ level: 'WARNING', time: now(), message: '请先停止当前任务，再关闭虚拟屏幕' })
      return
    }
    const res = await api.stopVirtualDisplay().catch((err: unknown) => ({ ok: false, error: String(err) })) as { ok: boolean; error?: string }
    if (!res.ok) {
      addLog({ level: 'ERROR', time: now(), message: `关闭虚拟屏幕失败: ${res.error ?? ''}` })
    } else {
      setVirtualDisplay(INITIAL_VIRTUAL_DISPLAY)
    }
  }

  async function handleWakeDevice() {
    if (!serverOk) {
      addLog({ level: 'WARNING', time: now(), message: '未连接到 BAAS 后端，无法唤醒设备' })
      return
    }
    if (config.screenshotMethod !== 'virtual_scrcpy') {
      addLog({ level: 'WARNING', time: now(), message: '当前截图方式不是 virtual_scrcpy' })
      return
    }
    if (!virtualDisplay.running) {
      addLog({ level: 'WARNING', time: now(), message: '请先启动虚拟屏幕' })
      return
    }
    const res = await api.wakeUnlockScreenOff().catch((err: unknown) => ({ ok: false, error: String(err) })) as { ok: boolean; error?: string }
    if (!res.ok) {
      addLog({ level: 'ERROR', time: now(), message: `唤醒设备失败: ${res.error ?? ''}` })
    } else {
      addLog({ level: 'INFO', time: now(), message: '已唤醒设备并关闭物理屏幕' })
    }
  }

  async function handleToggleRun() {
    if (runState === 'idle') await handleStartRun()
    else if (runState === 'running') await handleStopRun()
  }

  async function handleRunTask(task: string) {
    if (!serverOk) {
      addLog({ level: 'WARNING', time: now(), message: '未连接到 BAAS 后端 (webui_server.py)，无法执行单次任务' })
      return false
    }
    if (runState !== 'idle') {
      addLog({ level: 'WARNING', time: now(), message: '已有任务在运行，请先停止当前任务' })
      return false
    }
    if (config.screenshotMethod === 'virtual_scrcpy' && !virtualDisplay.running) {
      addLog({ level: 'WARNING', time: now(), message: '请先启动虚拟屏幕' })
      return false
    }
    setRunState('running')
    setCurrentTask(task)
    const res = await api.runTask(task).catch((err: unknown) => ({ ok: false, error: String(err) })) as { ok: boolean; error?: string }
    if (!res.ok) {
      setRunState('idle')
      setCurrentTask(null)
      addLog({ level: 'ERROR', time: now(), message: `执行失败: ${res.error ?? ''}` })
      return false
    }
    return true
  }

  // ── Task updates ────────────────────────────────────────────────────────
  function handleUpdateTask(updated: TaskConfig) {
    const next = tasks.map(t => t.func_name === updated.func_name ? updated : t)
    setTasks(next)
    if (serverOk) api.putTasks(next).catch(() => null)
  }

  function handleReorderTasks(reordered: TaskConfig[]) {
    setTasks(reordered)
    if (serverOk) api.putTasks(reordered).catch(() => null)
  }

  function handleRefreshAll() {
    const now = Math.floor(Date.now() / 1000)
    const next = tasks.map(t => ({ ...t, next_tick: now }))
    setTasks(next)
    if (serverOk) api.putTasks(next).catch(() => null)
  }

  function handlePostponeAll() {
    const nextTick = nextRefreshTimestamp()
    const next = tasks.map(t => ({ ...t, next_tick: nextTick }))
    setTasks(next)
    if (serverOk) api.putTasks(next).catch(() => null)
  }

  function handleToggleAll(enabled: boolean) {
    const next = tasks.map(t => ({ ...t, enabled }))
    setTasks(next)
    if (serverOk) api.putTasks(next).catch(() => null)
  }

  // ── Config save (receives full raw BAAS config) ─────────────────────────
  async function handleSaveConfig(raw: Record<string, unknown>) {
    setRawConfig(raw)
    setConfig(prev => mapRawToConfig(raw, prev))
    if (!serverOk) return
    await api.putConfig({ ...raw, _configDir: activeConfig }).catch(() => null)
  }

  async function handleThenActionChange(action: ThenAction) {
    const next = { ...rawConfig, then: action }
    await handleSaveConfig(next)
  }

  async function handleSwitchConfig(name: string) {
    await api.setActiveConfig(name).catch(() => null)
    setActiveConfig(name)
    const [newTasks, raw] = await Promise.all([
      api.getTasks().catch(() => null),
      api.getConfig().catch(() => null),
    ])
    if (newTasks) setTasks(newTasks)
    if (raw) { setRawConfig(raw); setConfig(prev => mapRawToConfig(raw, prev)) }
  }

  async function handleCreateConfig(name: string) {
    await api.createConfig(name)
    const { configs, active } = await api.getConfigs()
    setConfigList(configs)
    setActiveConfig(active)
    await handleSwitchConfig(name)
  }

  async function handleDeleteConfig(name: string) {
    await api.deleteConfig(name)
    const { configs, active } = await api.getConfigs()
    setConfigList(configs)
    setActiveConfig(active)
  }

  async function handleImport(file: File) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (Array.isArray(data)) {
      await api.putTasks(data)
      setTasks(data)
    } else {
      await api.putConfig(data)
      setRawConfig(data)
      setConfig(prev => mapRawToConfig(data, prev))
    }
  }

  const configProps = { configList, activeConfig, onSwitchConfig: handleSwitchConfig, onCreateConfig: handleCreateConfig, onDeleteConfig: handleDeleteConfig }

  return (
    <div className="flex h-screen overflow-hidden bg-ba-bg">
      <Sidebar page={page} onNav={setPage} running={runState === 'running'} currentTask={currentTask} serverOk={serverOk} themeMode={themeMode} onThemeChange={setThemeMode} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {page === 'home'      && <Home runState={runState} currentTask={currentTask} logs={logs} onToggleRun={handleToggleRun} serverOk={serverOk} thenAction={config.thenAction} onThenActionChange={handleThenActionChange} virtualDisplay={virtualDisplay} screenshotMethod={config.screenshotMethod} onStartVirtualDisplay={handleStartVirtualDisplay} onStopVirtualDisplay={handleStopVirtualDisplay} onWakeDevice={handleWakeDevice} {...configProps} />}
        {page === 'scheduler' && <Scheduler tasks={tasks} onUpdateTask={handleUpdateTask} onToggleAll={handleToggleAll} onRefreshAll={handleRefreshAll} onPostponeAll={handlePostponeAll} onReorderTasks={handleReorderTasks} serverOk={serverOk} {...configProps} />}
        {page === 'settings'  && <Settings rawConfig={rawConfig} onSave={handleSaveConfig} serverOk={serverOk} runState={runState} currentTask={currentTask} onRunTask={handleRunTask} onStopRun={handleStopRun} onImport={handleImport} {...configProps} />}
        {page === 'help'      && <Help />}
        {page === 'logs'      && <Logs logs={logs} />}
      </main>
    </div>
  )
}

function now() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function nextRefreshTimestamp() {
  const d = new Date()
  d.setHours(4, 0, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  return Math.floor(d.getTime() / 1000)
}
function pad(n: number) { return String(n).padStart(2, '0') }
