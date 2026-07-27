'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './dictionaries/en'
import { sh } from './dictionaries/sh'

export type Locale = 'en' | 'sh'

const dictionaries = { en, sh } as const

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'batanai.lang'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'sh') setLocaleState(saved)
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const value = getPath(dictionaries[locale], key) ?? getPath(dictionaries.en, key)
      return typeof value === 'string' ? interpolate(value, vars) : key
    }
  }, [locale])

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
