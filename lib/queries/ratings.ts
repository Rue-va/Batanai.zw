import { apiFetch } from '../api'

export type Rating = {
  id: string
  transactionId: string
  fromUserId: string
  toUserId: string
  value: number
  comment: string | null
  createdAt: string
  fromUser?: { id: string; name: string; farmName: string | null }
  toUser?: { id: string; name: string; farmName: string | null }
}

export async function getReceivedRatings(): Promise<Rating[]> {
  const data = await apiFetch<{ ratings: Rating[] }>('/api/ratings/received')
  return data.ratings
}

export async function getGivenRatings(): Promise<Rating[]> {
  const data = await apiFetch<{ ratings: Rating[] }>('/api/ratings/given')
  return data.ratings
}

export async function rateTransaction(transactionId: string, value: number, comment?: string): Promise<Rating> {
  const data = await apiFetch<{ rating: Rating }>(`/api/transactions/${transactionId}/rating`, {
    method: 'POST',
    body: { value, comment },
  })
  return data.rating
}
