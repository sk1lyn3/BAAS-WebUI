export type Page = 'home' | 'scheduler' | 'settings' | 'help' | 'logs'
export type Server = 'CN' | 'JP' | 'Global'
export type ScreenshotMethod = 'scrcpy' | 'virtual_scrcpy' | 'uiautomator2' | 'adb'
export type ThenAction = '无动作' | '退出 Baas' | '退出 模拟器' | '退出 Baas 和 模拟器' | '关机'
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
export type RunState = 'idle' | 'running' | 'stopping'

export interface ActivityInfo {
  name: string
  stages: Record<string, unknown>
}

export interface HelpDoc {
  title: string
  content: string
}

export interface LogEntry {
  id: number
  level: LogLevel
  time: string
  message: string
}

export interface TaskConfig {
  func_name: string
  event_name: string
  enabled: boolean
  priority: number
  interval: number
  next_tick: number
  daily_reset: [number, number, number][]
  disabled_time_range: [number, number, number][][]
  pre_task: string[]
  post_task: string[]
}

export interface DeviceConfig {
  server: Server
  serial: string
  screenshotMethod: ScreenshotMethod
  screenshotInterval: number
  thenAction: ThenAction
  cafeInvite1: string
  cafeInvite2: string
  normalStages: string
  hardStages: string
  notifyEnabled: boolean
  notifyWebhook: string
  autoStart: boolean
}

export interface Resources {
  ap: number
  apMax: number
  pyroxene: number
  credits: number
}
