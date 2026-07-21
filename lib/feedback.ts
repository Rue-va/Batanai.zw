'use client'

// Feedback is submitted to the real API (anonymized by participant code, no
// account linkage — see server/prisma/schema.prisma). The full research
// dataset is only ever exported by the researcher via the admin-token-gated
// GET /api/feedback/export.csv endpoint, never from inside the app — so the
// on-device export button here keeps exporting only this device's own
// local feedback log, same as before.

import { apiFetch, NetworkUnavailableError } from './api'
import { enqueueMutation } from './offline/db'

export type FeedbackEntry = {
  id: string
  triggerContext: string
  rating: number
  comment: string
  timestamp: string
  synced: boolean
}

const LOG_KEY = 'batanai.feedback'
const PARTICIPANT_CODE_KEY = 'batanai.participant_code'

function getFeedbackLog(): FeedbackEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : []
  } catch {
    return []
  }
}

/** Stable per-device anonymous code, generated once at first consent —
 * deliberately never derived from account/email/phone. */
export function getParticipantCode(): string {
  let code = window.localStorage.getItem(PARTICIPANT_CODE_KEY)
  if (!code) {
    code = `P-${crypto.randomUUID().slice(0, 8)}`
    window.localStorage.setItem(PARTICIPANT_CODE_KEY, code)
  }
  return code
}

export async function addFeedback(entry: { triggerContext: string; rating: number; comment: string }) {
  const log = getFeedbackLog()
  const local: FeedbackEntry = {
    id: `FB-${Date.now()}`,
    triggerContext: entry.triggerContext,
    rating: entry.rating,
    comment: entry.comment,
    timestamp: new Date().toISOString(),
    synced: false,
  }

  const participantCode = getParticipantCode()
  const body = {
    participantCode,
    triggerContext: entry.triggerContext,
    rating: entry.rating,
    comment: entry.comment || undefined,
    consentGiven: true,
  }

  try {
    await apiFetch('/api/feedback', { method: 'POST', body })
    local.synced = true
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      await enqueueMutation({
        id: crypto.randomUUID(),
        method: 'POST',
        path: '/api/feedback',
        body,
        createdAt: new Date().toISOString(),
        label: `Feedback: ${entry.triggerContext}`,
      })
    }
    // Non-network errors (validation, etc.) still keep the local copy below
    // so nothing the farmer typed is lost — just not marked synced.
  }

  window.localStorage.setItem(LOG_KEY, JSON.stringify([...log, local]))
}

export function exportFeedbackCsv() {
  const rows = getFeedbackLog()
  const header = ['id', 'trigger_context', 'rating', 'comment', 'timestamp', 'synced']
  const csv = [
    header.join(','),
    ...rows.map((r) =>
      [r.id, r.triggerContext, r.rating, `"${r.comment.replace(/"/g, '""')}"`, r.timestamp, r.synced].join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'batanai-feedback.csv'
  a.click()
  URL.revokeObjectURL(url)
}
