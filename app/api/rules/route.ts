import { NextRequest, NextResponse } from "next/server";
import {
  coerceStateCode,
  fetchRules,
  isKnownStateCode,
} from '@/lib/rulesService'
import { StateCode } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cpt = (searchParams.get('cpt') || '').trim()
  const stateParam = searchParams.get('state')

  try {
    let rules = await fetchRules()

    if (cpt) {
      rules = rules.filter((rule) => rule.cpt === cpt)
    }

    if (stateParam && isKnownStateCode(stateParam)) {
      const state = coerceStateCode(stateParam) as StateCode
      rules = rules.filter((rule) => rule.states.includes(state))
    }

    return NextResponse.json({ items: rules, count: rules.length })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load rule listings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
