import fs from 'node:fs/promises'
import path from 'node:path'

import staticFallback from '@/data/cms/rules_grouped_by_cpt.json'

type CmsArticle = {
  article_id: string
  article_title: string
  mac_carrier: string
  state: string
  cms_article_url: string
  last_updated: string
}

type CmsRuleRecord = {
  cpt: string
  articles: CmsArticle[]
  requires_pa?: boolean
  programs?: string[]
}

type CachedData = {
  loadedAt: number
  records: CmsRuleRecord[]
}

let cache: CachedData | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

const DEFAULT_LOCAL_PATH = './data/cms/rules_grouped_by_cpt.json'
const PRIMARY_SOURCE = process.env.RULES_GROUPED_PATH || DEFAULT_LOCAL_PATH
const FALLBACK_SOURCE =
  process.env.RULES_GROUPED_FALLBACK_PATH || DEFAULT_LOCAL_PATH
const STATIC_FALLBACK = staticFallback as CmsRuleRecord[]

const HTTP_REGEX = /^https?:\/\//i

async function loadSource(source: string): Promise<CmsRuleRecord[]> {
  if (HTTP_REGEX.test(source)) {
    const res = await fetch(source, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Failed to fetch ${source}: ${res.status} ${res.statusText}`)
    }
    const parsed = await res.json()
    if (!Array.isArray(parsed)) {
      throw new Error(`CMS data source is not an array (source: ${source})`)
    }
    return parsed as CmsRuleRecord[]
  }

  const filePath = path.resolve(process.cwd(), source)
  const file = await fs.readFile(filePath, 'utf-8')
  const parsed = JSON.parse(file)
  if (!Array.isArray(parsed)) {
    throw new Error(`CMS data source is not an array (source: ${source})`)
  }
  return parsed as CmsRuleRecord[]
}

async function readCmsData(): Promise<CmsRuleRecord[]> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.records
  }

  let records: CmsRuleRecord[] | null = null

  // Try primary source (URL or file)
  try {
    records = await loadSource(PRIMARY_SOURCE)
  } catch (primaryError) {
    if (PRIMARY_SOURCE !== FALLBACK_SOURCE) {
      try {
        records = await loadSource(FALLBACK_SOURCE)
      } catch (fallbackError) {
        // Last chance: static bundle
        if (STATIC_FALLBACK?.length) {
          records = STATIC_FALLBACK
        } else {
          throw new Error(
            [
              (primaryError as Error).message,
              (fallbackError as Error).message,
            ].join(' | '),
          )
        }
      }
    } else if (STATIC_FALLBACK?.length) {
      records = STATIC_FALLBACK
    } else {
      throw primaryError
    }
  }

  if (!records || !Array.isArray(records)) {
    throw new Error(
      `CMS data source is not an array (source: ${PRIMARY_SOURCE})`,
    )
  }

  cache = {
    loadedAt: now,
    records,
  }
  return records
}

export async function findCmsRule(
  cpt: string,
): Promise<CmsRuleRecord | null> {
  if (!cpt) return null
  const data = await readCmsData()
  return (
    data.find(
      (record) => String(record.cpt).toUpperCase() === cpt.toUpperCase(),
    ) ?? null
  )
}

export type CmsRuleSummary = {
  cpt: string
  requires_pa: boolean | null
  programs: string[]
  states: string[]
  lastUpdated: string | null
  description: string
  articles: CmsArticle[]
}

export async function getCmsRuleSummary(
  cpt: string,
): Promise<CmsRuleSummary | null> {
  const record = await findCmsRule(cpt)
  if (!record) return null

  const articles = Array.isArray(record.articles) ? record.articles : []
  const description =
    articles[0]?.article_title ??
    `CPT/HCPCS ${record.cpt} (not part of WISeR prior authorization list)`

  const lastUpdated = articles
    .map((article) => article.last_updated)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? null

  const states = Array.from(
    new Set(
      articles
        .map((article) => article.state?.toUpperCase())
        .filter(Boolean) as string[],
    ),
  )

  return {
    cpt: record.cpt,
    requires_pa: record.requires_pa ?? null,
    programs: Array.isArray(record.programs) ? record.programs : [],
    states,
    lastUpdated,
    description,
    articles,
  }
}
