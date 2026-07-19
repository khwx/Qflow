'use client'

import { use, useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, type Locale, localeNames, localeFlags } from '@/i18n/config'

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
    setIsOpen(false)
  }

  const currentLocale = locale as Locale

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
      >
        <span>{localeFlags[currentLocale]}</span>
        <span className="text-sm">{localeNames[currentLocale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 bg-white rounded-xl shadow-xl z-50 min-w-[180px]">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition ${
                loc === currentLocale ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span className="text-sm font-medium">{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
