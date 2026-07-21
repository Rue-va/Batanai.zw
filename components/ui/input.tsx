import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: boolean
  wrapperClassName?: string
}

export function Input({ className, wrapperClassName, icon, error, ...props }: InputProps) {
  return (
    <div
      className={cn(
        'glass flex items-center gap-2.5 rounded-2xl px-4 py-3 has-[:focus]:ring-2 has-[:focus]:ring-ring',
        error && 'ring-1 ring-destructive/60',
        wrapperClassName,
      )}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <input
        className={cn('w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground', className)}
        {...props}
      />
    </div>
  )
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn('glass rounded-2xl px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      {...props}
    >
      {children}
    </select>
  )
}
