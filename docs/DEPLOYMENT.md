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

There is no separate manual deploy step; shipping changes = pushing to `main`.

---

## 3. Environment Variables

Supabase is wired but not yet used in user-facing features.

Current env vars (configured in Vercel under the `mlbai` project):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` – required for the Promptly API route; store the server-side OpenAI key here.

Locally, these live in `web/.env.local` (not committed).

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
