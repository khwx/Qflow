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
