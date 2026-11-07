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
  if (seconds < 0) return 'ainda agora'
  if (seconds < 60) return seconds === 1 ? '1 segundo atrás' : `${seconds} segundos atrás`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes === 1 ? '1 min atrás' : `${minutes} min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? '1 hora atrás' : `${hours} horas atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return days === 1 ? '1 dia atrás' : `${days} dias atrás`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? '1 semana atrás' : `${weeks} semanas atrás`
}

export function formatDatePortuguese(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', options)
  return formatter.format(date)
}
