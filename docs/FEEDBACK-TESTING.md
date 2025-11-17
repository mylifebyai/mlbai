# Tester Feedback Workspace

## Purpose
- Capture bugs, content issues, and UX polish items during internal testing without waiting on auth or backend wiring.
- Give admins a lightweight reviewing surface with status toggles directly inside the app.
- Document the additional signals we plan to collect once persistence/login is ready.

## Access Points
- **Floating CTA:** The “Report an issue” round button sticks to the bottom-right corner of every page. It links to `/feedback`.
- **Direct URL:** Navigate to `https://<site>/feedback` for the full submission + review experience.

## Tester Flow
- Fill in optional name + contact so we know who to follow up with.
- Categorize the issue (type + severity) and describe the affected page or component.
- Share a short summary plus reproducible steps.
- Drag-and-drop or click to upload one screenshot (PNG/JPEG/WebP/GIF). We validate MIME type client-side.
- Browser + viewport info auto-populates when the entry is created.
- Submissions persist in the browser’s `localStorage` for now. Clear storage if you need to reset.

## Admin Flow
- Right-hand panel shows incoming entries with environment metadata, attachments, and timestamps.
- Actions: “Mark To Do/Complete” (toggles status) and “Delete.”
- Counter card at the top summarises open vs resolved items to track progress during a testing session.

## Data Captured
- `name`, `contact`
- `issueType`, `severity`, `affectedArea`
- `description`, `steps`
- `image` (Data URL with original filename)
- `status` (To Do/Complete) + timestamp
- `environment` (browser user agent + viewport at submission time)

## Planned Enhancements
- Persist entries to Supabase (or Airtable) so testers and admins share one queue.
- Gate admin panel actions behind auth/role checks.
- Auto-capture source URL and provide device/OS pickers for faster filtering.
- Support multiple attachments plus file-type validation via an upload service (Supabase Storage, UploadThing, etc.).
- Add audit history for status changes once a backend exists.
