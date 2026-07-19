export const locales = ['pt', 'en', 'es', 'fr', 'de', 'it', 'ar', 'zh', 'ja', 'ko', 'hi', 'ru'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'pt'

export const localeNames: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  ru: 'Русский',
}

export const localeFlags: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  hi: '🇮🇳',
  ru: '🇷🇺',
}
