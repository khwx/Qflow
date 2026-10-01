'use client'

import dynamic from 'next/dynamic'

export const AdminSections = {
  establishments: dynamic(() => import('@/app/admin/establishments/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  dashboard: dynamic(() => import('@/app/admin/dashboard/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  operator: dynamic(() => import('@/app/admin/operator/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  triage: dynamic(() => import('@/app/admin/triage/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  queues: dynamic(() => import('@/app/admin/queues/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  tickets: dynamic(() => import('@/app/admin/tickets/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  orders: dynamic(() => import('@/app/admin/orders/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  menu: dynamic(() => import('@/app/admin/menu/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  polls: dynamic(() => import('@/app/admin/polls/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  feedback: dynamic(() => import('@/app/admin/feedback/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  'tv-display-config': dynamic(() => import('@/app/admin/tv-display-config/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  games: dynamic(() => import('@/app/admin/games/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  customers: dynamic(() => import('@/app/admin/customers/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
  settings: dynamic(() => import('@/app/admin/settings/page'), {
    loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>,
    ssr: false,
  }),
}

export function getSectionFromPath(pathname: string): keyof typeof AdminSections | null {
  const segments = pathname.split('/').filter(Boolean)
  const adminIndex = segments.indexOf('admin')
  if (adminIndex === -1 || adminIndex + 1 >= segments.length) return null
  const section = segments[adminIndex + 1]
  return (AdminSections as Record<string, unknown>)[section] ? section as keyof typeof AdminSections : null
}