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
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { GlassCard, Pill, SectionTitle } from '@/components/ui/glass'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleIcon } from '@/components/role-icon'
import { exportFeedbackCsv } from '@/lib/feedback'
import {
  getSession,
  logout,
  updateProfile,
  hasResearchConsent,
  setResearchConsent,
  clearResearchConsent,
  type SessionUser,
  type Role,
} from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [lang, setLang] = useState<'en' | 'sh'>('en')
  const [consent, setConsent] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = getSession()
    setUser(s)
    setName(s?.name ?? '')
    setFarmName(s?.farmName ?? '')
    setConsent(hasResearchConsent())
    const savedLang = window.localStorage.getItem('batanai.lang')
    if (savedLang === 'en' || savedLang === 'sh') setLang(savedLang)
  }, [])

  async function saveProfile() {
    if (!user) return
    const next = await updateProfile({ name, farmName })
    setUser(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function changeRole(role: Role) {
    if (!user) return
    const next = await updateProfile({ role })
    setUser(next)
  }

  function changeLang(next: 'en' | 'sh') {
    setLang(next)
    window.localStorage.setItem('batanai.lang', next)
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

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <SettingsIcon className="size-5" />
            <span className="text-sm font-semibold">Settings</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl italic font-semibold sm:text-3xl">Account & preferences</h1>
        </div>

        {/* Profile */}
        <GlassCard className="p-6">
          <SectionTitle title="Profile" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">Full name</label>
              <Input icon={<User className="size-4" />} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/90">
                {user?.role === 'buyer' ? 'Business name' : 'Farm name'}
              </label>
              <Input icon={<Sprout className="size-4" />} value={farmName} onChange={(e) => setFarmName(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={saveProfile} size="sm">
              Save changes
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Check className="size-3.5" /> Saved
              </span>
            )}
          </div>
        </GlassCard>

        {/* Role (demo helper) */}
        <GlassCard className="p-6">
          <SectionTitle title="Account type" action={<Pill tone="muted">Prototype: switch to preview both views</Pill>} />
          <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
            {(
              [
                { value: 'farmer', label: 'Farmer' },
                { value: 'buyer', label: 'Buyer' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => changeRole(opt.value)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  user?.role === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <RoleIcon role={opt.value} />
                {opt.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Language */}
        <GlassCard className="p-6">
          <SectionTitle title="Language" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="size-4" />
            Onboarding screen language (EN/SH)
          </div>
          <div className="glass mt-3 grid w-full max-w-xs grid-cols-2 gap-1 rounded-2xl p-1">
            {(['en', 'sh'] as const).map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`rounded-xl py-2 text-sm font-medium transition-colors ${
                  lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Research consent & data */}
        <GlassCard className="p-6">
          <SectionTitle title="Research data" />
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Anonymized usage ratings and comments help improve Batanai.zw for other farmers
              and buyers. You can opt in or out at any time — this only affects future feedback
              prompts.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={toggleConsent} variant={consent ? 'tonal' : 'ghost'} size="sm" className={consent ? '' : 'bg-white/5'}>
              {consent ? 'Consent given — tap to withdraw' : 'Consent withdrawn — tap to opt in'}
            </Button>
            <Button onClick={exportFeedbackCsv} variant="ghost" size="sm" className="gap-2 bg-white/5">
              <Download className="size-4" />
              Export feedback (CSV)
            </Button>
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard className="p-6">
          <SectionTitle title="Session" />
          <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
            <LogOut className="size-4" />
            Log out
          </Button>
        </GlassCard>
      </div>
    </AppShell>
  )
}
