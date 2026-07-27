import Image from 'next/image'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** Same bg-primary/15 + text-primary treatment used for every other icon
 * badge in the app (KPI cards, feature icons) — so a user with no photo
 * reads as an intentional part of the design, not an unstyled fallback. */
export function Avatar({
  name,
  imageUrl,
  size = 32,
  className,
}: {
  name: string
  imageUrl?: string | null
  size?: number
  className?: string
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold leading-none text-primary',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
    >
      {getInitials(name)}
    </span>
  )
}
