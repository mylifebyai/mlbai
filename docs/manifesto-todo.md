# Manifesto TODO / Notes

## Latest work
- Added two-column Manifesto workspace (`src/app/manifesto/ManifestoWorkspace.tsx`): rich text editor on the left for long-form drafting; ChatGPT panel on the right that answers questions using the current draft.
- Wired manifesto editor to Supabase drafts via `/api/manifesto-draft` (load on visit, autosave with debounce using the current user’s access token); keeps local edits if the server draft is empty; shows save states.
- Added formatting controls + shortcuts (bold, italic, underline, bullets, heading) on the editor toolbar.
- Chat assistant reads the full manifesto and responds with concise feedback/rewrites; endpoint updated (`src/app/api/manifesto-chat/route.ts`).
- Assistant endpoint sends manifesto HTML + plain text to OpenAI (`gpt-4o-mini`) and returns `assistantMessage` JSON responses; handles missing API key gracefully.
- Page gating still respects `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED`; no schema changes beyond using existing `manifesto_drafts`.
- UI refresh: new hero/header, gradient background, elevated cards for editor/chat, improved message alignment, and save status chips for the manifesto page.

## Business logic and behavior
- Editor captures HTML and strips a plain-text version for the assistant; empty drafts trigger gentle nudges to start writing.
- Autosave: if signed in, drafts load from `manifesto_drafts` and auto-save on edits (debounced); we avoid clobbering unsaved local edits when the server draft is empty.
- Chat responses stay concise (2–5 sentences) and grounded in the provided draft; uses a JSON-only contract from the model.
- Word count shown for quick size checks; clear button empties the draft locally.
- Single textbox used for all content; assistant considers the whole draft.

## Open questions / next steps
- Add markdown-like shortcuts (e.g., `##` for headings) and refine toolbar UX.
- Decide on autosave cadence, versioning, and conflict handling if multiple sessions edit.
- If we reintroduce sectioning later, add section anchors or multiple panes so the assistant can target areas precisely.

## Environment and dependencies
- Requires `OPENAI_API_KEY` for `/api/manifesto-chat`.
- Feature flag: `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED` gates the page.
