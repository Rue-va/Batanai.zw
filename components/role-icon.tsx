import { Tractor, ShoppingBag, ShieldCheck } from 'lucide-react'
import type { Role } from '@/lib/auth'

const icon: Record<Role, typeof Tractor> = {
  farmer: Tractor,
  buyer: ShoppingBag,
  admin: ShieldCheck,
}

export function RoleIcon({ role, size = 16 }: { role: Role; size?: number }) {
  const Icon = icon[role]
  return <Icon size={size} />
}
