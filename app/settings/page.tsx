'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings as SettingsIcon,
  User,
  Sprout,
  Globe,
  ShieldCheck,
  Download,
  LogOut,
  Check,
  MapPin,
  Loader2,
  Star,
  Package,
  Handshake,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill, SectionTitle } from '@/components/ui/glass'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/avatar'
import { RoleIcon } from '@/components/role-icon'
import { exportFeedbackCsv } from '@/lib/feedback'
import { getMyListings, type Listing } from '@/lib/queries/listings'
import { getTransactions, type Transaction } from '@/lib/queries/transactions'
import { getReceivedRatings, getGivenRatings, rateTransaction, type Rating } from '@/lib/queries/ratings'
import { useLocale, type Locale } from '@/lib/i18n/context'
import {
  getSession,
  logout,
  updateProfile,
  updateLocation,
  hasResearchConsent,
  setResearchConsent,
  clearResearchConsent,
  type SessionUser,
} from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { t, locale, setLocale } = useLocale()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [consent, setConsent] = useState(false)
  const [saved, setSaved] = useState(false)

  const [listings, setListings] = useState<Listing[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])

  const [locationLabel, setLocationLabel] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [locationSaved, setLocationSaved] = useState(false)

  useEffect(() => {
    const s = getSession()
    setUser(s)
    setName(s?.name ?? '')
    setFarmName(s?.farmName ?? '')
    setLocationLabel(s?.locationLabel ?? '')
    setConsent(hasResearchConsent())

    if (s?.role === 'farmer') {
      getMyListings().then(setListings).catch(() => {})
      getReceivedRatings().then(setRatings).catch(() => {})
    } else if (s?.role === 'buyer') {
      getTransactions().then(setTransactions).catch(() => {})
      getGivenRatings().then(setRatings).catch(() => {})
    }
  }, [])

  async function saveProfile() {
    if (!user) return
    const next = await updateProfile({ name, farmName })
    setUser(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleConsent() {
    if (consent) {
      clearResearchConsent()
      setConsent(false)
    } else {
      setResearchConsent()
      setConsent(true)
    }
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  async function shareLocation() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError(t('settings.locationUnsupported'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const next = await updateLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            locationLabel: locationLabel.trim() || undefined,
          })
          setUser(next)
          setLocationSaved(true)
          setTimeout(() => setLocationSaved(false), 2000)
        } catch {
          setLocationError(t('settings.locationSaveFailed'))
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setLocationError(t('settings.locationDeclined'))
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  async function saveManualLocation() {
    if (!locationLabel.trim()) return
    const next = await updateLocation({ locationLabel: locationLabel.trim() })
    setUser(next)
    setLocationSaved(true)
    setTimeout(() => setLocationSaved(false), 2000)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? '?'} size={56} />
          <div>
            <div className="flex items-center gap-2 text-primary">
              <SettingsIcon className="size-5" />
              <span className="text-sm font-semibold">{t('settings.badge')}</span>
            </div>
            <h1 className="mt-1 font-serif text-2xl italic font-semibold sm:text-3xl">{t('settings.heading')}</h1>
          </div>
        </div>

        {/* Profile */}
        <GlassCard className="p-6">
          <SectionTitle title={t('settings.profile')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">{t('auth.fullName')}</label>
              <Input icon={<User className="size-4" />} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">
                {user?.role === 'buyer' ? t('auth.businessName') : t('auth.farmName')}
              </label>
              <Input icon={<Sprout className="size-4" />} value={farmName} onChange={(e) => setFarmName(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={saveProfile} size="sm">
              {t('common.saveChanges')}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Check className="size-3.5" /> {t('common.saved')}
              </span>
            )}
          </div>
        </GlassCard>

        {/* Account type: informational only — role is fixed at signup and can
            only be changed by an admin, never by the account holder. */}
        <GlassCard className="p-6">
          <SectionTitle title={t('settings.accountType')} />
          <div className="flex items-center gap-2 text-sm">
            <RoleIcon role={user?.role === 'buyer' ? 'buyer' : user?.role === 'admin' ? 'admin' : 'farmer'} />
            <span className="font-medium capitalize">{user?.role}</span>
            <span className="text-xs text-muted-foreground">{t('settings.accountTypeHint')}</span>
          </div>
        </GlassCard>

        {/* Location */}
        <GlassCard className="p-6">
          <SectionTitle
            title={t('settings.location')}
            action={user?.locationLabel ? <Pill tone="lime"><MapPin className="size-3" />{user.locationLabel}</Pill> : undefined}
          />
          <p className="text-sm text-muted-foreground">
            {user?.role === 'buyer' ? t('settings.locationHintBuyer') : t('settings.locationHintFarmer')}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={shareLocation} disabled={locating} size="sm" className="gap-2">
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {locating ? t('settings.gettingLocation') : t('settings.shareLocation')}
            </Button>
            <span className="text-xs text-muted-foreground">{t('settings.orEnterManually')}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder={t('settings.locationPlaceholder')}
              wrapperClassName="flex-1"
            />
            <Button onClick={saveManualLocation} disabled={!locationLabel.trim()} variant="tonal" size="sm">
              {t('common.save')}
            </Button>
          </div>
          {locationError && <p className="mt-2 text-xs text-destructive">{locationError}</p>}
          {locationSaved && (
            <span className="mt-2 flex items-center gap-1 text-xs text-primary">
              <Check className="size-3.5" /> {t('settings.locationSaved')}
            </span>
          )}
        </GlassCard>

        {/* Activity: own listings (farmers) or own transactions (buyers) */}
        {user?.role === 'farmer' && (
          <GlassCard className="p-6">
            <SectionTitle title={t('settings.myListings')} action={<span className="text-xs text-muted-foreground">{t('settings.totalCount', { count: listings.length })}</span>} />
            {listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('settings.noListingsYet')}</p>
            ) : (
              <div className="space-y-2">
                {listings.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="size-4 text-primary" />
                      <span className="font-medium">{l.crop}</span>
                      <span className="text-xs text-muted-foreground">{l.quantity}</span>
                    </div>
                    <Pill tone={l.status === 'active' ? 'lime' : 'muted'}>{l.status}</Pill>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {user?.role === 'buyer' && (
          <GlassCard className="p-6">
            <SectionTitle title={t('settings.myTransactions')} action={<span className="text-xs text-muted-foreground">{t('settings.totalCount', { count: transactions.length })}</span>} />
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('settings.noTransactionsYet')}</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Handshake className="size-4 text-primary" />
                        <span className="font-medium">{t.listing?.crop ?? 'Listing'}</span>
                        <span className="text-xs text-muted-foreground">{t.farmer?.name}</span>
                      </div>
                      <Pill tone={t.status === 'Completed' ? 'lime' : 'accent'}>{t.status}</Pill>
                    </div>
                    {t.status === 'Completed' && (
                      <RateTrade
                        transactionId={t.id}
                        existing={t.rating ?? null}
                        onRated={(rating) =>
                          setTransactions((prev) => prev.map((p) => (p.id === t.id ? { ...p, rating } : p)))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Ratings: received (farmers) or given (buyers) — own subset only */}
        <GlassCard className="p-6">
          <SectionTitle
            title={user?.role === 'buyer' ? t('settings.ratingsGiven') : t('settings.ratingsReceived')}
            action={
              user?.role === 'farmer' && user.rating ? (
                <Pill tone="accent"><Star className="size-3 fill-accent" />{user.rating} · {user.reviewCount}</Pill>
              ) : undefined
            }
          />
          {ratings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {user?.role === 'buyer' ? t('settings.noRatingsGivenYet') : t('settings.noRatingsYet')}
            </p>
          ) : (
            <div className="space-y-2">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.fromUser?.name ?? r.toUser?.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-accent">
                      <Star className="size-3 fill-accent" />
                      {r.value}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Language */}
        <GlassCard className="p-6">
          <SectionTitle title={t('settings.language')} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="size-4" />
            {t('settings.languageHint')}
          </div>
          <div className="glass mt-3 grid w-full max-w-xs grid-cols-2 gap-1 rounded-2xl p-1">
            {(['en', 'sh'] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-xl py-2 text-sm font-medium transition-colors ${
                  locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Research consent & data */}
        <GlassCard className="p-6">
          <SectionTitle title={t('settings.researchData')} />
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">{t('settings.researchDataNote')}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={toggleConsent} variant={consent ? 'tonal' : 'ghost'} size="sm" className={consent ? '' : 'bg-white/5'}>
              {consent ? t('settings.consentGiven') : t('settings.consentWithdrawn')}
            </Button>
            <Button onClick={exportFeedbackCsv} variant="ghost" size="sm" className="gap-2 bg-white/5">
              <Download className="size-4" />
              {t('settings.exportFeedback')}
            </Button>
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard className="p-6">
          <SectionTitle title={t('settings.session')} />
          <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
            <LogOut className="size-4" />
            {t('common.logOut')}
          </Button>
        </GlassCard>
      </div>
    </AppShell>
  )
}

function RateTrade({
  transactionId,
  existing,
  onRated,
}: {
  transactionId: string
  existing: { id: string; value: number; comment: string | null } | null
  onRated: (rating: { id: string; value: number; comment: string | null }) => void
}) {
  const { t } = useLocale()
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (existing) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs text-accent">
        <Star className="size-3 fill-accent" /> {t('settings.youRated', { value: existing.value })}
      </p>
    )
  }

  async function submit(value: number) {
    setSubmitting(true)
    try {
      const rating = await rateTransaction(transactionId, value)
      onRated(rating)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <span className="mr-1 text-xs text-muted-foreground">{t('settings.rateThisTrade')}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={submitting}
          onClick={() => submit(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star className={`size-4 ${n <= hover ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  )
}
