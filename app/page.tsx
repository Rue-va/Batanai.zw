'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Sprout,
  WifiOff,
  Store,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  Leaf,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Pill } from '@/components/ui/glass'
import { buttonClasses } from '@/components/ui/button'

type Lang = 'en' | 'sh'

const copy = {
  en: {
    heroKicker: 'Built for Zimbabwe’s smallholder farmers',
    heroTitle: ['Grow with confidence.', 'Trade with trust.'],
    heroSub:
      'Batanai.zw is an offline-first marketplace connecting Zimbabwean farmers and buyers directly — list produce, get rule-based crop guidance, and trade with transparent pricing, even without signal.',
    getStarted: 'Get Started',
    signIn: 'Sign In',
    howItWorks: 'See how it works',
  },
  sh: {
    heroKicker: 'Yakagadzirirwa varimi vaZimbabwe',
    heroTitle: ['Kura nechivimbo.', 'Tengesa nekuvimbana.'],
    heroSub:
      'Batanai.zw isarketi inoshanda kunyangwe pasina network, inobatanidza varimi nevatengi zvakananga — nyoresa zvaunotengesa, uwane mazano ekurima, uye utengeserane nemitengo iri pachena.',
    getStarted: 'Tanga',
    signIn: 'Pinda',
    howItWorks: 'Ona mashandiro',
  },
}

export default function MarketingHome() {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem('batanai.lang')
    if (saved === 'en' || saved === 'sh') setLang(saved)
  }, [])

  function changeLang(next: Lang) {
    setLang(next)
    window.localStorage.setItem('batanai.lang', next)
  }

  const t = copy[lang]

  return (
    <div className="min-h-screen">
      <Nav lang={lang} onLangChange={changeLang} t={t} />
      <Hero t={t} />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Mission />
      <Community />
      <CtaBanner t={t} />
      <Footer />
    </div>
  )
}

function Nav({
  lang,
  onLangChange,
  t,
}: {
  lang: Lang
  onLangChange: (l: Lang) => void
  t: (typeof copy)['en']
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-serif text-base italic font-semibold tracking-tight">Batanai.zw</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#impact" className="transition-colors hover:text-foreground">Impact</a>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="glass hidden gap-1 rounded-full p-1 text-xs font-semibold sm:flex">
            {(['en', 'sh'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t.signIn}
          </Link>
          <Link href="/login" className={buttonClasses('primary', 'sm', 'gap-1.5')}>
            {t.getStarted}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero({ t }: { t: (typeof copy)['en'] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/marketing-hero.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
        <div className="max-w-xl">
          <Pill tone="lime">{t.heroKicker}</Pill>
          <h1 className="mt-5 text-balance font-serif text-4xl italic font-semibold leading-tight sm:text-5xl">
            {t.heroTitle[0]}
            <br />
            {t.heroTitle[1]}
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
            {t.heroSub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className={buttonClasses('primary', 'lg', 'gap-2')}>
              {t.getStarted}
              <ArrowRight className="size-4" />
            </Link>
            <a href="#how-it-works" className={buttonClasses('glass', 'lg', 'gap-2')}>
              {t.howItWorks}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Pill tone="muted"><WifiOff className="size-3" /> Works offline</Pill>
            <Pill tone="muted"><Store className="size-3" /> No middlemen</Pill>
            <Pill tone="muted"><Sprout className="size-3" /> Rule-based guidance</Pill>
          </div>
        </div>
      </div>
    </section>
  )
}

const stats = [
  { value: '70%+', label: 'of Zimbabwean farmers are smallholders' },
  { value: '1.8 ha', label: 'average smallholder landholding' },
  { value: '$380/t', label: 'GMB maize benchmark, 2025/26' },
  { value: '4', label: 'provinces covered at launch' },
]

function StatsBar() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground/70">
          Sources: World Bank / ZIMSTAT Smallholder Agricultural Productivity Survey; Zimbabwe
          Grain Marketing Board 2025/26 producer prices.
        </p>
      </div>
    </section>
  )
}

const farmerFeatures = [
  { icon: Sprout, title: 'Rule-based crop guidance', text: 'Crop, region, and season lookup sourced from agronomic reference material — not a black-box model.' },
  { icon: WifiOff, title: 'Works offline', text: 'List produce and keep working with no signal. Changes queue and sync automatically once you’re back online.' },
  { icon: Store, title: 'Sell direct', text: 'Transparent regional pricing and verified buyers — connect directly, no middlemen taking a cut.' },
  { icon: ClipboardCheck, title: 'Track every trade', text: 'A clear pipeline from Interested through Negotiating, Agreed, and Completed for every listing.' },
]

const buyerFeatures = [
  { icon: MapPin, title: 'Browse by region', text: 'Search and filter listings from farmers across Mashonaland, Manicaland, Matabeleland, and Masvingo.' },
  { icon: ShieldCheck, title: 'Verified farmers', text: 'Ratings, reviews, and credentials like Master Farmer and AGRITEX registration you can check before you trade.' },
  { icon: MessageCircle, title: 'Connect directly', text: 'Express interest and message farmers yourself — no broker in the middle of your conversation.' },
  { icon: TrendingUp, title: 'Live market prices', text: 'Regional benchmark pricing for staple crops, so both sides negotiate from the same information.' },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl italic font-semibold text-balance sm:text-4xl">One marketplace, built for both sides of the trade</h2>
        <p className="mt-3 text-muted-foreground">
          Everything below is a real, working part of Batanai.zw today — not a roadmap.
        </p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <FeatureColumn title="For Farmers" items={farmerFeatures} image="/marketing-produce.jpg" imageAlt="Farmer holding a crate of freshly harvested tomatoes" />
        <FeatureColumn title="For Buyers" items={buyerFeatures} />
      </div>
    </section>
  )
}

function FeatureColumn({
  title,
  items,
  image,
  imageAlt,
}: {
  title: string
  items: { icon: typeof Sprout; title: string; text: string }[]
  image?: string
  imageAlt?: string
}) {
  return (
    <div>
      <h3 className="mb-5 text-lg font-semibold text-primary">{title}</h3>
      {image && (
        <div className="relative mb-5 h-44 overflow-hidden rounded-3xl">
          <Image src={image} alt={imageAlt ?? ''} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}
      <div className="space-y-4">
        {items.map((f) => (
          <div key={f.title} className="glass flex gap-4 rounded-2xl p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <f.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const steps = [
  { n: '01', title: 'Sign up', text: 'Create an account as a Farmer or a Buyer — the app adapts to whichever you pick.' },
  { n: '02', title: 'List or browse', text: 'Farmers publish crop, quantity, price, and location. Buyers search and filter by region.' },
  { n: '03', title: 'Connect directly', text: 'Express interest, message each other, and negotiate — no middlemen in between.' },
  { n: '04', title: 'Trade, tracked', text: 'Follow every deal from Interested to Completed, with pricing both sides can see.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white/[0.02] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl italic font-semibold text-balance sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Four steps from sign-up to a completed trade.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="glass rounded-3xl p-6">
              <p className="text-3xl font-bold text-primary/40">{s.n}</p>
              <p className="mt-3 text-sm font-semibold">{s.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Mission() {
  return (
    <section id="impact" className="relative scroll-mt-20 overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/marketing-mission.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Leaf className="size-6" />
        </div>
        <h2 className="mt-5 font-serif text-3xl italic font-semibold text-balance sm:text-4xl">
          Built to strengthen Zimbabwe&apos;s food system
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Smallholder farmers grow most of what Zimbabwe eats, often on less than two hectares
          and without reliable connectivity or market information. Batanai.zw is a research
          prototype built around that reality — offline-first, rule-based rather than a black
          box, and focused on cutting out the middlemen who capture value farmers and buyers
          could keep for themselves.
        </p>
      </div>
    </section>
  )
}

function Community() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="relative h-72 overflow-hidden rounded-3xl sm:h-96">
          <Image src="/marketing-tradition.jpg" alt="Farmers winnowing grain by hand" fill className="object-cover" />
        </div>
        <div className="relative h-72 overflow-hidden rounded-3xl sm:h-96">
          <Image src="/marketing-harvest.jpg" alt="Farmers with baskets of freshly harvested vegetables" fill className="object-cover" />
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-2xl text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Rural livelihoods in Zimbabwe run on knowledge passed between generations of farmers.
          Batanai.zw doesn&apos;t replace that — it adds a direct line to buyers and a rule-based
          reference table alongside it, built to work on the same patchy signal farmers already
          deal with every season.
        </p>
      </div>
    </section>
  )
}

function CtaBanner({ t }: { t: (typeof copy)['en'] }) {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
      <div className="glass-strong rounded-4xl px-6 py-14 text-center sm:px-14">
        <h2 className="font-serif text-3xl italic font-semibold text-balance sm:text-4xl">Ready to grow with confidence?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Join as a farmer or a buyer — it takes less than a minute to get started.
        </p>
        <Link href="/login" className={buttonClasses('primary', 'lg', 'mt-7 gap-2')}>
          {t.getStarted}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="font-serif text-base italic font-semibold tracking-tight">Batanai.zw</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              An offline-first marketplace and rule-based decision-support tool connecting
              Zimbabwean farmers and buyers directly.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a></li>
                <li><a href="#impact" className="transition-colors hover:text-foreground">Impact</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-foreground">Get started</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Batanai.zw. A research prototype built for a thesis on offline-first agricultural marketplaces in Zimbabwe.</p>
          <p className="italic">&ldquo;Mawoko mazhinji haatadzi basa&rdquo; — many hands make light work.</p>
        </div>
      </div>
    </footer>
  )
}
