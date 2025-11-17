This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Analytics events

The Next.js app can now log anonymous page views to Supabase so you can track high-level usage without reaching for a third-party tracker. To enable it:

1. Create a `site_events` table in Supabase that contains at least the following columns: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `event_type text`, `path text`, `referrer text`, `user_agent text`, `metadata jsonb`, and `ip_hash text`.
2. Ensure the existing Supabase env vars are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. (Optional) Set `ANALYTICS_IP_SALT` to a random string. When provided, we store a salted SHA-256 hash of the visitor IP to roughly deduplicate traffic without keeping raw IP addresses.

Every client-side navigation triggers a `POST /api/analytics` call with `eventType: "page_view"`. You can query the `site_events` table directly inside Supabase (SQL editor or dashboard charts) to review traffic patterns across routes.

There’s also an internal `/analytics` route (and floating 📈 button on every page) that pulls the latest data from Supabase so you can check traffic without leaving the site. It lists total views, daily breakdowns, top paths/referrers, average time on page (powered by the duration events), and the newest hits.
