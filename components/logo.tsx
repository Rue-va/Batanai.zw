import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl', className)}
      style={{ width: size, height: size }}
    >
      <Image src="/logo.jpg" alt="Batanai.zw logo" width={size} height={size} className="size-full object-cover" />
    </span>
  )
}
