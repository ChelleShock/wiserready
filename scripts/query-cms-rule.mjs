#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const [, , cptArg, ...restArgs] = process.argv

if (!cptArg) {
  console.error('Usage: npm run query:cms -- <CPT> [--state=XX]')
  process.exit(1)
}

const stateArg = restArgs.find((arg) => arg.startsWith('--state='))
const stateFilter = stateArg ? stateArg.split('=')[1]?.toUpperCase() : undefined

const dataPath =
  process.env.RULES_GROUPED_PATH || './data/cms/rules_grouped_by_cpt.json'

async function main() {
  const absPath = path.resolve(process.cwd(), dataPath)
  const raw = await readFile(absPath, 'utf-8')
  const parsed = JSON.parse(raw)

  const record = parsed.find(
    (entry) => String(entry.cpt).toUpperCase() === cptArg.toUpperCase(),
  )

  if (!record) {
    console.log(
      JSON.stringify(
        { cpt: cptArg.toUpperCase(), message: 'Not found in CMS export' },
        null,
        2,
      ),
    )
    process.exit(0)
  }

  const articles = Array.isArray(record.articles)
    ? record.articles.filter((article) =>
        stateFilter ? article.state?.toUpperCase() === stateFilter : true,
      )
    : []

  const response = {
    cpt: record.cpt,
    requires_pa: record.requires_pa ?? null,
    programs: record.programs ?? [],
    article_count: articles.length,
    articles,
  }

  console.log(JSON.stringify(response, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
