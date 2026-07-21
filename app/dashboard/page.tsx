'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Layers,
  Map,
  Sprout,
  ListChecks,
  Cloud,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  MapPin,
  Droplet,
  FlaskConical,
  Bug,
  ArrowUpRight,
  ChevronRight,
  Handshake,
  CheckCircle2,
  Users,
  Wallet,
  Star,
  BadgeCheck,
  CalendarClock,
  FileText,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill, SectionTitle } from '@/components/ui/glass'
import { RadialGauge } from '@/components/radial-gauge'
import { YieldBars, DonutChart } from '@/components/charts'
import { getSession, type SessionUser } from '@/lib/auth'
import {
  farmer,
  kpis,
  weather,
  nationalMaizeYield,
  cropDistribution,
  tasks,
  soilTest,
  buyerStats,
  sourcingRegions,
  recentTrades,
  marketPrices,
} from '@/lib/data'

const kpiIcons = { layers: Layers, map: Map, sprout: Sprout, tasks: ListChecks }
const forecastIcons = { sun: Sun, cloud: Cloud, rain: CloudRain }
const taskIcons = { water: Droplet, fertilize: FlaskConical, scan: Bug, soil: Sprout }
const tradeStatusTone = { Interested: 'accent', Negotiating: 'lime', Agreed: 'lime', Completed: 'muted' } as const

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    setUser(getSession())
  }, [])

  return <AppShell>{user?.role === 'buyer' ? <BuyerDashboard user={user} /> : <FarmerDashboard user={user} />}</AppShell>
}

function FarmerDashboard({ user }: { user: SessionUser | null }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Welcome hero */}
      <GlassCard className="relative overflow-hidden">
        <Image
          src="/field-hero.png"
          alt="Aerial view of green farmland"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/60 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-serif text-2xl italic font-semibold text-balance sm:text-3xl">
              {user?.name ?? farmer.name}&apos;s Farm Overview
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="lime">
                <MapPin className="size-3" />
                {farmer.location}
              </Pill>
              <Pill tone="accent">Rating {farmer.rating} ★</Pill>
              <Pill tone="muted">{farmer.certifications[0]}</Pill>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CalendarClock className="size-7" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-primary">
                {tasks.filter((t) => t.status === 'due').length} task due today
              </p>
              <p className="text-muted-foreground">{tasks.length} recommended actions this week</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpiIcons[kpi.icon as keyof typeof kpiIcons]
          return (
            <GlassCard key={kpi.label} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <Pill tone="lime">
                  <ArrowUpRight className="size-3" />
                  {kpi.trend}
                </Pill>
              </div>
              <p className="text-2xl font-bold">
                {kpi.value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {kpi.unit}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
            </GlassCard>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Plot map */}
        <GlassCard className="relative overflow-hidden lg:col-span-2">
          <div className="relative h-64 w-full sm:h-80">
            <Image
              src="/field-hero.png"
              alt="Plot map"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-forest-950/25" />
            {/* plot markers */}
            <FieldMarker top="28%" left="24%" tone="good" label="Maize plot" />
            <FieldMarker top="55%" left="52%" tone="warn" label="Potato bed" />
            <FieldMarker top="40%" left="74%" tone="good" label="Groundnut plot" />
            <div className="glass-strong absolute left-4 top-4 rounded-2xl px-4 py-3">
              <p className="text-xs text-muted-foreground">Your Plots</p>
              <p className="text-lg font-bold text-primary">3 active</p>
            </div>
            <div className="glass-strong absolute bottom-4 right-4 flex gap-4 rounded-2xl px-4 py-2.5 text-xs">
              <Legend color="var(--chart-1)" label="No active alerts" />
              <Legend color="var(--accent)" label="Pest/disease alert" />
            </div>
          </div>
        </GlassCard>

        {/* Weather */}
        <GlassCard className="p-6">
          <SectionTitle title="Weather Today" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{weather.temp}°C</p>
              <p className="text-sm text-muted-foreground">{weather.condition}</p>
              <p className="text-xs text-muted-foreground">{weather.location}</p>
            </div>
            <Cloud className="size-14 text-accent" />
          </div>
          <div className="my-4 grid grid-cols-3 gap-2 text-center">
            <WeatherStat icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
            <WeatherStat icon={Wind} label="Wind" value={`${weather.wind} km/h`} />
            <WeatherStat icon={CloudRain} label="Rain" value={`${weather.rainChance}%`} />
          </div>
          <div className="flex justify-between border-t border-border pt-4">
            {weather.forecast.map((f) => {
              const Icon = forecastIcons[f.icon as keyof typeof forecastIcons]
              return (
                <div key={f.day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{f.day}</span>
                  <Icon className="size-4 text-accent" />
                  <span className="text-xs font-medium">{f.temp}°</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* National maize yield trend */}
        <GlassCard className="p-6 lg:col-span-2">
          <SectionTitle
            title="National Maize Yield Trend"
            action={<Pill tone="muted">tonnes/hectare</Pill>}
          />
          <YieldBars data={nationalMaizeYield} />
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            National average yield by season — use this to see how your own harvest compares to
            the country trend. 2023/24&apos;s drop reflects the El Niño drought. Source: Zimbabwe
            Ministry of Agriculture / USDA FAS Grain &amp; Feed Annual reporting.
          </p>
        </GlassCard>

        {/* Crop distribution */}
        <GlassCard className="p-6">
          <SectionTitle title="Crop Distribution" />
          <DonutChart data={cropDistribution} />
          <div className="mt-3 space-y-1.5">
            {cropDistribution.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="font-medium">{c.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <GlassCard className="p-6">
          <SectionTitle
            title="Upcoming Tasks"
            action={
              <button className="flex items-center gap-0.5 text-xs text-accent hover:underline">
                View all <ChevronRight className="size-3" />
              </button>
            }
          />
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const Icon = taskIcons[task.kind as keyof typeof taskIcons]
              return (
                <div
                  key={task.title}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.time}</p>
                  </div>
                  <Pill tone={task.status === 'due' ? 'accent' : 'muted'}>
                    {task.status === 'due' ? 'Due' : 'Upcoming'}
                  </Pill>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Soil test */}
        <GlassCard className="p-6">
          <SectionTitle title="Latest Soil Test" action={<Pill tone="muted">{soilTest.sampledDate}</Pill>} />
          <div className="space-y-3">
            {soilTest.results.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <Pill tone="accent">{s.band}</Pill>
                  <span className="text-[10px] text-muted-foreground">{s.threshold}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <FileText className="mt-0.5 size-3 shrink-0" />
            From {soilTest.source}. Bands follow FAO / Zimbabwe Ministry of Agriculture soil
            fertility sufficiency ranges — not a live sensor reading.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}

function BuyerDashboard({ user }: { user: SessionUser | null }) {
  // Calculated, not fabricated: completed trades as a share of all trades
  // ever opened (completed + still-active inquiries).
  const totalTrades = buyerStats.completedTrades + buyerStats.activeInquiries
  const completionRate = Math.round((buyerStats.completedTrades / totalTrades) * 100)

  const buyerKpis = [
    { label: 'Active Inquiries', value: String(buyerStats.activeInquiries), unit: 'open', icon: Handshake },
    { label: 'Completed Trades', value: String(buyerStats.completedTrades), unit: 'total', icon: CheckCircle2 },
    { label: 'Verified Farmers', value: String(buyerStats.verifiedFarmers), unit: 'followed', icon: Users },
    { label: 'This Month', value: `$${buyerStats.monthlySpend.toLocaleString()}`, unit: 'spend', icon: Wallet },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Welcome hero */}
      <GlassCard className="relative overflow-hidden">
        <Image
          src="/field-hero.png"
          alt="Aerial view of green farmland"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/60 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-serif text-2xl italic font-semibold text-balance sm:text-3xl">
              {user?.farmName ?? 'Your business'}&apos;s Sourcing Overview
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="lime">
                <BadgeCheck className="size-3" />
                Verified Buyer
              </Pill>
              <Pill tone="accent">{buyerStats.activeInquiries} active inquiries</Pill>
              <Pill tone="muted">{buyerStats.verifiedFarmers} farmers followed</Pill>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
            <RadialGauge value={completionRate} sublabel="Completed" label={`${completionRate}%`} />
            <div className="text-sm">
              <p className="font-semibold text-primary">Trade completion rate</p>
              <p className="text-muted-foreground">
                {buyerStats.completedTrades} of {totalTrades} trades opened have closed
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {buyerKpis.map((kpi) => (
          <GlassCard key={kpi.label} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <kpi.icon className="size-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {kpi.value}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{kpi.unit}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sourcing regions */}
        <GlassCard className="p-6">
          <SectionTitle title="Sourcing by Region" />
          <DonutChart data={sourcingRegions} />
          <div className="mt-3 space-y-1.5">
            {sourcingRegions.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </span>
                <span className="font-medium">{r.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Market prices */}
        <GlassCard className="p-6 lg:col-span-2">
          <SectionTitle title="Live Market Prices" action={<Pill tone="muted">Regional benchmark</Pill>} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketPrices.map((m) => {
              const up = m.change >= 0
              return (
                <div key={m.crop} className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">{m.crop}</p>
                  <p className="mt-1 text-xl font-bold">${m.price}</p>
                  <p className={`mt-0.5 flex items-center gap-0.5 text-xs ${up ? 'text-primary' : 'text-destructive'}`}>
                    <ArrowUpRight className="size-3" />
                    {up ? '+' : ''}
                    {m.change}%
                  </p>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* Recent trades */}
      <section>
        <SectionTitle
          title="Recent Activity"
          action={
            <a href="/marketplace" className="flex items-center gap-0.5 text-xs text-accent hover:underline">
              Browse more <ChevronRight className="size-3" />
            </a>
          }
        />
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Crop</th>
                  <th className="px-5 py-3 font-medium">Farmer</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t) => (
                  <tr key={`${t.crop}-${t.farmerName}`} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 font-medium">{t.crop}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-accent text-accent" />
                        {t.farmerName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{t.quantity}</td>
                    <td className="px-5 py-3 font-semibold">${t.total.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Pill tone={tradeStatusTone[t.status as keyof typeof tradeStatusTone]}>{t.status}</Pill>
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

function FieldMarker({
  top,
  left,
  tone,
  label,
}: {
  top: string
  left: string
  tone: 'good' | 'warn'
  label: string
}) {
  const color = tone === 'good' ? 'var(--chart-1)' : 'var(--accent)'
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top, left }}>
      <div className="flex flex-col items-center gap-1">
        <span
          className="size-3.5 rounded-full ring-4 ring-white/20"
          style={{ background: color }}
        />
        <span className="glass rounded-full px-2 py-0.5 text-[10px] font-medium">{label}</span>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function WeatherStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white/5 py-2">
      <Icon className="mx-auto mb-1 size-4 text-accent" />
      <p className="text-xs font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
