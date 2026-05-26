import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatInterval(seconds: number): string {
  if (seconds < 0) return '一次性'
  if (seconds < 3600) return `${seconds / 60} 分钟`
  if (seconds < 86400) return `${seconds / 3600} 小时`
  return `${seconds / 86400} 天`
}

export function timeUntil(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000)
  if (diff <= 0) return '即将执行'
  if (diff < 3600) return `${Math.ceil(diff / 60)} 分钟后`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时后`
  return `${Math.floor(diff / 86400)} 天后`
}
