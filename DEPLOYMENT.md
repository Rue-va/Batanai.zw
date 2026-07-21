# Deployment

Three pieces, deployed independently: database (Neon or Supabase), API
(Render or Railway), frontend (Vercel or Netlify). Deploy in that order —
each step needs the previous one's connection details.

## 1. Database (Neon or Supabase)

1. Create a free Postgres project on either. Copy the connection string —
   it should look like `postgresql://user:pass@host/db?sslmode=require`.
2. Nothing else to do here yet — migrations run from your machine or the
   API host in step 2.

## 2. API (Render or Railway)

Root directory for the service: `server/`
Build command: `npm install && npm run build && npx prisma generate`
Start command: `npm run start`

Environment variables (copy from `server/.env.example`, fill in real values):

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Neon/Supabase connection string from step 1 |
| `PORT` | leave unset — Render/Railway inject their own `PORT` and the app already reads `process.env.PORT` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | your frontend's deployed URL (step 3) — **set this after step 3**, update and redeploy |
| `JWT_ACCESS_SECRET` | a long random string, e.g. `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | a **different** long random string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `ADMIN_EXPORT_TOKEN` | a long random string — only you (the researcher) will use this, to call `GET /api/feedback/export.csv` |

After the first deploy, run the migration and seed once (Render: "Shell" tab
on the service; Railway: `railway run`):

```bash
npx prisma migrate deploy
npx prisma db seed
```

Confirm it's up: `curl https://<your-api-host>/health` → `{"ok":true}`

## 3. Frontend (Vercel or Netlify)

Root directory: repo root (not `server/`)
Build command: default Next.js build (`next build`) — no changes needed.

Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | your deployed API URL from step 2, e.g. `https://batanai-api.onrender.com` |

Once deployed, go back to step 2 and set `CORS_ORIGIN` on the API to this
frontend URL exactly (including `https://`, no trailing slash), then
redeploy the API — until that's set, every request from the deployed
frontend will be blocked by CORS.

HTTPS is automatic on all four platforms; the API also has an explicit
redirect-to-HTTPS middleware (`server/src/index.ts`) as a second layer, so
this is enforced even if a platform's default ever changes.

## 4. Verify

- Register an account on the live frontend, confirm it lands on the
  dashboard.
- Create a listing, refresh, confirm it's still there (proves the DB write
  worked end-to-end).
- Turn off your device's networking, reload the app — it should still load
  (service worker) and previously-viewed listings should still render
  (IndexedDB cache). Create a listing while offline, turn networking back
  on — it should sync automatically within a few seconds.
- On a phone, use "Add to Home Screen" (iOS Safari) or the install prompt
  (Android Chrome) to confirm it installs as a standalone app.

## Local development reference

Both services already run locally for continued work:
- API: `cd server && npm run dev` (needs a local `DATABASE_URL` in
  `server/.env` — see `server/.env.example`)
- Frontend: `pnpm dev` (needs `NEXT_PUBLIC_API_URL` in `.env.local`,
  defaults to `http://localhost:4000`)
