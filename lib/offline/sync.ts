import { apiFetch, ApiError, NetworkUnavailableError } from '../api'
import { getQueuedMutations, removeQueuedMutation, type OutboxEntry } from './db'

export type SyncResult = { synced: string[]; failed: { entry: OutboxEntry; error: string }[]; stillOffline: boolean }

let replaying = false

/** Replays queued offline mutations in the order they were created. Safe to
 * call repeatedly — every mutation the queue can hold was built with a
 * client-generated id, so the API treats a retried request as idempotent. */
export async function replayOutbox(): Promise<SyncResult> {
  if (replaying) return { synced: [], failed: [], stillOffline: false }
  replaying = true

  const result: SyncResult = { synced: [], failed: [], stillOffline: false }
  try {
    const queue = await getQueuedMutations()
    for (const entry of queue) {
      try {
        await apiFetch(entry.path, { method: entry.method, body: entry.body })
        await removeQueuedMutation(entry.id)
        result.synced.push(entry.id)
      } catch (err) {
        if (err instanceof NetworkUnavailableError) {
          // Still offline — stop here, leave the rest of the queue intact.
          result.stillOffline = true
          break
        }
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          // Won't succeed on retry (bad data, not-yours, etc.) — drop it
          // rather than blocking every mutation behind it forever.
          await removeQueuedMutation(entry.id)
          result.failed.push({ entry, error: err.message })
        } else {
          // Server-side (5xx) — leave queued, try again next time.
          result.stillOffline = true
          break
        }
      }
    }
  } finally {
    replaying = false
  }
  return result
}

export function watchConnectivityAndSync(onSynced?: (result: SyncResult) => void) {
  if (typeof window === 'undefined') return () => {}

  const run = () => {
    replayOutbox().then((result) => {
      if (result.synced.length > 0 || result.failed.length > 0) onSynced?.(result)
    })
  }

  if (navigator.onLine) run()
  window.addEventListener('online', run)
  return () => window.removeEventListener('online', run)
}
