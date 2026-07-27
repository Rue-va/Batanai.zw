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
import { useLocale, type Locale } from "@/lib/i18n/context"

type Mode = "login" | "signup"
type Step = "splash" | "auth"

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("splash")

  useEffect(() => {
    if (hasOnboarded()) setStep("auth")
  }, [])

  function handleGetStarted() {
    setOnboarded()
    setStep("auth")
  }

  if (step === "splash") {
    return <SplashScreen onGetStarted={handleGetStarted} />
  }

  return <AuthForm router={router} />
}

function LangSwitch({ locale, setLocale, className }: { locale: Locale; setLocale: (l: Locale) => void; className: string }) {
  return (
    <div className={className}>
      {(["en", "sh"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-full px-4 py-1.5 transition-colors ${
            locale === l ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:text-foreground"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function SplashScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const { t, locale, setLocale } = useLocale()
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/onboarding-hero.jpg" alt="" fill priority className="object-cover grayscale" />
      <div className="absolute inset-0 bg-primary/35 mix-blend-color" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex justify-end p-5 sm:p-6">
          <LangSwitch locale={locale} setLocale={setLocale} className="glass-strong flex gap-1 rounded-full p-1 text-sm font-semibold" />
        </div>

        <div className="mt-auto space-y-6 px-6 pb-10 sm:px-10 sm:pb-14">
          <div>
            <h1 className="max-w-md text-balance font-serif text-3xl italic font-semibold leading-tight sm:text-4xl">
              {t("auth.tagline1")}
              <br />
              {t("auth.tagline2")}
            </h1>
            <p className="mt-4 max-w-sm border-l-2 border-primary pl-3 text-sm italic text-foreground/85">
              {t("auth.quote")}
            </p>
          </div>
          <Button onClick={onGetStarted} size="lg" className="w-full sm:w-auto sm:px-8">
            {t("auth.getStarted")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function AuthForm({ router }: { router: ReturnType<typeof useRouter> }) {
  const { t, locale, setLocale } = useLocale()
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
      if (name.trim().length < 2) next.name = t("auth.errorName")
      if (farmName.trim().length < 2)
        next.farmName = role === "buyer" ? t("auth.errorBusinessName") : t("auth.errorFarmName")
      if (!consent) next.consent = t("auth.errorConsent")
    }
    if (!validateEmail(email)) next.email = t("auth.errorEmail")
    if (password.length < 8) next.password = t("auth.errorPassword")
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
      const message = err instanceof ApiError ? err.message : t("auth.errorGeneric")
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
                {t("auth.heroHeadline")}
              </h2>
              <ul className="space-y-3 text-sm text-foreground/85">
                <FeatureRow icon={<Sprout className="size-4" />} text={t("auth.featureAdvice")} />
                <FeatureRow icon={<BarChart3 className="size-4" />} text={t("auth.featureOffline")} />
                <FeatureRow icon={<ShieldCheck className="size-4" />} text={t("auth.featureTransparent")} />
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
            <LangSwitch locale={locale} setLocale={setLocale} className="glass ml-auto flex gap-1 rounded-full p-1 text-xs font-semibold" />
          </div>

          <div className="mb-6">
            <h1 className="font-serif text-2xl italic font-semibold tracking-tight">
              {mode === "login" ? t("auth.headingLogin") : t("auth.headingSignup")}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "login" ? t("auth.subheadingLogin") : t("auth.subheadingSignup")}
            </p>
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
                {m === "login" ? t("auth.tabLogin") : t("auth.tabSignup")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">{t("auth.iAmA")}</label>
              <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
                {(
                  [
                    { value: "farmer", label: t("auth.farmer") },
                    { value: "buyer", label: t("auth.buyer") },
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
                  label={t("auth.fullName")}
                  icon={<User className="size-4" />}
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={name}
                  onChange={setName}
                  error={errors.name}
                />
                <Field
                  id="farmName"
                  label={role === "buyer" ? t("auth.businessName") : t("auth.farmName")}
                  icon={<Sprout className="size-4" />}
                  placeholder={role === "buyer" ? t("auth.businessNamePlaceholder") : t("auth.farmNamePlaceholder")}
                  value={farmName}
                  onChange={setFarmName}
                  error={errors.farmName}
                />
              </>
            )}

            <Field
              id="email"
              label={t("auth.email")}
              type="email"
              icon={<Mail className="size-4" />}
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/90">
                {t("auth.password")}
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
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
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
                  {t("auth.consentLabel")}
                </label>
                {errors.consent && <p className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="size-4 accent-primary" defaultChecked />
                  {t("auth.rememberMe")}
                </label>
                <button type="button" className="font-medium text-accent hover:underline">
                  {t("auth.forgotPassword")}
                </button>
              </div>
            )}

            {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "login" ? t("auth.submitLoginLoading") : t("auth.submitSignupLoading")}
                </>
              ) : (
                <>
                  {mode === "login" ? t("auth.submitLogin") : t("auth.submitSignup")}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? t("auth.switchPromptLogin") : t("auth.switchPromptSignup")}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setErrors({})
              }}
              className="font-semibold text-accent hover:underline"
            >
              {mode === "login" ? t("auth.switchActionLogin") : t("auth.switchActionSignup")}
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
