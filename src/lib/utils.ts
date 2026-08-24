import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function generateTicketNumber(queuePrefix: string, number: number) {
  return `${queuePrefix}-${String(number).padStart(3, '0')}`
}

export function getEstimatedWait(current: number, serving: string | null, avgTime: number = 3) {
  const position = serving ? Math.max(0, current - parseInt(serving.split('-')[1] || '0')) : current
  return position * avgTime
}

export function computeAvgWaitMinutes(
  tickets: { created_at: string; called_at: string | null }[]
): number {
  const waited = tickets.filter(
    (t) => t.called_at && new Date(t.called_at) >= new Date(t.created_at)
  )
  if (waited.length === 0) return 0
  const total = waited.reduce(
    (sum, t) =>
      sum + (new Date(t.called_at!).getTime() - new Date(t.created_at).getTime()) / 60000,
    0
  )
  return Math.round(total / waited.length)
}

export function computeAvgServiceMinutes(
  tickets: { called_at: string | null; completed_at: string | null }[]
): number {
  const served = tickets.filter((t) => t.called_at && t.completed_at)
  if (served.length === 0) return 0
  const total = served.reduce(
    (sum, t) =>
      sum + (new Date(t.completed_at!).getTime() - new Date(t.called_at!).getTime()) / 60000,
    0
  )
  return Math.round(total / served.length)
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `há ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}
