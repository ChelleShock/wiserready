
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { recordFeedback } from '@/lib/feedbackDb'

export const runtime = 'nodejs'

const feedbackSchema = z.object({
  ruleId: z.string().min(1, 'ruleId is required'),
  signal: z.enum(['up', 'down', 'none']).default('up'),
  comment: z
    .string()
    .max(1000, 'comment is too long')
    .optional(),
})

export async function POST(req: NextRequest) {
  let payload: unknown
  try {
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = feedbackSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid feedback payload',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const { ruleId, signal, comment } = parsed.data
  const normalizedSignal: 'up' | 'down' = signal === 'none' ? 'up' : signal
  const normalizedComment = comment?.trim() ? comment.trim() : null

  try {
    const feedback = await recordFeedback({
      ruleId,
      signal: normalizedSignal,
      comment: normalizedComment,
    })

    return NextResponse.json({ status: 'recorded', feedback })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to record feedback',
        details:
          err instanceof Error ? err.message : 'Unknown error while persisting',
      },
      { status: 500 },
    )
  }
}
