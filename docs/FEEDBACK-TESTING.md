# Tester Feedback Workspace

## Purpose
- Capture bugs, content issues, and UX polish items during internal testing without needing testers to share a browser.
- Store every submission centrally in Supabase so the admin lane is consistent across devices and refreshes.
- Keep a drag-and-drop triage lane so completed work can be collapsed but never lost.

## Access Points
- **Floating CTA:** The “Report an issue” round button sticks to the bottom-right corner of every page. It links to `/feedback`.
- **Direct URL:** Navigate to `https://<site>/feedback` for the full submission + review experience.

## Tester Flow
- Fill in optional name + contact so we know who to follow up with.
- Categorize the issue (type + severity) and describe the affected page or component.
- Share a short summary plus reproducible steps.
- Drag-and-drop or click to upload one screenshot (PNG/JPEG/WebP/GIF). We validate MIME type client-side.
- Browser + viewport info auto-populates when the entry is created.
- Entries are posted to Supabase instantly, so anyone with access to the admin panel sees the same queue.

## Admin Flow
- Right-hand panel shows incoming entries with environment metadata, attachments, and timestamps.
- Actions: “Mark To Do/Complete” (toggles status) and “Delete.”
- Counter card at the top summarises open vs resolved items to track progress during a testing session.

## Data Captured
- `name`, `contact`
- `issueType`, `severity`, `affectedArea`
- `description`, `steps`
- `image` (Data URL with original filename) + `imageName`
- `status` (To Do/Complete) + timestamp
- `environment` (browser user agent + viewport at submission time)

## Supabase Setup
1. Create a table called `feedback_reports` with the following columns (all nullable unless noted):
   - `id uuid primary key default gen_random_uuid()`
   - `name text`
   - `contact text`
   - `issue_type text`
   - `severity text`
   - `affected_area text`
   - `description text`
   - `steps text`
   - `image text`
   - `image_name text`
   - `status text default 'todo'`
   - `environment jsonb`
   - `created_at timestamp with time zone default now()`
   - Enable Row Level Security and allow inserts/updates/deletes for service role only (admin API uses the service key).
2. Add these env vars to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (used server-side only)
3. Optional: add storage bucket + RLS if/when we move screenshot uploads out of the table.

## Planned Enhancements
- Gate admin panel actions behind auth/role checks.
- Auto-capture source URL and provide device/OS pickers for faster filtering.
- Move screenshots to Supabase Storage and store a URL instead of an inline data URI.
- Add audit history for status changes once a backend exists.
