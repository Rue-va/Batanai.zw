"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sprout,
  BarChart3,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { RoleIcon } from "@/components/role-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  register,
  login,
  validateEmail,
  hasOnboarded,
  setOnboarded,
  setResearchConsent,
  type Role,
} from "@/lib/auth"
import { ApiError } from "@/lib/api"

type Mode = "login" | "signup"
type Step = "splash" | "auth"
type Lang = "en" | "sh"

const copy = {
  en: {
    tagline: ["Grow with confidence.", "Trade with trust."],
    cta: "Get started",
    tabs: { login: "Sign In", signup: "Sign Up" },
    heading: { login: "Welcome back", signup: "Create your account" },
    subheading: {
      login: "Sign in to manage your farm and listings.",
      signup: "Join farmers and buyers trading smarter with Batanai.zw.",
    },
    iAmA: "I am a...",
    farmer: "Farmer",
    buyer: "Buyer",
    submit: { login: "Sign In", signup: "Create Account" },
    submitLoading: { login: "Signing in...", signup: "Creating account..." },
    switchPrompt: { login: "New to Batanai.zw? ", signup: "Already have an account? " },
    switchAction: { login: "Create an account", signup: "Sign in" },
  },
  sh: {
    tagline: ["Kura nechivimbo.", "Tengesa nekuvimbana."],
    cta: "Tanga",
    tabs: { login: "Pinda", signup: "Nyoresa" },
    heading: { login: "Tinokuseva", signup: "Gadzira account yako" },
    subheading: {
      login: "Pinda kuti utarisire purazi rako nezvinhu zvaunotengesa.",
      signup: "Batana nevarimi nevatengi vari kutengeserana nenzira yakachenjera.",
    },
    iAmA: "Ndiri...",
    farmer: "Murimi",
    buyer: "Mutengi",
    submit: { login: "Pinda", signup: "Gadzira Account" },
    submitLoading: { login: "Kupinda...", signup: "Kugadzira account..." },
    switchPrompt: { login: "Mutsva ku Batanai.zw? ", signup: "Une account here? " },
    switchAction: { login: "Gadzira account", signup: "Pinda" },
  },
}

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("splash")
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    if (hasOnboarded()) setStep("auth")
    const savedLang = window.localStorage.getItem("batanai.lang")
    if (savedLang === "en" || savedLang === "sh") setLang(savedLang)
  }, [])

  function handleGetStarted() {
    setOnboarded()
    setStep("auth")
  }

  function handleLangChange(next: Lang) {
    setLang(next)
    window.localStorage.setItem("batanai.lang", next)
  }

  if (step === "splash") {
    return (
      <SplashScreen
        lang={lang}
        onLangChange={handleLangChange}
        onGetStarted={handleGetStarted}
      />
    )
  }

  return <AuthForm router={router} lang={lang} onLangChange={handleLangChange} />
}

function SplashScreen({
  lang,
  onLangChange,
  onGetStarted,
}: {
  lang: Lang
  onLangChange: (lang: Lang) => void
  onGetStarted: () => void
}) {
  const t = copy[lang]
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/onboarding-hero.jpg" alt="" fill priority className="object-cover grayscale" />
      <div className="absolute inset-0 bg-primary/35 mix-blend-color" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex justify-end p-5 sm:p-6">
          <div className="glass-strong flex gap-1 rounded-full p-1 text-sm font-semibold">
            {(["en", "sh"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLangChange(l)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-6 px-6 pb-10 sm:px-10 sm:pb-14">
          <div>
            <h1 className="max-w-md text-balance font-serif text-3xl italic font-semibold leading-tight sm:text-4xl">
              {t.tagline[0]}
              <br />
              {t.tagline[1]}
            </h1>
            <p className="mt-4 max-w-sm border-l-2 border-primary pl-3 text-sm italic text-foreground/85">
              &ldquo;Mawoko mazhinji haatadzi basa&rdquo;
            </p>
          </div>
          <Button onClick={onGetStarted} size="lg" className="w-full sm:w-auto sm:px-8">
            {t.cta}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function AuthForm({
  router,
  lang,
  onLangChange,
}: {
  router: ReturnType<typeof useRouter>
  lang: Lang
  onLangChange: (lang: Lang) => void
}) {
  const t = copy[lang]
  const [mode, setMode] = useState<Mode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [farmName, setFarmName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("farmer")
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const next: Record<string, string> = {}
    if (mode === "signup") {
      if (name.trim().length < 2) next.name = "Enter your full name."
      if (farmName.trim().length < 2)
        next.farmName = role === "buyer" ? "Enter your business name." : "Enter your farm name."
      if (!consent) next.consent = "Consent is required to continue."
    }
    if (!validateEmail(email)) next.email = "Enter a valid email address."
    if (password.length < 8) next.password = "Password must be at least 8 characters."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === "signup") {
        await register({ name: name.trim(), email, password, role, farmName: farmName.trim() })
        if (consent) setResearchConsent()
      } else {
        await login({ email, password })
      }
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection and try again."
      setErrors((prev) => ({ ...prev, form: message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="glass-strong grid w-full max-w-5xl overflow-hidden rounded-4xl lg:grid-cols-2">
        {/* Brand / imagery panel */}
        <aside className="relative hidden min-h-[640px] lg:block">
          <Image
            src="/farmer-garden.jpg"
            alt="Farmer harvesting vegetables from her garden"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
          <div className="relative flex h-full flex-col justify-between p-8">
            <div className="flex items-center gap-2.5">
              <Logo size={36} />
              <span className="font-serif text-lg italic font-semibold tracking-tight">Batanai.zw</span>
            </div>

            <div className="space-y-6">
              <h2 className="max-w-sm text-pretty font-serif text-2xl italic font-semibold leading-snug">
                Grow with confidence. Trade with trust.
              </h2>
              <ul className="space-y-3 text-sm text-foreground/85">
                <FeatureRow icon={<Sprout className="size-4" />} text="Rule-based crop & planting guidance" />
                <FeatureRow icon={<BarChart3 className="size-4" />} text="Works offline, syncs when you're back online" />
                <FeatureRow icon={<ShieldCheck className="size-4" />} text="Transparent marketplace, no middlemen" />
              </ul>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <section className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Logo size={36} className="lg:hidden" />
              <span className="font-serif text-lg italic font-semibold tracking-tight lg:hidden">Batanai.zw</span>
            </div>
            <div className="glass ml-auto flex gap-1 rounded-full p-1 text-xs font-semibold">
              {(["en", "sh"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLangChange(l)}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    lang === l
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h1 className="font-serif text-2xl italic font-semibold tracking-tight">{t.heading[mode]}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.subheading[mode]}</p>
          </div>

          {/* Mode toggle */}
          <div className="glass mb-6 grid grid-cols-2 rounded-full p-1 text-sm font-medium">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setErrors({})
                }}
                className={`rounded-full py-2 transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabs[m]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">{t.iAmA}</label>
              <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
                {(
                  [
                    { value: "farmer", label: t.farmer },
                    { value: "buyer", label: t.buyer },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      role === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <RoleIcon role={opt.value} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "signup" && (
              <>
                <Field
                  id="name"
                  label="Full name"
                  icon={<User className="size-4" />}
                  placeholder="Tendai Moyo"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                />
                <Field
                  id="farmName"
                  label={role === "buyer" ? "Business name" : "Farm name"}
                  icon={<Sprout className="size-4" />}
                  placeholder={role === "buyer" ? "FreshPack Processors" : "Chinhoyi Family Farm"}
                  value={farmName}
                  onChange={setFarmName}
                  error={errors.farmName}
                />
              </>
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              icon={<Mail className="size-4" />}
              placeholder="you@farm.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/90">
                Password
              </label>
              <div
                className={`glass flex items-center gap-2.5 rounded-2xl px-4 py-3 ${
                  errors.password ? "ring-1 ring-destructive/60" : ""
                }`}
              >
                <Lock className="size-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>}
            </div>

            {mode === "signup" && (
              <div>
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  I agree that anonymized usage data and ratings may be used for academic
                  research. Participation is voluntary and I can stop at any time.
                </label>
                {errors.consent && <p className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="size-4 accent-primary" defaultChecked />
                  Remember me
                </label>
                <button type="button" className="font-medium text-accent hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t.submitLoading[mode]}
                </>
              ) : (
                <>
                  {t.submit[mode]}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.switchPrompt[mode]}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setErrors({})
              }}
              className="font-semibold text-accent hover:underline"
            >
              {t.switchAction[mode]}
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      {text}
    </li>
  )
}

function Field({
  id,
  label,
  icon,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string
  label: string
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground/90">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        icon={icon}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
