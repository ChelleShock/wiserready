import { readFile } from 'node:fs/promises'
import path from 'node:path'

import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'

const projectDir = process.cwd()
const { loadEnvConfig } = nextEnv
loadEnvConfig(projectDir)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const RULES_JSON_PATH = process.env.RULES_JSON_PATH || './data/rules.json'

/**
 * @typedef {{
 *   id: string
 *   cpt: string
 *   description: string
 *   requiresPA: string
 *   program?: string
 *   states?: string[]
 *   macCarrier?: string
 *   effectiveDate?: string
 *   documentation?: Array<{
 *     id: string
 *     label: string
 *     required?: boolean
 *     helpText?: string
 *   }>
 *   references?: Array<{ title: string; url: string }>
 *   lastUpdated?: string
 * }} RuleItem
 */

async function loadRulesFromFile() {
  const absolutePath = path.resolve(projectDir, RULES_JSON_PATH)
  console.log(`Reading rules from ${absolutePath}`)
  const raw = await readFile(absolutePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const items = Array.isArray(parsed) ? parsed : parsed.items

  if (!Array.isArray(items)) {
    throw new Error('Expected rules JSON to contain an array or an { items: [] } structure.')
  }
  return /** @type {RuleItem[]} */ (items)
}

async function truncateTables() {
  console.log('Clearing existing rule data...')
  const tableFilters = [
    { table: 'rule_state', column: 'rule_id' },
    { table: 'documentation_item', column: 'rule_id' },
    { table: 'rule_suggestion', column: 'rule_id' },
    { table: 'suggestion', column: 'id' },
    { table: 'rule', column: 'id' },
  ]

  for (const { table, column } of tableFilters) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq(column, '00000000-0000-0000-0000-000000000000')
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to clear table ${table}: ${error.message}`)
    }
  }
}

async function insertBatch(table, rows) {
  if (!rows.length) return
  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) {
      throw new Error(`Failed to insert into ${table}: ${error.message}`)
    }
  }
}

function normalizeDate(input) {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function normalizeRequiresPa(value) {
  if (!value) return null
  const normalized = String(value).trim().toUpperCase()
  const aliasMap = new Map([
    ['CONDITIONAL', 'MANUAL'],
    ['OPTIONAL', 'MANUAL'],
  ])
  const aliased = aliasMap.get(normalized) ?? normalized
  const allowed = new Set(['YES', 'NO', 'MANUAL', 'UNKNOWN'])
  return allowed.has(aliased) ? aliased : null
}

async function main() {
  const rules = await loadRulesFromFile()
  console.log(`Loaded ${rules.length} rule items`)

  await truncateTables()

  const ruleInserts = rules.map((rule) => ({
    cpt: rule.cpt,
    description: rule.description,
    program: rule.program ?? null,
    requires_pa: normalizeRequiresPa(rule.requiresPA),
    effective_date: rule.effectiveDate ?? null,
    created_at: normalizeDate(rule.lastUpdated) ?? new Date().toISOString(),
    updated_at: normalizeDate(rule.lastUpdated) ?? new Date().toISOString(),
  }))

  const { data: insertedRules, error: ruleInsertError } = await supabase
    .from('rule')
    .insert(ruleInserts)
    .select('id, cpt')

  if (ruleInsertError) {
    throw new Error(`Failed to insert rules: ${ruleInsertError.message}`)
  }

  const ruleIdByCpt = new Map(insertedRules.map((row) => [row.cpt, row.id]))

  const stateRows = []
  const docRows = []

  for (const rule of rules) {
    const ruleId = ruleIdByCpt.get(rule.cpt)
    if (!ruleId) {
      throw new Error(`Missing inserted rule id for CPT ${rule.cpt}`)
    }

    const uniqueStates = Array.from(new Set(rule.states ?? []))
    for (const state of uniqueStates) {
      stateRows.push({
        rule_id: ruleId,
        state_code: state,
      })
    }

    if (Array.isArray(rule.documentation)) {
      rule.documentation.forEach((doc, index) => {
        docRows.push({
          rule_id: ruleId,
          label: doc.label,
          help_text: doc.helpText ?? null,
          required: Boolean(doc.required),
          sort_order: index,
        })
      })
    }
  }

  await insertBatch('rule_state', stateRows)
  await insertBatch('documentation_item', docRows)

  console.log(
    `Import complete: ${ruleInserts.length} rules, ${stateRows.length} rule-state pairs, ${docRows.length} documentation records.`,
  )
}

main()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
