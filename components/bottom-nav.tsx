'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BrainCircuit, Store, Search, User, Sparkles } from 'lucide-react'
import { getSession, type SessionUser } from '@/lib/auth'
import { AssistantPanel } from '@/components/assistant-panel'
import { cn } from '@/lib/utils'

function navFor(role: SessionUser['role'] | undefined) {
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(role === 'buyer' ? [] : [{ href: '/decision-support', label: 'Decision', icon: BrainCircuit }]),
    { href: '/marketplace', label: role === 'buyer' ? 'Browse' : 'Marketplace', icon: role === 'buyer' ? Search : Store },
    { href: '/settings', label: 'Profile', icon: User },
  ]
}

export function BottomNav() {
  const pathname = usePathname()
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
        aria-label="Open assistant"
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
              {item.label}
            </Link>
          )
        })}
      </nav>

      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}
