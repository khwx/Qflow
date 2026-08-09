'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface DarkModeContextType {
  isDark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDark))
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggle = () => setIsDark(!isDark)

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}
