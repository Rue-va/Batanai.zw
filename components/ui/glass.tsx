import type * as React from 'react'
import { cn } from '@/lib/utils'

export function GlassCard({
  className,
  strong,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'rounded-2xl',
        className,
      )}
      {...props}
    />
  )
}

export function Pill({
  className,
  tone = 'lime',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'lime' | 'accent' | 'muted' | 'danger'
}) {
  const tones = {
    lime: 'bg-primary/15 text-primary border-primary/25',
    accent: 'bg-accent/15 text-accent border-accent/30',
    muted: 'bg-white/5 text-muted-foreground border-white/10',
    danger: 'bg-destructive/15 text-destructive border-destructive/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

export function SectionTitle({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide text-foreground/90">
        {title}
      </h2>
      {action}
    </div>
  )
}
