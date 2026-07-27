'use client'

import { useState } from 'react'
import { Bell, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { tasks, recommendations, marketPrices } from '@/lib/data'
import { useLocale } from '@/lib/i18n/context'

type Notification = {
  id: string
  text: string
  icon: typeof Bell
  tone: 'accent' | 'danger' | 'lime'
}

function buildNotifications(t: (key: string, vars?: Record<string, string | number>) => string): Notification[] {
  const list: Notification[] = []

  tasks
    .filter((task) => task.status === 'due')
    .forEach((task) => list.push({ id: `task-${task.title}`, text: t('notifications.dueToday', { task: task.title }), icon: Clock, tone: 'accent' }))

  recommendations
    .filter((r) => r.priority === 'high')
    .forEach((r) => list.push({ id: `rec-${r.title}`, text: r.title, icon: AlertTriangle, tone: 'danger' }))

  marketPrices
    .filter((m) => Math.abs(m.change) >= 1.5)
    .forEach((m) =>
      list.push({
        id: `price-${m.crop}`,
        text: t(m.change >= 0 ? 'notifications.priceUp' : 'notifications.priceDown', { crop: m.crop, change: Math.abs(m.change) }),
        icon: m.change >= 0 ? TrendingUp : TrendingDown,
        tone: m.change >= 0 ? 'lime' : 'danger',
      }),
    )

  return list
}

const toneText = { accent: 'text-accent', danger: 'text-destructive', lime: 'text-primary' } as const

export function NotificationsBell() {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<Set<string>>(new Set())
  const notifications = buildNotifications(t)
  const unreadCount = notifications.filter((n) => !read.has(n.id)).length

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="glass relative flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-foreground"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-background" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass-strong absolute right-0 top-12 z-50 w-80 rounded-2xl p-3">
            <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">{t('notifications.title')}</p>
            <div className="max-h-80 space-y-1 overflow-y-auto no-scrollbar">
              {notifications.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">{t('notifications.allCaughtUp')}</p>
              )}
              {notifications.map((n) => {
                const Icon = n.icon
                const isRead = read.has(n.id)
                return (
                  <button
                    key={n.id}
                    onClick={() => setRead((prev) => new Set(prev).add(n.id))}
                    className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <Icon className={`mt-0.5 size-3.5 shrink-0 ${toneText[n.tone]}`} />
                    <span className={`text-xs leading-relaxed ${isRead ? 'text-muted-foreground' : 'text-foreground/90'}`}>
                      {n.text}
                    </span>
                    {!isRead && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
