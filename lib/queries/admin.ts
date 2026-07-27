import { apiFetch } from '../api'
import type { Role } from '../auth'

export type AdminUser = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  createdAt: string
  lastLoginAt: string | null
  verified: boolean
}

export type AdminTransaction = {
  id: string
  quantity: string
  totalPrice: string
  status: string
  createdAt: string
  listing: { id: string; crop: string }
  farmer: { id: string; name: string; farmName: string | null }
  buyer: { id: string; name: string; farmName: string | null }
}

export type AdminRating = {
  id: string
  value: number
  comment: string | null
  createdAt: string
  fromUser: { id: string; name: string }
  toUser: { id: string; name: string }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>('/api/admin/users')
  return data.users
}

export async function getAdminTransactions(): Promise<AdminTransaction[]> {
  const data = await apiFetch<{ transactions: AdminTransaction[] }>('/api/admin/transactions')
  return data.transactions
}

export async function getAdminRatings(): Promise<AdminRating[]> {
  const data = await apiFetch<{ ratings: AdminRating[] }>('/api/admin/ratings')
  return data.ratings
}
