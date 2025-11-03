import { NextRequest, NextResponse } from "next/server";
import {
  coerceStateCode,
  fetchRuleByCpt,
  fetchRuleSuggestions,
  searchRuleByKeyword,
} from '@/lib/rulesService'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cpt = (searchParams.get('cpt') || '').trim()
  const keyword = (searchParams.get('keyword') || '').trim()
  const state = coerceStateCode(searchParams.get('state'))

  try {
    let rule = cpt ? await fetchRuleByCpt(cpt) : null
    let matchQuality: 'EXACT' | 'FUZZY' | 'NONE' = 'NONE'

    if (rule) {
      matchQuality = 'EXACT'
    } else if (keyword) {
      rule = await searchRuleByKeyword(keyword)
      if (rule) {
        matchQuality = 'FUZZY'
      }
    }

    if (!rule) {
      const suggestions = await fetchRuleSuggestions(5)
      return NextResponse.json(
        {
          query: {
            cpt: cpt || undefined,
            keyword: keyword || undefined,
            state,
          },
          matchQuality: 'NONE',
          suggestions,
          disclaimers: [
            'No WISeR match in current dataset. Verify with your MAC/CMS.',
          ],
        },
        { status: 404 },
      )
    }

    const suggestions = await fetchRuleSuggestions(5, rule.cpt)

    return NextResponse.json({
      query: { cpt: cpt || undefined, keyword: keyword || undefined, state },
      matchQuality,
      rule,
      suggestions,
      disclaimers: [
        'Informational tool only. Verify with your MAC and current CMS publications.',
      ],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load rule'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
