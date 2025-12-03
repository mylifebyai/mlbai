Work on the manifesto builder lives on the dedicated branch `feature/manifesto-builder` so main (and the live site) stay untouched.

## Branch + workflow

- `git checkout feature/manifesto-builder` to switch locally (already created from `main`).
- Pull the latest changes with `git pull origin feature/manifesto-builder`.
- Keep main clean; only merge when you’re ready to go live.

## Local dev (localhost)

1. `cd web`
2. `npm install`
3. Copy envs: `cp .env.example .env.local` and fill with non-production values for:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET`, `PATREON_REDIRECT_URI`, `PATREON_STATE_SECRET`
   - Optional: `ANALYTICS_IP_SALT`, `PATREON_SYNC_SECRET`, `PATREON_CAMPAIGN_ID`, `PATREON_TESTER_TIER_IDS`
   - Optional feature flag: `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED=true` to view the Manifesto Builder route (set true locally; keep false in production).
4. `npm run dev` → http://localhost:3000
5. Run `npm run lint` before pushing.

## Vercel preview (no production impact)

- Push the branch: `git push -u origin feature/manifesto-builder`. Vercel will build a Preview deployment because `main` is the only production branch.
- In the Vercel project settings, add the same env vars above to the Preview scope (use staging/test credentials). Set `PATREON_REDIRECT_URI` to the preview domain, e.g. `https://<preview>.vercel.app/api/patreon/callback`.
- Use the preview URL for testing and sharing. Do not promote the deployment to production or merge to `main` until you are ready for the live site.
- Recommended preview setup:
  - Keep Production and Preview env vars as separate entries in Vercel. Production uses the live values; Preview can point to staging values if you have them.
  - Use the branch alias as the stable redirect for Patreon in Preview. Example for this branch: `https://mlbai-git-feature-manifesto-builder-mlbais-projects.vercel.app/api/patreon/callback`.
  - If a Preview env var changes, redeploy the preview (UI redeploy or empty commit) so the app picks it up.
  - Set `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED=true` in Preview only; keep it `false` in Production.
- Full product spec for the Manifesto Builder lives at `../docs/manifesto-builder-spec.md`.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Analytics events

The Next.js app can log anonymous page views to Supabase so you can track high-level usage without reaching for a third-party tracker. To enable it:

1. Create a `site_events` table in Supabase that contains at least the following columns: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `event_type text`, `path text`, `referrer text`, `user_agent text`, `metadata jsonb`, and `ip_hash text`.
2. Ensure the existing Supabase env vars are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. (Optional) Set `ANALYTICS_IP_SALT` to a random string. When provided, we store a salted SHA-256 hash of the visitor IP to roughly deduplicate traffic without keeping raw IP addresses.

Every client-side navigation triggers a `POST /api/analytics` call with `eventType: "page_view"`. You can query the `site_events` table directly inside Supabase (SQL editor or dashboard charts) to review traffic patterns across routes.

There’s also an internal `/analytics` route (and floating 📈 button on every page) that pulls the latest data from Supabase so you can check traffic without leaving the site. It lists total views, daily breakdowns, top paths/referrers, average time on page (powered by the duration events), and the newest hits.
