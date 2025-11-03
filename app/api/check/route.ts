import { NextRequest, NextResponse } from "next/server";
import {
  coerceStateCode,
  fetchRuleByCpt,
  fetchRuleSuggestions,
  isKnownStateCode,
  searchRuleByKeyword,
} from '@/lib/rulesService'
import { getCmsRuleSummary } from '@/lib/cmsRules'
import { Rule, StateCode } from '@/lib/types'

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
      const cmsSummary = cpt ? await getCmsRuleSummary(cpt) : null

      if (cmsSummary) {
        const states = cmsSummary.states.filter(
          (code): code is StateCode => isKnownStateCode(code),
        )

        const fallbackRule: Rule = {
          id: `cms-${cmsSummary.cpt}`,
          cpt: cmsSummary.cpt,
          description: cmsSummary.description,
          requiresPA: cmsSummary.requires_pa ? 'YES' : 'NO',
          program: 'WISeR',
          states: (states.length
            ? states
            : ['TX', 'AZ', 'OH', 'OK', 'NJ', 'WA']) as Rule['states'],
          macCarrier: cmsSummary.articles[0]?.mac_carrier,
          effectiveDate: cmsSummary.lastUpdated ?? '2026-01-01',
          documentation: [
            {
              id: 'outside-wiser',
              label:
                'Code not targeted by the WISeR prior authorization pilot; follow standard CMS coverage rules.',
              required: false,
            },
          ],
          references: cmsSummary.articles
            .slice(0, 10)
            .map((article) => ({
              title: article.article_title,
              url: article.cms_article_url,
            })),
          lastUpdated: cmsSummary.lastUpdated ?? '',
        }

        const suggestions = await fetchRuleSuggestions(5, fallbackRule.cpt)

        return NextResponse.json({
          query: {
            cpt: cpt || undefined,
            keyword: keyword || undefined,
            state,
          },
          matchQuality: 'FUZZY',
          rule: fallbackRule,
          suggestions,
          disclaimers: [
            'Code not listed in WISeR prior authorization pilot; confirm standard coverage with your MAC.',
            'Informational tool only. Verify with your MAC and current CMS publications.',
          ],
        })
      }

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
