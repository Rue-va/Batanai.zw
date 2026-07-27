'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Users, Handshake, Star, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill } from '@/components/ui/glass'
import { Avatar } from '@/components/avatar'
import { getSession, type SessionUser } from '@/lib/auth'
import { useLocale } from '@/lib/i18n/context'
import { getAdminUsers, getAdminTransactions, getAdminRatings, type AdminUser, type AdminTransaction, type AdminRating } from '@/lib/queries/admin'

type Tab = 'users' | 'transactions' | 'ratings'

export default function AdminPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [tab, setTab] = useState<Tab>('users')

  useEffect(() => {
    const s = getSession()
    setUser(s)
    // Client-side gate is a UX nicety only — the real boundary is the
    // backend's requireRole('admin') on every /api/admin/* route, which
    // rejects with a 403 regardless of what this page does.
    if (s && s.role !== 'admin') {
      router.replace('/dashboard')
      return
    }
    setAllowed(!!s)
  }, [router])

  if (!allowed) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <span className="text-sm font-semibold">{t('admin.badge')}</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl italic font-semibold sm:text-3xl">{t('admin.heading')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.signedInAs', { name: user?.name ?? '' })}</p>
        </div>

        <div className="glass inline-flex gap-1 rounded-2xl p-1 text-sm font-medium">
          {(
            [
              { id: 'users', labelKey: 'tabUsers', icon: Users },
              { id: 'transactions', labelKey: 'tabTransactions', icon: Handshake },
              { id: 'ratings', labelKey: 'tabRatings', icon: Star },
            ] as const
          ).map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-colors ${
                tab === tabItem.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tabItem.icon className="size-4" />
              {t(`admin.${tabItem.labelKey}`)}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTab />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'ratings' && <RatingsTab />}
      </div>
    </AppShell>
  )
}

function UsersTab() {
  const { t } = useLocale()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">{t('admin.colUser')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colContact')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colRole')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colRegistered')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colLastLogin')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Avatar name={u.name} size={24} className="text-[10px]" />
                    {u.name}
                    {u.verified && <ShieldCheck className="size-3.5 text-primary" />}
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.email ?? u.phone ?? '—'}</td>
                <td className="px-5 py-3">
                  <Pill tone={u.role === 'admin' ? 'accent' : u.role === 'farmer' ? 'lime' : 'muted'}>{u.role}</Pill>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function TransactionsTab() {
  const { t } = useLocale()
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminTransactions().then(setTransactions).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">{t('admin.colCrop')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colFarmer')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colBuyer')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colQuantity')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colTotal')}</th>
              <th className="px-5 py-3 font-medium">{t('admin.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-3 font-medium">{tx.listing?.crop}</td>
                <td className="px-5 py-3 text-muted-foreground">{tx.farmer?.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{tx.buyer?.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{tx.quantity}</td>
                <td className="px-5 py-3 font-semibold">${Number(tx.totalPrice).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <Pill tone={tx.status === 'Completed' ? 'lime' : 'accent'}>{tx.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function RatingsTab() {
  const { t } = useLocale()
  const [ratings, setRatings] = useState<AdminRating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminRatings().then(setRatings).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div className="space-y-3">
      {ratings.length === 0 && <p className="text-sm text-muted-foreground">{t('admin.noRatingsYet')}</p>}
      {ratings.map((r) => (
        <GlassCard key={r.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={r.fromUser.name} size={22} className="text-[9px]" />
              <span className="font-medium">{r.fromUser.name}</span>
              <span className="text-muted-foreground">{t('admin.rated')}</span>
              <Avatar name={r.toUser.name} size={22} className="text-[9px]" />
              <span className="font-medium">{r.toUser.name}</span>
            </div>
            <span className="flex items-center gap-0.5 text-xs text-accent">
              <Star className="size-3 fill-accent" />
              {r.value}
            </span>
          </div>
          {r.comment && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.comment}</p>}
        </GlassCard>
      ))}
    </div>
  )
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  )
}
