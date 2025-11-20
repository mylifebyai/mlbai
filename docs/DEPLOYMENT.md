# My Life, By AI – Deployment & Domains

This doc captures how the current site is deployed and how `mylifeby.ai` is wired, so future changes are repeatable.

---

## 1. Overview

- Framework: Next.js 16 (App Router, TypeScript).
- App location in repo: `web/`.
- Hosting: Vercel (project name: `mlbai`).
- Production URLs:
  - Default Vercel domain: `https://mlbai.vercel.app`
  - Primary domain: `https://mylifeby.ai`
  - Alternate: `https://www.mylifeby.ai`

`index.html` at the repo root is a legacy static prototype only; the live site is the Next.js app in `web/`.

---

## 2. How Production Deploys Work

1. The GitHub repo is `mylifebyai/mlbai`.
2. Vercel is configured to use:
   - **Git provider**: GitHub
   - **Root directory**: `web`
   - **Framework preset**: Next.js
3. Any push to the `main` branch triggers a new Vercel build.
4. On successful build, Vercel promotes that build to production and serves it at:
   - `https://mlbai.vercel.app`
   - `https://mylifeby.ai` and `https://www.mylifeby.ai` once DNS has propagated.

**Build check reminder:** run `npm run build` locally before pushing. Vercel will bail out if a client component that uses router hooks (e.g. `AnalyticsReporter` with `useSearchParams()`) loses its suspense boundary, and the failure only surfaces during the `_not-found` prerender.

There is no separate manual deploy step; shipping changes = pushing to `main`.

---

## 3. Environment Variables

Supabase is wired but not yet used in user-facing features.

Current env vars (configured in Vercel under the `mlbai` project):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` – required for the Promptly API route; store the server-side OpenAI key here.
- `SUPABASE_SERVICE_ROLE_KEY` – used by API routes that insert into Supabase without going through RLS checks.
- `PATREON_CLIENT_ID`
- `PATREON_CLIENT_SECRET`
- `PATREON_REDIRECT_URI` (e.g. `https://mylifeby.ai/api/patreon/callback`)
- `PATREON_SYNC_SECRET` – bearer token required to trigger the Patreon refresh endpoint.

Locally, these live in `web/.env.local` (not committed). Start from `web/.env.example` whenever setting up a new machine so no required variable gets missed.

### Supabase Auth (email + password)

1. In Supabase → **Authentication → Providers**, keep **Email** enabled and disable the social providers for now. Passwordless magic links also work and reuse the same `/login` UI.
2. Set **Site URL** (Authentication → URL Configuration) to the production domain, e.g. `https://mylifeby.ai`. Add `https://mlbai.vercel.app` as an additional redirect URL for preview builds.
3. Create a `SERVICE_ROLE` key in Vercel only if backend routes need server-side Supabase access. (Not required for client auth.)
4. The public login page lives at `/login`. It calls Supabase directly, so if sign-ups fail double-check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present in Vercel **and** locally when testing.
5. Supabase handles password resets. The default template is fine, but you can edit it under **Authentication → Email Templates** to match MLBAI branding.
6. Apps like `/promptly` and `/feedback` use the shared `<RequireAuth>` wrapper. If you add a new members-only route, wrap the page in that component so logged-out visitors get routed to `/login?redirect=/your-page`.
7. **Admin account:** keep `mylife.byai@gmail.com` as the canonical owner. After creating the user via `/login`, run the following SQL once in Supabase to create a `profiles` table (if it doesn’t exist) and mark that user as admin:

   ```sql
   create table if not exists profiles (
     id uuid primary key references auth.users on delete cascade,
     is_admin boolean default false,
     created_at timestamptz default now()
   );

   insert into profiles (id, is_admin)
   select id, true
   from auth.users
   where email = 'mylife.byai@gmail.com'
   on conflict (id) do update set is_admin = excluded.is_admin;
   ```

   Gate any privileged UI (analytics, user management, feature toggles, etc.) by fetching the `profiles.is_admin` flag after login. If a bug ever removes the row, you can reapply the flag via the Supabase dashboard using the same SQL.

8. **Policies:** `/privacy` (privacy policy) and `/terms` (terms of service) are both hosted pages linked in the nav. Keep them current so OAuth providers have valid URLs.
9. **Patreon verification:** users must link their Patreon membership before accessing Promptly + other labs.

   - In Patreon → Developer Portal, create a confidential OAuth client (App Name: “My Life, By AI”) with scopes `identity identity[email] identity.memberships`. Supply the production callback `https://mylifeby.ai/api/patreon/callback`.
   - Store the client ID/secret and redirect URI in Vercel + `.env.local`.
   - Extend the `profiles` table so we can store membership data:

     ```sql
     alter table profiles
       add column if not exists is_patron boolean default false,
       add column if not exists patreon_user_id text,
       add column if not exists patreon_email text,
       add column if not exists patreon_full_name text,
       add column if not exists patreon_status text,
       add column if not exists patreon_tier_id text,
       add column if not exists patreon_last_sync timestamptz;
     ```

   - Users click `/api/patreon/link`, authorize MLBAI, and the callback stores their membership info. `<RequireAuth requirePatron>` enforces that only active supporters reach Promptly, Feedback, etc.
   - Optional refresh: trigger `POST /api/patreon/sync` daily (Vercel Cron, GitHub Actions, etc.) with either header `Authorization: Bearer $PATREON_SYNC_SECRET` or query string `?secret=$PATREON_SYNC_SECRET`. This endpoint loops through stored refresh tokens, hits Patreon, and keeps `is_patron` up to date automatically. `web/vercel.json` already registers a daily Vercel Cron hitting this path.

--- 

## 4. Domain & DNS Setup (mylifeby.ai via GoDaddy)

Domain registrar: GoDaddy  
DNS is managed at GoDaddy and points to Vercel.

### 4.1 Vercel Domain Configuration

In Vercel → Project `mlbai` → **Settings → Domains**:

- Added domains:
  - `mylifeby.ai`
  - `www.mylifeby.ai`
- Both show **Valid Configuration** when DNS is correct.

### 4.2 GoDaddy DNS Records

In GoDaddy → `mylifeby.ai` → **DNS → DNS Records**:

- **A record (root domain)**  
  - Type: `A`  
  - Name: `@`  
  - Value: (Vercel-provided IPv4 address, e.g. `216.198.79.1`)  
  - TTL: default

- **CNAME record (www subdomain)**  
  - Type: `CNAME`  
  - Name: `www`  
  - Value: Vercel-generated CNAME, e.g. `e68f029b2b177b17.vercel-dns-017.com`  
  - TTL: default

Notes:
- Vercel may update its recommended IP or CNAME over time; always follow the values shown in the **Domains** tab for `mylifeby.ai`.
- After changing DNS in GoDaddy, it can take 5–60+ minutes for the change to propagate globally.

---

## 5. How to Recreate This Setup

If the project ever needs to be recreated or moved:

1. **Create/import the project in Vercel**
   - New Project → Import Git Repository → select `mylifebyai/mlbai`.
   - Root Directory: `web`.
   - Framework: Next.js.

2. **Add environment variables**
   - In the Vercel project → Settings → Environment Variables:
     - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **Attach domains**
   - In the same project → Settings → Domains:
     - Add `mylifeby.ai` and `www.mylifeby.ai`.

4. **Point DNS at Vercel**
   - Update GoDaddy DNS A and CNAME records to match what Vercel recommends for `mylifeby.ai`.
   - Wait for DNS propagation and confirm by visiting `https://mylifeby.ai`.

Once this is done, pushing to `main` is all that’s needed to update the live site.
