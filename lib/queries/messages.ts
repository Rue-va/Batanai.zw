import { apiFetch, NetworkUnavailableError } from '../api'
import { enqueueMutation } from '../offline/db'

export type Message = {
  id: string
  listingId: string
  senderId: string
  receiverId: string
  body: string
  readAt: string | null
  sentAt: string
}

export async function getMessages(listingId: string): Promise<Message[]> {
  const data = await apiFetch<{ messages: Message[] }>(`/api/messages?listingId=${listingId}`)
  return data.messages
}

export async function sendMessage(input: { listingId: string; receiverId: string; body: string }): Promise<{ id: string; queued: boolean }> {
  const id = crypto.randomUUID()
  try {
    const data = await apiFetch<{ message: Message }>('/api/messages', { method: 'POST', body: { id, ...input } })
    return { id: data.message.id, queued: false }
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      await enqueueMutation({
        id: crypto.randomUUID(),
        method: 'POST',
        path: '/api/messages',
        body: { id, ...input },
        createdAt: new Date().toISOString(),
        label: 'New message',
      })
      return { id, queued: true }
    }
    throw err
  }
}
