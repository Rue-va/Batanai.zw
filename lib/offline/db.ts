import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Local-first cache + mutation outbox. GET responses are cached here so the
// app can render from disk when there's no connectivity; mutations made
// offline are queued here and replayed in order once the network is back.

export type OutboxEntry = {
  id: string
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  createdAt: string
  label: string
}

interface BatanaiDB extends DBSchema {
  listings: { key: string; value: any }
  adviceRules: { key: string; value: any }
  regions: { key: string; value: any }
  crops: { key: string; value: any }
  transactions: { key: string; value: any }
  messages: { key: string; value: any }
  outbox: { key: string; value: OutboxEntry }
}

const DB_NAME = 'batanai'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<BatanaiDB>> | null = null

function getDb() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<BatanaiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of ['listings', 'adviceRules', 'regions', 'crops', 'transactions', 'messages', 'outbox'] as const) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' })
          }
        }
      },
    })
  }
  return dbPromise
}

type CacheStoreName = 'listings' | 'adviceRules' | 'regions' | 'crops' | 'transactions' | 'messages'

export async function cacheAll(store: CacheStoreName, items: { id: string }[]) {
  const db = await getDb()
  if (!db) return
  const tx = db.transaction(store, 'readwrite')
  await Promise.all([...items.map((item) => tx.store.put(item as any)), tx.done])
}

export async function cacheOne(store: CacheStoreName, item: { id: string }) {
  const db = await getDb()
  if (!db) return
  await db.put(store, item as any)
}

export async function getAllCached(store: CacheStoreName): Promise<any[]> {
  const db = await getDb()
  if (!db) return []
  return db.getAll(store)
}

export async function getOneCached(store: CacheStoreName, id: string): Promise<any | undefined> {
  const db = await getDb()
  if (!db) return undefined
  return db.get(store, id)
}

export async function enqueueMutation(entry: OutboxEntry) {
  const db = await getDb()
  if (!db) return
  await db.put('outbox', entry)
}

export async function getQueuedMutations(): Promise<OutboxEntry[]> {
  const db = await getDb()
  if (!db) return []
  const all = await db.getAll('outbox')
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function removeQueuedMutation(id: string) {
  const db = await getDb()
  if (!db) return
  await db.delete('outbox', id)
}

export async function queuedMutationCount(): Promise<number> {
  const db = await getDb()
  if (!db) return 0
  return db.count('outbox')
}
