# My Life, By AI – Web App

This is the production Next.js (App Router) site that powers [mylifeby.ai](https://mylifeby.ai). It contains the public landing page, Promptly beta, analytics dashboard, and the new Supabase-backed authentication flow.

## Stack & Structure

- Framework: Next.js 16 + React 19 (App Router, TypeScript).
- Styling: Global CSS (no CSS-in-JS) with custom design tokens.
- Data: Supabase (analytics events, feedback, and user auth), OpenAI API for Promptly.
- App code lives entirely in `web/src/app`.

```
src/
  app/
    login/          -> Email/password auth UI
    promptly/       -> Prompt design assistant
    analytics/      -> Internal analytics dashboard
    api/            -> Route handlers (analytics, feedback, Promptly, etc.)
    components/     -> Shared UI + Supabase providers
  lib/              -> Supabase clients
```

## Local Setup

1. Duplicate the sample env file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the Supabase project credentials and your OpenAI key (see below).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server on [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```

### Environment Variables

All values must exist both locally (`.env.local`) and in Vercel → Project → Environment Variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL, used by both the client and server admin helpers. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key for browser auth + data fetching. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (for analytics/feedback APIs) | Service role key used only on the server to insert analytics + feedback rows. Never expose publicly. |
| `OPENAI_API_KEY` | ✅ | Required for `/api/promptly` and `/api/arthur`. |
| `ANALYTICS_IP_SALT` | optional | Random string used to hash visitor IPs before storing them in Supabase so the data stays anonymous. |
| `PATREON_CLIENT_ID` | ✅ (for Patreon linking) | OAuth client ID from the Patreon developer portal. |
| `PATREON_CLIENT_SECRET` | ✅ (for Patreon linking) | OAuth client secret used in the token exchange. |
| `PATREON_REDIRECT_URI` | ✅ (for Patreon linking) | Must match the callback URL registered with Patreon (e.g., `https://mylifeby.ai/api/patreon/callback`). |
| `PATREON_SYNC_SECRET` | ✅ (for scheduled refresh) | Bearer token required to call `/api/patreon/sync` (use a long random string). |

## Authentication

- The entire React tree is wrapped with `SupabaseAuthProvider`, which exposes `client`, `session`, `user`, and loading state via `useAuth()`. Any client component can use it to gate UI or call Supabase.
- `/login` ships a dual-mode form (sign in/sign up), handles redirects via `?redirect=/path`, and shows logged-in users quick shortcuts to continue or sign out.
- Use `<RequireAuth redirectTo="/some-app">` to keep members-only apps private. It renders a branded login wall, waits for Supabase to hydrate, and links back to `/login` with the right redirect. Pass `requireAdmin` when only admins (e.g., analytics) should enter, and `requirePatron` when the page/tool is only for active Patreon supporters.
- Patreon linking flow:
  - `/api/patreon/link` kicks off OAuth against Patreon (requires a logged-in Supabase user).
  - `/api/patreon/callback` exchanges the code, fetches membership info, and upserts it into the `profiles` table (`is_patron`, `patreon_status`, `patreon_tier_id`, etc.).
  - After linking, `RequireAuth` grants access to patron-only routes (Promptly, feedback lab, future apps).
  - `/api/patreon/sync` can be triggered by a cron job with either `Authorization: Bearer PATREON_SYNC_SECRET` or `?secret=PATREON_SYNC_SECRET` to refresh every supporter’s status nightly using their stored refresh tokens. `vercel.json` schedules this daily.
- Keep a `profiles` table keyed by `auth.users.id` with an `is_admin` flag. Run the SQL snippet in `docs/DEPLOYMENT.md` to seed it and mark `mylife.byai@gmail.com` as the canonical admin so there’s always a break-glass account.
- Supabase handles password resets and verification emails—configure them in Supabase → Authentication.
- Future Patreon OAuth will simply add linked IDs to the Supabase profile; the provider is already in place.

## Useful Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Next.js dev server (recommended with `.env.local` in place). |
| `npm run lint` | ESlint via `next lint`. Keeps hooks and dependencies tidy. |
| `npm run build` | Production build (runs lint + TypeScript + Turbopack build). |
| `npm run start` | Serve the production build locally. |

## Analytics & Internal Dashboards

Anonymous page views are captured through the `AnalyticsReporter` client (wrapped in Suspense). It records duration events, page views, and optional hashed IPs via `POST /api/analytics` into the `site_events` table on Supabase.

- `/analytics` (and the floating 📈 button) pulls directly from Supabase using the service role key, so keep that env var configured in Vercel. The page now uses the Supabase server helpers to require an authenticated admin session before rendering.
- Site admins can monitor traffic without leaving the app. See `docs/DEPLOYMENT.md` and `docs/CHANGELOG.md` for schema details and the history of analytics updates.

## Policies

- `/privacy` hosts the live privacy policy (linked in the top nav) describing how we use Supabase Auth, analytics, and Promptly data. Update this page whenever the data footprint changes so we always have an up-to-date link for OAuth providers like Patreon.
- `/terms` contains the Terms of Service covering account use, Promptly beta disclaimers, acceptable use, and liability limits.

## Need More Context?

- High-level goals, audience strategy, and site brief: `docs/PROJECT-OVERVIEW.md`, `docs/LANDING-PAGE-BRIEF.md`.
- Deployment playbook & DNS: `docs/DEPLOYMENT.md`.
- Prompt philosophy and Promptly spec: `docs/PROMPT-GUIDE.md`, `docs/PROMPTLY-SPEC.md`.
