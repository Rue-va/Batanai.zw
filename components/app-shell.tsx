'use client'

import type * as React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { OnlineStatus } from '@/components/online-status'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { Avatar } from '@/components/avatar'
import { getSession, refreshSession, type SessionUser } from '@/lib/auth'
import { watchConnectivityAndSync } from '@/lib/offline/sync'
import { useLocale } from '@/lib/i18n/context'

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    setUser(session)
    setChecked(true)
    // Revalidate in the background — catches a revoked/expired session
    // without blocking the initial render on a network round trip.
    refreshSession().then((fresh) => fresh && setUser(fresh))
  }, [router])

  useEffect(() => watchConnectivityAndSync(), [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar user={user} />
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-6">{children}</main>
      <BottomNav />
    </div>
  )
}

function TopBar({ user }: { user: SessionUser | null }) {
  const { t } = useLocale()
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Logo size={32} />
        <span className="font-serif text-base italic font-semibold tracking-tight">Batanai.zw</span>
      </div>

      <div className="glass hidden max-w-md flex-1 items-center gap-2 rounded-full px-4 py-2.5 md:flex">
        <Search className="size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('topbar.searchPlaceholder')}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <OnlineStatus />
        <NotificationsBell />
        <div className="glass flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4">
          <Avatar name={user?.name ?? '?'} size={32} />
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground">{user?.farmName}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
