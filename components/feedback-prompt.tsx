"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { addFeedback } from "@/lib/feedback"
import { hasResearchConsent } from "@/lib/auth"
import { GlassCard } from "@/components/ui/glass"
import { useLocale } from "@/lib/i18n/context"

export function FeedbackPrompt({
  triggerContext,
  prompt,
}: {
  triggerContext: string
  prompt: string
}) {
  const { t } = useLocale()
  const [consented, setConsented] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setConsented(hasResearchConsent())
  }, [])

  if (!consented || dismissed) return null

  if (submitted) {
    return (
      <GlassCard className="p-4 text-xs text-primary">
        {t('feedback.thanks')}
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4">
      <p className="mb-2.5 text-xs font-medium text-foreground/90">{prompt}</p>
      <div className="mb-2.5 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`size-5 ${
                n <= (hover || rating) ? "fill-accent text-accent" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('feedback.commentPlaceholder')}
        className="mb-3 w-full rounded-xl bg-white/5 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={rating === 0}
          onClick={() => {
            addFeedback({ triggerContext, rating, comment })
            setSubmitted(true)
          }}
          className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {t('feedback.submit')}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg bg-white/5 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {t('feedback.skip')}
        </button>
      </div>
    </GlassCard>
  )
}
