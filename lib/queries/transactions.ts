import { apiFetch, NetworkUnavailableError } from '../api'
import { cacheAll, getAllCached, enqueueMutation } from '../offline/db'

export type TransactionStatus = 'Interested' | 'Negotiating' | 'Agreed' | 'Completed'

export type Transaction = {
  id: string
  listingId: string
  farmerId: string
  buyerId: string
  quantity: string
  totalPrice: string
  status: TransactionStatus
  buyerRating: string | null
  createdAt: string
  updatedAt: string
  listing?: { crop: string }
  farmer?: { id: string; name: string; farmName: string | null }
  buyer?: { id: string; name: string; farmName: string | null }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await apiFetch<{ transactions: Transaction[] }>('/api/transactions')
    await cacheAll('transactions', data.transactions)
    return data.transactions
  } catch (err) {
    if (err instanceof NetworkUnavailableError) return getAllCached('transactions')
    throw err
  }
}

export async function expressInterest(input: { listingId: string; quantity: string; totalPrice: number }): Promise<{ id: string; queued: boolean }> {
  const id = crypto.randomUUID()
  try {
    const data = await apiFetch<{ transaction: Transaction }>('/api/transactions', { method: 'POST', body: { id, ...input } })
    return { id: data.transaction.id, queued: false }
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      await enqueueMutation({
        id: crypto.randomUUID(),
        method: 'POST',
        path: '/api/transactions',
        body: { id, ...input },
        createdAt: new Date().toISOString(),
        label: `Express interest: ${input.listingId}`,
      })
      return { id, queued: true }
    }
    throw err
  }
}

export async function advanceTransaction(id: string, status: TransactionStatus) {
  return apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}/advance`, { method: 'PATCH', body: { status } })
}

export async function declineTransaction(id: string) {
  return apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
}
