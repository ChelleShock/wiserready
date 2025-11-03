import { Rule, StateCode } from '@/lib/types'

import { getSupabaseClient } from './supabaseClient'

const BASE_RULE_SELECT = `
  id,
  cpt,
  description,
  program,
  requires_pa,
  effective_date,
  updated_at,
  created_at,
  documentation_item (
    id,
    label,
    help_text,
    required,
    sort_order
  ),
  rule_state (
    state_code
  )
`

const STATE_SET: ReadonlySet<StateCode> = new Set([
  'TX',
  'AZ',
  'OH',
  'OK',
  'NJ',
  'WA',
])

type RuleRow = {
  id: string
  cpt: string
  description: string
  program: string | null
  requires_pa: string | null
  effective_date: string | null
  updated_at: string | null
  created_at: string | null
  documentation_item?: Array<{
    id: string
    label: string
    help_text: string | null
    required: boolean | null
    sort_order: number | null
  }>
  rule_state?: Array<{
    state_code: string | null
  }>
}

function mapRequiresPa(value: string | null): Rule['requiresPA'] {
  switch (value?.toUpperCase()) {
    case 'YES':
      return 'YES'
    case 'NO':
      return 'NO'
    case 'MANUAL':
    case 'CONDITIONAL':
    case 'UNKNOWN':
    default:
      return 'CONDITIONAL'
  }
}

function mapStateCodes(rowStates?: RuleRow['rule_state']): StateCode[] {
  if (!rowStates) return []
  const deduped = new Set<StateCode>()
  for (const entry of rowStates) {
    const code = entry?.state_code?.toUpperCase()
    if (code && STATE_SET.has(code as StateCode)) {
      deduped.add(code as StateCode)
    }
  }
  return Array.from(deduped)
}

function mapDocumentation(
  docs?: RuleRow['documentation_item'],
): Rule['documentation'] {
  if (!docs) return []
  return docs
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((doc) => ({
      id: doc.id,
      label: doc.label,
      helpText: doc.help_text ?? undefined,
      required: Boolean(doc.required),
    }))
}

function mapRuleRow(row: RuleRow): Rule {
  const requiresPA = mapRequiresPa(row.requires_pa)
  const states = mapStateCodes(row.rule_state)
  const documentation = mapDocumentation(row.documentation_item)
  const effectiveDate = row.effective_date ?? row.updated_at ?? row.created_at ?? ''

  return {
    id: row.id,
    cpt: row.cpt,
    description: row.description,
    requiresPA,
    program: (row.program as Rule['program']) ?? 'WISeR',
    states,
    macCarrier: undefined,
    effectiveDate,
    documentation,
    references: [],
    lastUpdated: row.updated_at ?? row.created_at ?? '',
  }
}

export async function fetchRuleByCpt(cpt: string): Promise<Rule | null> {
  if (!cpt) return null
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('rule')
    .select(BASE_RULE_SELECT)
    .eq('cpt', cpt)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load rule ${cpt}: ${error.message}`)
  }

  if (!data) return null
  return mapRuleRow(data as RuleRow)
}

export async function searchRuleByKeyword(keyword: string): Promise<Rule | null> {
  if (!keyword) return null
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('rule')
    .select(BASE_RULE_SELECT)
    .ilike('description', `%${keyword}%`)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to search rules: ${error.message}`)
  }

  if (!data || data.length === 0) return null
  return mapRuleRow(data[0] as RuleRow)
}

export async function fetchRules(): Promise<Rule[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('rule')
    .select(BASE_RULE_SELECT)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load rules: ${error.message}`)
  }

  return (data as RuleRow[]).map(mapRuleRow)
}

export async function fetchRuleSuggestions(
  limit = 5,
  excludeCpt?: string,
): Promise<Array<{ cpt: string; description: string }>> {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('rule')
    .select('cpt, description')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (excludeCpt) {
    query = query.neq('cpt', excludeCpt)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch suggestions: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    cpt: row.cpt,
    description: row.description,
  }))
}

export function coerceStateCode(input: string | null | undefined): StateCode {
  const upper = input?.toUpperCase()
  if (upper && STATE_SET.has(upper as StateCode)) {
    return upper as StateCode
  }
  return 'TX'
}

export function isKnownStateCode(
  input: string | null | undefined,
): input is StateCode {
  const upper = input?.toUpperCase()
  return Boolean(upper && STATE_SET.has(upper as StateCode))
}
