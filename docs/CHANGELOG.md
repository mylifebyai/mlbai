# My Life, By AI – Changelog

Human-readable log of notable changes to the public site and architecture. For technical deployment details, see `docs/DEPLOYMENT.md`.

---

## 2025-02 – Homepage v1 live on Vercel

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
