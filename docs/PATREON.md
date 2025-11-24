# Patreon linking & gating

This covers the new Patreon OAuth + role mapping flow and what needs to be configured.

## Environment

Add these to Vercel + `.env.local` (web):
- `PATREON_CLIENT_ID`
- `PATREON_CLIENT_SECRET`
- `PATREON_REDIRECT_URI` – must match the callback registered in Patreon (`https://mylifeby.ai/api/patreon/callback` or the preview domain).
- `PATREON_STATE_SECRET` – random string to sign the OAuth `state`.
- `PATREON_CAMPAIGN_ID` – limits membership checks to this campaign.
- `PATREON_TESTER_TIER_IDS` – comma-separated Patreon tier IDs that count as Grade 2+ (tester role).
- `PATREON_SYNC_SECRET` (optional) – bearer token for manual sync calls; Vercel cron is still allowed via the `x-vercel-cron` header.

Supabase env vars already in use: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Current Patreon IDs
- Campaign: `14178663`
- Tiers:
  - Free: `25911578`
  - Grade 1: `25911676`
  - Grade 2: `25911687`
  - Originals: `25911712`
  - Grade 3: `27061221`
  - Grade 4: `26387892`

Recommended tester mapping (Grade 2+): `PATREON_TESTER_TIER_IDS=25911687,27061221,26387892`  
Add `25911712` if Originals should also get tester. Leave Free/Grade 1 out so they stay `regular`.

## Supabase schema

Add these columns to `profiles` (leave RLS locked down; tokens should not be readable by clients):

```sql
alter table profiles
  add column if not exists patreon_user_id text,
  add column if not exists patreon_tier_id text,
  add column if not exists patreon_status text,
  add column if not exists patreon_last_sync_at timestamptz,
  add column if not exists patreon_refresh_token text;
```

## Flows

- **Start link**: `/account` → “Link Patreon” calls `POST /api/patreon/start` (needs Supabase session). We build a signed OAuth `state` and redirect to Patreon.
- **Callback**: Patreon returns to `/api/patreon/callback`. We exchange the code, fetch membership, upsert `profiles` (Patreon ids/status/tier/refresh token, `patreon_last_sync_at`), and map roles (Grade 2+ → tester, otherwise regular; admins stay admin). Redirects back to `/account` with a status flag.
- **Manual refresh**: “Refresh status” on `/account` calls `GET /api/patreon/sync` with the user’s Supabase token to resync just their membership.
- **Daily job**: Vercel cron hits `/api/patreon/sync` daily (`vercel.json`). It refreshes all rows with a Patreon refresh token, updates tier/status/role, and clears tokens marked invalid.

## Admin view

`/admin/users` now shows Patreon status/tier/last sync per user. Primary admin remains locked from role changes.
