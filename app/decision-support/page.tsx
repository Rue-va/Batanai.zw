'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  BrainCircuit,
  Droplet,
  FlaskConical,
  Bug,
  Recycle,
  CalendarClock,
  ChevronRight,
  Sparkles,
  ScanLine,
  Loader2,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill, SectionTitle } from '@/components/ui/glass'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { FeedbackPrompt } from '@/components/feedback-prompt'
import { getSession } from '@/lib/auth'
import { useLocale } from '@/lib/i18n/context'
import { cropRecommendations, recommendations, scanResults } from '@/lib/data'
import { getAdvice, type AdviceRule, type Season } from '@/lib/queries/advice'
import { getRegions, getCrops, type Region, type Crop } from '@/lib/queries/reference'

const recIcons = {
  irrigation: Droplet,
  fertilizer: FlaskConical,
  pest: Bug,
  resource: Recycle,
}
const priorityTone = { high: 'danger', medium: 'accent', low: 'muted' } as const
const fitTone = { 'Great fit': 'lime', 'Good fit': 'accent' } as const

export default function DecisionSupportPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'buyer') {
      router.replace('/dashboard')
      return
    }
    setAllowed(true)
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
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="size-5" />
            <span className="text-sm font-semibold">{t('decisionSupport.badge')}</span>
          </div>
          <h1 className="font-serif text-2xl italic font-semibold text-balance sm:text-3xl">
            {t('decisionSupport.heading')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('decisionSupport.subtitle')}</p>
        </div>

        {/* Crop recommendation engine */}
        <section>
          <SectionTitle
            title={t('decisionSupport.cropSuggestions')}
            action={
              <div className="flex items-center gap-1.5">
                <Pill tone="muted">{t('decisionSupport.regionalReferenceGuide')}</Pill>
                <Pill tone="muted">{t('common.sampleData')}</Pill>
              </div>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {cropRecommendations.map((c) => (
              <GlassCard key={c.crop} className="overflow-hidden">
                <div className="relative h-32">
                  <Image src={c.image || '/placeholder.svg'} alt={c.crop} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <span className="text-lg font-bold">{c.crop}</span>
                    <Pill tone={fitTone[c.fit as keyof typeof fitTone] ?? 'muted'}>{c.fit}</Pill>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">{c.reason}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-accent">
                      <CalendarClock className="size-3.5" />
                      {c.window}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.typicalYield}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Rule-based advice lookup */}
          <div className="lg:col-span-2">
            <AdviceLookup />
          </div>

          {/* Plant scan result */}
          <PlantScan />
        </div>

        {/* Smart recommendations */}
        <section>
          <SectionTitle
            title={t('decisionSupport.recommendationsAlerts')}
            action={<Pill tone="muted">{t('common.sampleData')}</Pill>}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((r) => {
              const Icon = recIcons[r.kind as keyof typeof recIcons]
              return (
                <GlassCard key={r.title} className="flex gap-4 p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{r.title}</h3>
                      <Pill tone={priorityTone[r.priority as keyof typeof priorityTone]}>
                        {r.priority}
                      </Pill>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{r.detail}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                      <CheckCircle2 className="size-3.5" />
                      {r.saving}
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </section>

        {/* Weather advisory */}
        <GlassCard strong className="p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold">{t('decisionSupport.weatherAdvisory')}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('decisionSupport.weatherAdvisoryNote')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="accent">{t('decisionSupport.peakTemp')}</Pill>
            <Pill tone="lime">{t('decisionSupport.irrigateWindow')}</Pill>
            <Pill tone="muted">{t('decisionSupport.mulchPlots')}</Pill>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}

function AdviceLookup() {
  const { t } = useLocale()
  const SEASON_OPTIONS: { value: Season; label: string }[] = [
    { value: 'rainy', label: t('decisionSupport.seasonRainy') },
    { value: 'dry_winter', label: t('decisionSupport.seasonDryWinter') },
  ]
  const [crops, setCrops] = useState<Crop[]>([])
  const [regionOptions, setRegionOptions] = useState<Region[]>([])
  const [crop, setCrop] = useState('')
  const [region, setRegion] = useState('')
  const [season, setSeason] = useState<Season | ''>('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [rule, setRule] = useState<AdviceRule | null>(null)

  useEffect(() => {
    getCrops().then(setCrops).catch(() => setCrops([]))
    getRegions().then(setRegionOptions).catch(() => setRegionOptions([]))
  }, [])

  async function handleSearch() {
    if (!crop || !region || !season) return
    setLoading(true)
    try {
      const result = await getAdvice(crop, region, season)
      setRule(result)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle title={t('decisionSupport.adviceLookupTitle')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option value="">{t('decisionSupport.selectCrop')}</option>
          {crops.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">{t('decisionSupport.selectRegion')}</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select value={season} onChange={(e) => setSeason(e.target.value as Season)}>
          <option value="">{t('decisionSupport.selectSeason')}</option>
          {SEASON_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={handleSearch} disabled={!crop || !region || !season || loading} className="mt-3 w-full sm:w-auto sm:px-6">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} {t('decisionSupport.getGuidance')}
      </Button>

      {searched && !loading && (
        <div className="mt-5 space-y-4">
          {rule ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdviceBlock icon={CalendarClock} label={t('decisionSupport.planting')} text={rule.planting} />
                <AdviceBlock icon={Droplet} label={t('decisionSupport.watering')} text={rule.watering} />
                <AdviceBlock icon={FlaskConical} label={t('decisionSupport.fertilizer')} text={rule.fertilizer} />
                <AdviceBlock icon={Bug} label={t('decisionSupport.pestDisease')} text={rule.pest} />
              </div>
              <div className="max-w-md">
                <FeedbackPrompt
                  triggerContext="post_advice"
                  prompt={t('decisionSupport.feedbackPostAdvice')}
                />
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
              {t('decisionSupport.noGuidanceYet')}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  )
}

function AdviceBlock({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  text: string
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-primary">
        <Icon className="size-4" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

function PlantScan() {
  const { t } = useLocale()
  const [result, setResult] = useState(scanResults[0])
  const [photo, setPhoto] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(URL.createObjectURL(file))
    setScanning(true)
    setScanned(false)
    setTimeout(() => {
      setResult(scanResults[Math.floor(Math.random() * scanResults.length)])
      setScanning(false)
      setScanned(true)
    }, 1400)
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="relative h-40">
        <Image
          src={photo ?? '/plant-scan.png'}
          alt="Scanned plant leaf"
          fill
          unoptimized={!!photo}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/95 to-transparent" />
        <div className="glass-strong absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
          <ScanLine className="size-3.5 text-primary" />
          {scanning ? t('decisionSupport.analyzing') : t('decisionSupport.simulatedResult')}
        </div>
        <div className="absolute bottom-3 left-4">
          <p className="text-xs text-muted-foreground">{t('decisionSupport.scanResult')}</p>
          <p className="font-bold">{result.crop}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-[11px] text-muted-foreground">{t('decisionSupport.scanNote')}</p>

        {scanning ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> {t('decisionSupport.analyzingPhoto')}
          </div>
        ) : (
          result.issues.map((issue) => (
            <div key={issue.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{issue.name}</span>
                <Pill tone={issue.tone === 'warn' ? 'danger' : 'muted'}>{issue.severity}</Pill>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${issue.level}%`,
                    background: issue.tone === 'warn' ? 'var(--destructive)' : 'var(--accent)',
                  }}
                />
              </div>
            </div>
          ))
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button onClick={() => inputRef.current?.click()} disabled={scanning} size="sm" className="mt-1 w-full">
          {scanned ? t('decisionSupport.rescanPlant') : t('decisionSupport.scanPlantPhoto')}
        </Button>

        {scanned && (
          <FeedbackPrompt triggerContext="post_scan" prompt={t('decisionSupport.feedbackPostScan')} />
        )}
      </div>
    </GlassCard>
  )
}
