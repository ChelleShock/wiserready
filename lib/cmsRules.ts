import fs from 'node:fs/promises'
import path from 'node:path'

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

const DATA_PATH =
  process.env.RULES_GROUPED_PATH || './data/cms/rules_grouped_by_cpt.json'

const HTTP_REGEX = /^https?:\/\//i

async function readCmsData(): Promise<CmsRuleRecord[]> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.records
  }

  let parsed: unknown

  if (HTTP_REGEX.test(DATA_PATH)) {
    const res = await fetch(DATA_PATH)
    if (!res.ok) {
      throw new Error(
        `Failed to fetch CMS data from ${DATA_PATH}: ${res.status} ${res.statusText}`,
      )
    }
    parsed = await res.json()
  } else {
    const filePath = path.resolve(process.cwd(), DATA_PATH)
    const file = await fs.readFile(filePath, 'utf-8')
    parsed = JSON.parse(file)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`CMS data source is not an array (source: ${DATA_PATH})`)
  }

  cache = {
    loadedAt: now,
    records: parsed,
  }
  return parsed
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
