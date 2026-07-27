'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Store,
  Search as SearchIcon,
  Eye,
  Star,
  Plus,
  MessageSquare,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  BadgeCheck,
  MapPin,
  Clock,
  Loader2,
  Navigation,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill, SectionTitle } from '@/components/ui/glass'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Avatar } from '@/components/avatar'
import { FeedbackPrompt } from '@/components/feedback-prompt'
import { useOnlineStatus } from '@/components/online-status'
import { marketPrices, messages } from '@/lib/data'
import { getSession, type SessionUser } from '@/lib/auth'
import { getListings, getMyListings, createListing, type Listing } from '@/lib/queries/listings'
import { getTransactions, expressInterest as expressInterestApi, advanceTransaction, declineTransaction, type Transaction, type TransactionStatus } from '@/lib/queries/transactions'
import { getRegions, type Region } from '@/lib/queries/reference'
import { useLocale } from '@/lib/i18n/context'

const statusTone: Record<TransactionStatus, 'accent' | 'lime' | 'muted'> = {
  Interested: 'accent',
  Negotiating: 'lime',
  Agreed: 'lime',
  Completed: 'muted',
}

const statusKey: Record<TransactionStatus, string> = {
  Interested: 'statusInterested',
  Negotiating: 'statusNegotiating',
  Agreed: 'statusAgreed',
  Completed: 'statusCompleted',
}

const nextStatus: Partial<Record<TransactionStatus, TransactionStatus>> = {
  Interested: 'Negotiating',
  Negotiating: 'Agreed',
  Agreed: 'Completed',
}

const nextActionKey: Partial<Record<TransactionStatus, string>> = {
  Interested: 'accept',
  Negotiating: 'markAgreed',
  Agreed: 'markCompleted',
}

export default function MarketplacePage() {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    setUser(getSession())
  }, [])

  return <AppShell>{user?.role === 'buyer' ? <BuyerMarketplace user={user} /> : <FarmerMarketplace user={user} />}</AppShell>
}

// ---------------- Buyer: browse / search / filter ----------------

type Inquiry = { id: string; crop: string; farmerName: string; time: string; synced: boolean }

function BuyerMarketplace({ user }: { user: SessionUser | null }) {
  const { t } = useLocale()
  const online = useOnlineStatus()
  const [listings, setListings] = useState<Listing[]>([])
  const [regionOptions, setRegionOptions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [regionId, setRegionId] = useState<string>('all')
  const [sortByDistance, setSortByDistance] = useState(false)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])

  const hasLocation = !!(user?.latitude && user?.longitude)

  useEffect(() => {
    getRegions().then(setRegionOptions).catch(() => setRegionOptions([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    getListings(sortByDistance && hasLocation ? { sort: 'distance' } : {})
      .then(setListings)
      .finally(() => setLoading(false))
  }, [sortByDistance, hasLocation])

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesQuery = query.trim()
        ? l.crop.toLowerCase().includes(query.toLowerCase()) || l.farmer?.name.toLowerCase().includes(query.toLowerCase())
        : true
      const matchesRegion = regionId === 'all' ? true : l.regionId === regionId
      return matchesQuery && matchesRegion
    })
  }, [listings, query, regionId])

  async function expressInterest(listing: Listing) {
    const farmerName = listing.farmer?.name ?? 'Farmer'
    const { queued } = await expressInterestApi({
      listingId: listing.id,
      quantity: listing.quantity,
      totalPrice: Number(listing.price),
    })
    setInquiries((prev) => [
      { id: `INQ-${Date.now()}`, crop: listing.crop, farmerName, time: 'Just now', synced: !queued && online },
      ...prev,
    ])
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Store className="size-5" />
          <span className="text-sm font-semibold">{t('marketplace.buyerBadge')}</span>
        </div>
        <h1 className="mt-1 font-serif text-2xl italic font-semibold sm:text-3xl">{t('marketplace.buyerHeading')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('marketplace.buyerSubtitle')}</p>
      </div>

      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          wrapperClassName="flex-1"
          icon={<SearchIcon className="size-4" />}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('marketplace.searchPlaceholder')}
        />
        <Select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
          <option value="all">{t('marketplace.allRegions')}</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Button
          onClick={() => setSortByDistance((s) => !s)}
          disabled={!hasLocation}
          variant={sortByDistance ? 'tonal' : 'ghost'}
          size="sm"
          className={sortByDistance ? 'gap-1.5' : 'gap-1.5 bg-white/5'}
          title={hasLocation ? undefined : t('marketplace.nearestFirstHint')}
        >
          <Navigation className="size-3.5" /> {t('marketplace.nearestFirst')}
        </Button>
      </GlassCard>
      {!hasLocation && (
        <p className="-mt-2 text-xs text-muted-foreground">{t('marketplace.setLocationHint')}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <GlassCard key={l.id} className="overflow-hidden">
              <div className="relative h-32">
                <Image src={l.photoUrl || '/placeholder.svg'} alt={l.crop} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 to-transparent" />
                {l.grade && (
                  <Pill tone="lime" className="absolute bottom-3 left-4">
                    {t('marketplace.gradeLabel', { grade: l.grade })}
                  </Pill>
                )}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{l.crop}</h3>
                <div className="flex items-center gap-1.5">
                  <Avatar name={l.farmer?.name ?? 'Farmer'} size={18} className="text-[9px]" />
                  <p className="text-xs text-muted-foreground">{l.farmer?.name ?? 'Farmer'}</p>
                </div>
                {(l.farmer?.locationLabel || l.distanceKm != null) && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" />
                    {l.farmer?.locationLabel}
                    {l.distanceKm != null && (
                      <span className="text-accent">· {t('marketplace.kmAway', { km: Math.round(l.distanceKm) })}</span>
                    )}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="size-3" /> {l.quantity}
                  </span>
                  <span className="text-lg font-bold">
                    ${Number(l.price).toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground">{l.unit}</span>
                  </span>
                </div>
                <Button onClick={() => expressInterest(l)} variant="tonal" size="sm" className="mt-1 w-full">
                  {t('marketplace.expressInterest')}
                </Button>
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {t('marketplace.noListingsMatch')}
            </p>
          )}
        </div>
      )}

      {inquiries.length > 0 && (
        <section>
          <SectionTitle title={t('marketplace.yourInquiries')} />
          <GlassCard className="divide-y divide-border">
            {inquiries.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">
                    {i.crop} — {i.farmerName}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {i.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!i.synced && <Pill tone="muted">{t('common.queuedWillSync')}</Pill>}
                  <Pill tone={statusTone.Interested}>{t(`common.${statusKey.Interested}`)}</Pill>
                </div>
              </div>
            ))}
          </GlassCard>
          <div className="mt-4 max-w-md">
            <FeedbackPrompt
              triggerContext="post_contact"
              prompt={t('marketplace.feedbackPostContact')}
            />
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------- Farmer: sell / manage orders ----------------

function FarmerMarketplace({ user }: { user: SessionUser | null }) {
  const { t } = useLocale()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [crop, setCrop] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [addedListing, setAddedListing] = useState(false)

  useEffect(() => {
    Promise.all([getMyListings(), getTransactions()])
      .then(([l, txs]) => {
        setListings(l)
        setOrders(txs)
      })
      .finally(() => setLoading(false))
  }, [])

  async function addListing() {
    if (!crop.trim() || !quantity.trim() || !price.trim() || !user) return
    const listing = await createListing(
      { crop: crop.trim(), quantity: quantity.trim(), unit: '/ton', price: Number(price) || 0, grade: 'A' },
      user,
    )
    setListings((prev) => [listing, ...prev])
    setCrop('')
    setQuantity('')
    setPrice('')
    setShowForm(false)
    setAddedListing(true)
  }

  async function advanceOrder(id: string) {
    const current = orders.find((o) => o.id === id)
    const next = current && nextStatus[current.status]
    if (!next) return
    const { transaction } = await advanceTransaction(id, next)
    setOrders((prev) => prev.map((o) => (o.id === id ? transaction : o)))
  }

  async function declineOrder(id: string) {
    await declineTransaction(id)
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Store className="size-5" />
            <span className="text-sm font-semibold">{t('marketplace.farmerBadge')}</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl italic font-semibold sm:text-3xl">{t('marketplace.farmerHeading')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('marketplace.farmerSubtitle')}</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="sm" className="gap-1.5">
          <Plus className="size-4" /> {t('marketplace.newListing')}
        </Button>
      </div>

      {showForm && (
        <GlassCard className="grid gap-3 p-5 sm:grid-cols-4">
          <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder={t('marketplace.cropPlaceholder')} />
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={t('marketplace.quantityPlaceholder')} />
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t('marketplace.pricePlaceholder')}
            type="number"
          />
          <Button onClick={addListing} size="sm">
            {t('marketplace.publishListing')}
          </Button>
        </GlassCard>
      )}

      {addedListing && (
        <div className="max-w-md">
          <FeedbackPrompt
            triggerContext="post_listing"
            prompt={t('marketplace.feedbackPostListing')}
          />
        </div>
      )}

      {/* Market prices ticker */}
      <GlassCard className="p-5">
        <SectionTitle title={t('dashboard.liveMarketPrices')} action={<Pill tone="muted">{t('dashboard.regionalBenchmark')}</Pill>} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {marketPrices.map((m) => {
            const up = m.change >= 0
            return (
              <div key={m.crop} className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-muted-foreground">{m.crop}</p>
                <p className="mt-1 text-xl font-bold">${m.price}</p>
                <p
                  className={`mt-0.5 flex items-center gap-0.5 text-xs ${up ? 'text-primary' : 'text-destructive'}`}
                >
                  {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {up ? '+' : ''}
                  {m.change}%
                </p>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Listings */}
          <div className="lg:col-span-2">
            <SectionTitle
              title={t('marketplace.yourListings')}
              action={<span className="text-xs text-muted-foreground">{t('marketplace.activeCount', { count: listings.length })}</span>}
            />
            <div className="space-y-4">
              {listings.map((l) => {
                const marketPrice = l.marketPrice != null ? Number(l.marketPrice) : null
                const above = marketPrice != null ? Number(l.price) >= marketPrice : null
                return (
                  <GlassCard key={l.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="relative size-full h-32 shrink-0 overflow-hidden rounded-2xl sm:size-24">
                      <Image src={l.photoUrl || '/placeholder.svg'} alt={l.crop} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{l.crop}</h3>
                        {l.grade && <Pill tone="lime">{t('marketplace.gradeLabel', { grade: l.grade })}</Pill>}
                        {l._pendingSync && <Pill tone="muted">{t('common.queuedWillSync')}</Pill>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="size-3" /> {l.quantity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" /> {t('marketplace.viewsCount', { count: l.views })}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold">
                          ${Number(l.price).toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">{l.unit}</span>
                        </span>
                        {above != null && (
                          <span
                            className={`flex items-center gap-0.5 text-[11px] ${above ? 'text-primary' : 'text-accent'}`}
                          >
                            {above ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {t(above ? 'marketplace.aboveMarket' : 'marketplace.belowMarket', { price: marketPrice ?? 0 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button variant="tonal" size="sm" className="flex-1">
                        {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 bg-white/5">
                        {t('common.boost')}
                      </Button>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>

          {/* Sidebar: profile + messages */}
          <div className="space-y-5">
            {/* Trust profile */}
            <GlassCard className="p-5">
              <SectionTitle title={t('marketplace.sellerReputation')} />
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? 'Farmer'} size={48} className="text-base" />
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    {user?.farmName ?? user?.name}
                    {user?.verified && <BadgeCheck className="size-4 text-primary" />}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-accent text-accent" />
                    {user?.rating
                      ? t('marketplace.ratingWithReviews', { rating: user.rating, count: user.reviewCount })
                      : t('marketplace.noRatingsYet')}
                  </p>
                </div>
              </div>
              {(user?.certifications?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {user!.certifications.map((c) => (
                    <Pill key={c} tone="accent">{c}</Pill>
                  ))}
                  {user?.createdAt && (
                    <Pill tone="muted">{t('common.memberSince', { year: new Date(user.createdAt).getFullYear() })}</Pill>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Messages */}
            <GlassCard className="p-5">
              <SectionTitle
                title={t('marketplace.buyerMessages')}
                action={
                  <div className="flex items-center gap-1.5">
                    <Pill tone="muted">{t('common.sampleData')}</Pill>
                    <MessageSquare className="size-4 text-muted-foreground" />
                  </div>
                }
              />
              <div className="space-y-2.5">
                {messages.map((m) => (
                  <div key={m.from} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{m.from}</p>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {m.unread && <span className="size-1.5 rounded-full bg-primary" />}
                        {m.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Orders */}
      <section>
        <SectionTitle
          title={t('marketplace.orderManagement')}
          action={<span className="text-xs text-muted-foreground">{t('marketplace.simulatedTracking')}</span>}
        />
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t('marketplace.tableOrder')}</th>
                  <th className="px-5 py-3 font-medium">{t('marketplace.tableBuyer')}</th>
                  <th className="px-5 py-3 font-medium">{t('marketplace.tableProduce')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.tableTotal')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.tableStatus')}</th>
                  <th className="px-5 py-3 font-medium">{t('marketplace.tableAction')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-medium">{o.id.slice(0, 8).toUpperCase()}</span>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Avatar name={o.buyer?.name ?? 'Buyer'} size={20} className="text-[9px]" />
                        {o.buyer?.name ?? 'Buyer'}
                      </p>
                      <p className="text-xs text-muted-foreground">{o.buyer?.farmName}</p>
                    </td>
                    <td className="px-5 py-3">
                      {o.listing?.crop}
                      <p className="text-xs text-muted-foreground">{o.quantity}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">${Number(o.totalPrice).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Pill tone={statusTone[o.status]}>{t(`common.${statusKey[o.status]}`)}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        {nextActionKey[o.status] && (
                          <button
                            onClick={() => advanceOrder(o.id)}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                          >
                            {t(`common.${nextActionKey[o.status]}`)}
                          </button>
                        )}
                        {o.status === 'Interested' && (
                          <button
                            onClick={() => declineOrder(o.id)}
                            className="rounded-lg bg-white/5 px-3 py-1 text-xs font-medium"
                          >
                            {t('common.decline')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  )
}
