
# WISeReady (demo)

A minimal Next.js app to check mock Medicare WISeR prior authorization rules and generate a documentation checklist.

## Quick start

```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

## Notes
- Data is seeded from `data/rules.json` for demo.
- API routes live under `/app/api/*`.
- Export/email endpoints are stubbed for now.
- Replace with a database (Supabase/Postgres) when ready.
