# My Life, By AI – Changelog

Human-readable log of notable changes to the public site and architecture. For technical deployment details, see `docs/DEPLOYMENT.md`.

---

## 2025-02 – Homepage v1 live on Vercel

- Wrapped the global `AnalyticsReporter` client component in a suspense boundary so Next.js can safely call `useSearchParams()` during the 404 prerender path (fixes the Vercel build failure on `_not-found`).
- Added Supabase-powered email/password auth: `/login` now lets people create an account, sign in, and sign out, and the entire app is wrapped in a Supabase session provider for future gating.
- Locked all internal apps (Promptly, feedback lab, analytics FAB) behind Supabase sessions via a shared `RequireAuth` gate, and the floating Apps launcher now routes logged-out visitors to `/login?redirect=...`.
- Synced the Supabase `profiles.is_admin` flag into the auth provider so only admins see analytics/owner UI, and documented `mylife.byai@gmail.com` as the permanent break-glass account.
- Locked `/analytics` at the route level using the Supabase server helper so only authenticated admins (checked via `profiles.is_admin`) can view traffic data, even if they guess the URL.
- Added `/privacy` and `/terms` (linked from the nav) so OAuth providers get canonical policy/TOS URLs without resorting to external docs.
- Wired Patreon OAuth:
  - `/api/patreon/link` + `/api/patreon/callback` handle OAuth, fetch membership info, and store it on the `profiles` row (`is_patron`, status, tier).
  - `RequireAuth` can now enforce Patreon memberships, and both Promptly + the feedback lab require an active patron status before rendering.
  - Apps launcher + login UI surface Patreon state and provide a linking CTA.
  - Added `/api/patreon/sync` so a nightly cron (authorized via `PATREON_SYNC_SECRET`) can refresh membership status using Patreon refresh tokens.
- Shipped the Next.js landing page (`web/src/app/page.tsx`) as the primary experience.
- Deployed the `web/` app to Vercel as project `mlbai` with automatic builds from the `main` branch.
- Wired custom domains via GoDaddy DNS:
  - `mylifeby.ai`
  - `www.mylifeby.ai`
- Documented deployment and DNS setup in `docs/DEPLOYMENT.md`.
- Updated `docs/PROJECT-OVERVIEW.md` and `docs/LANDING-PAGE-BRIEF.md` to match the live layout, including:
  - Tools grid and roadmap (“What you can use right now” / “Up next”).
  - Community testimonials (“What the community says”).
  - Stay connected section (YouTube, Discord, Beehiiv newsletter, Patreon).

## 2025-02 – Promptly beta shipped

- Built the `/promptly` experience with diagnostic-driven ChatGPT conversations and a real OpenAI backend.
- Added Promptly to the “What you can use right now” tools grid and removed the Token template card.
- Captured the guiding principles in `docs/PROMPT-GUIDE.md` and updated `docs/PROMPTLY-SPEC.md` to include the diagnostic phase.
