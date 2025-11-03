# WISeReady Application Overview

This document explains how the WISeReady demo works from end to end: where data comes from, how requests are served, and which background scripts keep Supabase in sync.

## High-level flow

1. **Visitor runs a search** on the public Next.js page (`/`) using state + CPT or keyword.
2. **API route `/api/check`** receives the request, looks up the rule in Supabase, and returns a `CheckResponse` object.
3. **UI renders the rule detail** along with a documentation checklist and a feedback prompt.
4. **Feedback submissions** hit `/api/feedback`, which validates the payload and inserts a row into Supabase.
5. **Admin view (`/admin/feedback`)** lists the latest feedback rows for review.

## Data model & Supabase

Supabase hosts the relational data. Key tables (created via the earlier SQL snippet):

| Table | Purpose |
| --- | --- |
| `rule` | Core rule metadata (CPT, description, program, requires PA, effective date). |
| `rule_state` | Many-to-many list of states linked to a rule. |
| `documentation_item` | Checklist entries tied to each rule. |
| `feedback` | User reactions stored by `/api/feedback`. |

The rules service (`lib/rulesService.ts`) reads from these tables and maps Supabase rows into the frontend `Rule` shape defined in `lib/types.ts`. `requires_pa` values are normalized to the UI union (`YES`, `NO`, `CONDITIONAL`).

## Environment configuration

Set environment variables in `.env.local` (for dev) and in your host (Vercel) so the app can authenticate with Supabase:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Optional: override CMS dataset locations
# RULES_GROUPED_PATH=<public URL or path>
# RULES_GROUPED_FALLBACK_PATH=./data/cms/rules_grouped_by_cpt.json
```

The service role key is required because writes happen server-side (feedback insert, rules import). Restart `npm run dev` after changing env vars.

## Scripts & data seeding

The repository keeps a lightweight seed file at `data/rules.json` aligned to the WISeR notice service list (nerve stimulators, spinal procedures, arthroscopy, skin/tissue substitutes, etc.). The full CMS export with all CPTs (including those not subject to WISeR prior auth) remains available under `data/cms/` (`rules_grouped_by_cpt.json`, `rules_joined.json`, `rules_joined.csv`) and is mirrored publicly at:

- `https://cms.s3.us-east-1.amazonaws.com/rules_grouped_by_cpt.json`
- `https://cms.s3.us-east-1.amazonaws.com/rules_joined.json`
- `https://cms.s3.us-east-1.amazonaws.com/rules_joined.csv`

Two scripts handle moving data between the seed file and Supabase:

- `npm run import:rules` — executes `scripts/import-rules-to-supabase.mjs`. It loads the JSON, truncates `rule*` tables, inserts new rows, and normalizes the `requires_pa` values.
- (Optional) Add an export script if you need to pull Supabase changes back into `data/rules.json`.
- `npm run query:cms -- <CPT> [--state=XX]` — quick lookup inside `data/cms/rules_grouped_by_cpt.json` for codes that fall outside the WISeR prior-auth list.

To refresh Supabase with the current seed data:

```bash
npm run import:rules
```

The script reads env vars via `@next/env`, so ensure `.env.local` is populated first.

## API surface

| Route | Method | Description |
| --- | --- | --- |
| `/api/check` | GET | Accepts `state`, `cpt`, and optional `keyword`. Uses Supabase to fetch an exact or fuzzy match; if no WISeR record exists, it surfaces a read-only view sourced from `data/cms/rules_grouped_by_cpt.json` (or `RULES_GROUPED_PATH` with local fallback) so non-pilot CPTs still return context. |
| `/api/rules` | GET | Lists rules (optionally filtered by `cpt` or `state`). |
| `/api/feedback` | POST | Validates `{ ruleId, signal, comment }`, writes to Supabase, returns stored record metadata. |

All routes run on the Node.js runtime to keep Supabase client usage server-only.

## Frontend components

- `components/SearchForm.tsx` — main user flow: state selector, CPT/keyword inputs, and result display.
- `Feedback` subcomponent (inside `SearchForm.tsx`) sends reactions to `/api/feedback`.
- `ResultView` renders the rule details and documentation checklist after `/api/check` responds.
- `/admin/feedback` (in `app/admin/feedback/page.tsx`) is a server component; it queries Supabase for the latest feedback and renders a table.

## Deployment checklist

1. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your host (Vercel → Environment Variables). Redeploy after changes.
2. Ensure the Supabase schema exists (run the provided SQL once per project).
3. Seed data with `npm run import:rules` whenever `data/rules.json` updates.
4. Lock down `/admin/feedback` if deploying externally (add auth or IP restriction).

## Maintenance tips

- When the CMS export changes, update `data/rules.json` (or script the transform), then re-run the import script.
- Use the Supabase dashboard or SQL editor to inspect tables (`select * from rule;`, `select * from feedback order by created_at desc;`).
- Consider storing the original CMS JSON in Supabase Storage or a dedicated `article` table if you need article-level metadata in the UI later.
