
# WISeReady (demo)

A minimal Next.js app to check mock Medicare WISeR prior authorization rules and generate a documentation checklist.

## Quick start

```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

## Environment

Create `.env.local` in the project root before starting the dev server:

```
RULES_GROUPED_PATH=./data/cms/rules_grouped_by_cpt.json
RULES_JOINED_PATH=./data/cms/rules_joined.json

SUPABASE_URL=…your Supabase project URL…
SUPABASE_SERVICE_ROLE_KEY=…service_role key…
```

Restart `pnpm dev` after adding or changing any env vars.

## Data sources
- Rules are loaded from `data/rules.json` (demo dataset).
- Feedback is written to the Supabase `feedback` table. Use the Supabase dashboard/SQL editor or visit `/admin/feedback` to review recent submissions.

## Misc
- API routes live under `/app/api/*`.
- Export/email endpoints are stubbed for now.
