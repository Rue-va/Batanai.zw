import type * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'glass' | 'tonal' | 'ghost' | 'destructive'
type Size = 'default' | 'sm' | 'lg' | 'icon'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-100',
  glass: 'glass hover:bg-white/10',
  tonal: 'bg-primary/15 text-primary hover:bg-primary/25',
  ghost: 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  destructive: 'bg-destructive/15 text-destructive hover:bg-destructive/25',
}

const sizeClasses: Record<Size, string> = {
  default: 'h-11 gap-2 px-5 text-sm',
  sm: 'h-10 gap-1.5 px-4 text-xs',
  lg: 'h-[3.25rem] gap-2 px-6 text-sm',
  icon: 'size-11 shrink-0',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/** Shared with non-<button> elements (e.g. <Link> CTAs) that need identical styling. */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'default', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

export function Button({ className, variant = 'primary', size = 'default', ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />
}
