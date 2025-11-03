
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
- Rules are loaded from `data/rules.json` (demo dataset).
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

## Documentation

- `docs/app-overview.md` — full walkthrough of the data model, APIs, and upkeep scripts.

## Misc
- API routes live under `/app/api/*`.
- Export/email endpoints are stubbed for now.
