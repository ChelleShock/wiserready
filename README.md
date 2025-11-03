
# WISeReady (demo)

A minimal Next.js app to check mock Medicare WISeR prior authorization rules and generate a documentation checklist.

## Quick start

```bash
npm install
npm run dev # http://localhost:3000
```

## Environment

Create `.env.local` in the project root before starting the dev server:

```env
SUPABASE_URL=…your Supabase project URL…
SUPABASE_SERVICE_ROLE_KEY=…service_role key…
```

Restart `npm run dev` after adding or changing any env vars.

## Data sources
- Rules are loaded from `data/rules.json` (demo dataset) and cover the WISeR-listed services (nerve stimulators, spine procedures, arthroscopic knee, skin/tissue substitutes, etc.). The full CMS export (all CPTs, including codes that are not part of the WISeR prior-auth list) lives in `data/cms/` (`rules_grouped_by_cpt.json`, `rules_joined.json`, `rules_joined.csv`).
- Feedback is written to the Supabase `feedback` table. Use the Supabase dashboard/SQL editor or visit `/admin/feedback` to review recent submissions.

## Importing rules into Supabase

Run the helper script to replace the Supabase `rule*` tables with the current JSON:

```bash
npm run import:rules
```

The script:
- Loads env vars via `.env.local`
- Clears `rule`, `rule_state`, `documentation_item`, and related tables
- Inserts the current data from `data/rules.json` (override with `RULES_JSON_PATH` if needed)

Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` point at the project you want to refresh before running.

## Utilities

- `npm run query:cms -- <CPT> [--state=XX]` — inspect the raw CMS export (from `data/cms/rules_grouped_by_cpt.json`) for codes that fall outside the WISeR prior-auth list.

## Documentation

- `docs/app-overview.md` — full walkthrough of the data model, APIs, and upkeep scripts.

## Misc
- API routes live under `/app/api/*`.
- Export/email endpoints are stubbed for now.
