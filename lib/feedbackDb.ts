import { getSupabaseClient } from './supabaseClient'

export type FeedbackInsert = {
  ruleId: string
  signal: 'up' | 'down'
  comment: string | null
}

export type FeedbackRecord = FeedbackInsert & {
  id: string
  createdAt: string
}

export type FeedbackRow = FeedbackRecord

export async function recordFeedback(
  entry: FeedbackInsert,
): Promise<FeedbackRecord> {
  const supabase = getSupabaseClient()
  const insertedAt = new Date().toISOString()
  const payload = {
    rule_id: entry.ruleId,
    signal: entry.signal,
    comment: entry.comment,
    created_at: insertedAt,
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert(payload)
    .select('id, rule_id, signal, comment, created_at')
    .single()

  if (error) {
    throw new Error(`Failed to persist feedback: ${error.message}`)
  }

  return {
    id: data.id,
    ruleId: data.rule_id,
    signal: data.signal,
    comment: data.comment,
    createdAt: data.created_at,
  }
}

export async function listFeedback(limit = 200): Promise<FeedbackRow[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('feedback')
    .select('id, rule_id, signal, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to load feedback: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    ruleId: row.rule_id,
    signal: row.signal,
    comment: row.comment,
    createdAt: row.created_at,
  }))
}
