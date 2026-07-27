'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BrainCircuit, Store, Search, User, Sparkles, ShieldCheck } from 'lucide-react'
import { getSession, type SessionUser } from '@/lib/auth'
import { AssistantPanel } from '@/components/assistant-panel'
import { useLocale } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

function navFor(role: SessionUser['role'] | undefined) {
  // Admin is a distinct third role, not an add-on to farmer/buyer — an
  // admin-promoted account no longer passes requireRole('farmer'|'buyer')
  // on the backend, so linking to Decision Support/Marketplace here would
  // just lead to permission errors. Admins get their own oversight view.
  if (role === 'admin') {
    return [
      { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { href: '/admin', labelKey: 'admin', icon: ShieldCheck },
      { href: '/settings', labelKey: 'profile', icon: User },
    ]
  }
  return [
    { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    ...(role === 'buyer' ? [] : [{ href: '/decision-support', labelKey: 'decision', icon: BrainCircuit }]),
    { href: '/marketplace', labelKey: role === 'buyer' ? 'browse' : 'marketplace', icon: role === 'buyer' ? Search : Store },
    { href: '/settings', labelKey: 'profile', icon: User },
  ]
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    setUser(getSession())
  }, [])

  const nav = navFor(user?.role)

  return (
    <>
      <button
        onClick={() => setAssistantOpen(true)}
        aria-label={t('nav.openAssistant')}
        className="glass-strong fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full text-primary transition-transform hover:scale-105 sm:right-6"
      >
        <Sparkles className="size-6" />
      </button>

      <nav className="glass-strong fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-3xl px-2 py-2 sm:inset-x-6">
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-5" />
              {t(`nav.${item.labelKey}`)}
            </Link>
          )
        })}
      </nav>

      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}
