'use client'

import { useState } from 'react'
import { X, Sparkles, Send } from 'lucide-react'
import { adviceRules, marketPrices, weather } from '@/lib/data'
import { useLocale } from '@/lib/i18n/context'

type Msg = { role: 'user' | 'assistant'; text: string }
type T = (key: string, vars?: Record<string, string | number>) => string

function answer(question: string, t: T): string {
  const q = question.toLowerCase()

  const priceCrop = marketPrices.find((m) => q.includes(m.crop.toLowerCase()))
  if (priceCrop && /price|market|cost|sell for|worth/.test(q)) {
    const up = priceCrop.change >= 0
    return t('assistant.priceAnswer', { crop: priceCrop.crop, price: priceCrop.price, sign: up ? '+' : '', change: priceCrop.change })
  }
  if (/price|market/.test(q)) {
    return t('assistant.priceSummary', { list: marketPrices.map((m) => `${m.crop} $${m.price}/ton`).join(', ') })
  }

  if (/weather|rain|forecast|temperature/.test(q)) {
    return t('assistant.weatherAnswer', {
      location: weather.location,
      temp: weather.temp,
      condition: weather.condition,
      rain: weather.rainChance,
      wind: weather.wind,
    })
  }

  const cropRule = adviceRules.find((r) => q.includes(r.crop.toLowerCase()))
  if (cropRule) {
    return t('assistant.adviceAnswer', {
      crop: cropRule.crop,
      region: cropRule.region,
      season: cropRule.season,
      planting: cropRule.planting,
      watering: cropRule.watering,
      fertilizer: cropRule.fertilizer,
      pest: cropRule.pest,
    })
  }
  if (/advice|guidance|plant|grow/.test(q)) {
    const crops = Array.from(new Set(adviceRules.map((r) => r.crop))).join(', ')
    return t('assistant.adviceList', { crops })
  }

  if (/list|sell my|publish/.test(q)) {
    return t('assistant.listingHelp')
  }
  if (/buy|browse|find produce/.test(q)) {
    return t('assistant.browseHelp')
  }

  return t('assistant.fallback')
}

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale()
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: t('assistant.intro') }])
  const [input, setInput] = useState('')

  if (!open) return null

  function send() {
    const q = input.trim()
    if (!q) return
    setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: answer(q, t) }])
    setInput('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="glass-strong flex h-full w-full max-w-sm flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold">{t('assistant.title')}</span>
          </div>
          <button onClick={onClose} aria-label={t('assistant.close')} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-white/5 text-foreground/90'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('assistant.inputPlaceholder')}
            className="glass flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
