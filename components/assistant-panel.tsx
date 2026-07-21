'use client'

import { useState } from 'react'
import { X, Sparkles, Send } from 'lucide-react'
import { adviceRules, marketPrices, weather } from '@/lib/data'

type Msg = { role: 'user' | 'assistant'; text: string }

const INTRO =
  'Hi! I can help with crop guidance, market prices, or weather. I\'m a simple rule-based assistant, not a live AI model — try "maize advice" or "soybean price".'

function answer(question: string): string {
  const q = question.toLowerCase()

  const priceCrop = marketPrices.find((m) => q.includes(m.crop.toLowerCase()))
  if (priceCrop && /price|market|cost|sell for|worth/.test(q)) {
    const up = priceCrop.change >= 0
    return `${priceCrop.crop} is trading at $${priceCrop.price}/ton on the regional benchmark (${up ? '+' : ''}${priceCrop.change}% this week).`
  }
  if (/price|market/.test(q)) {
    return `Today's regional benchmark: ${marketPrices.map((m) => `${m.crop} $${m.price}/ton`).join(', ')}.`
  }

  if (/weather|rain|forecast|temperature/.test(q)) {
    return `${weather.location}: ${weather.temp}°C, ${weather.condition}, ${weather.rainChance}% chance of rain, wind ${weather.wind} km/h.`
  }

  const cropRule = adviceRules.find((r) => q.includes(r.crop.toLowerCase()))
  if (cropRule) {
    return `${cropRule.crop} — ${cropRule.region}, ${cropRule.season}:\nPlanting: ${cropRule.planting}\nWatering: ${cropRule.watering}\nFertilizer: ${cropRule.fertilizer}\nPest & disease: ${cropRule.pest}`
  }
  if (/advice|guidance|plant|grow/.test(q)) {
    const crops = Array.from(new Set(adviceRules.map((r) => r.crop))).join(', ')
    return `I have planting guidance for: ${crops}. Ask e.g. "maize advice", or open Decision Support for the full crop/region/season lookup.`
  }

  if (/list|sell my|publish/.test(q)) {
    return 'Head to Marketplace → "New Listing" to publish your crop, quantity, and price. Buyers can then express interest directly.'
  }
  if (/buy|browse|find produce/.test(q)) {
    return 'Head to Browse (Marketplace) to search listings by crop or region, then tap "Express interest" to start a conversation.'
  }

  return 'Try asking about a crop ("maize advice"), a price ("soybean price"), or the weather ("weather today").'
}

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: INTRO }])
  const [input, setInput] = useState('')

  if (!open) return null

  function send() {
    const q = input.trim()
    if (!q) return
    setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: answer(q) }])
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
            <span className="text-sm font-semibold">Assistant</span>
          </div>
          <button onClick={onClose} aria-label="Close assistant" className="text-muted-foreground hover:text-foreground">
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
            placeholder="Ask about crops, weather, prices..."
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
