# Manifesto TODO / Notes

## Completed
- [x] Two-column Manifesto workspace (`src/app/manifesto/ManifestoWorkspace.tsx`): rich text editor on the left; ChatGPT panel on the right.
- [x] Persistence to Supabase drafts via `/api/manifesto-draft` (load on visit, autosave with debounce using the current user’s access token); keeps local edits if the server draft is empty; shows save states.
- [x] Formatting controls + shortcuts (bold, italic, underline, bullets, heading) on the editor toolbar.
- [x] Chat assistant reads the full manifesto and responds with concise feedback/rewrites; endpoint updated (`src/app/api/manifesto-chat/route.ts`).
- [x] Assistant endpoint sends manifesto HTML + plain text to OpenAI (`gpt-4o-mini`) and returns `assistantMessage` JSON responses; handles missing API key gracefully.
- [x] Page gating respects `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED`; uses existing `manifesto_drafts` schema.
- [x] UI refresh: new hero/header, gradient background, elevated cards for editor/chat, improved message alignment, and save status chips on the manifesto page.

## Business logic and behavior
- Editor captures HTML and strips a plain-text version for the assistant; empty drafts trigger gentle nudges to start writing.
- Autosave: if signed in, drafts load from `manifesto_drafts` and auto-save on edits (debounced); we avoid clobbering unsaved local edits when the server draft is empty.
- Chat responses stay concise (2–5 sentences) and grounded in the provided draft; uses a JSON-only contract from the model.
- Word count shown for quick size checks; clear button empties the draft locally.
- Single textbox used for all content; assistant considers the whole draft.

## Next step (priority)
- [ ] Allow the assistant to write directly into the manifesto editor (e.g., insert suggested text when the user asks “what should I type?”), with clear UX/controls to accept, edit, or undo suggestions.
  - [x] Insert as italicized suggestion appended below current text (initial behavior); avoid overwriting existing content; auto-append when the user asks for suggestions or when the assistant recommends changes.
  - [ ] Provide explicit apply/undo controls or a quick “remove suggestion” action.
  - [ ] Decide cursor placement (append vs. at selection) and show what changed.
  - [ ] Throttle/guard autosave so suggestions aren’t permanently saved before user confirmation.
  - [ ] Consider version restore to the last saved draft for safety.

## Open questions / later
- [ ] Add markdown-like shortcuts (e.g., `##` for headings) and refine toolbar UX.
- [ ] Decide on autosave cadence, versioning, and conflict handling if multiple sessions edit.
- [ ] If we reintroduce sectioning later, add section anchors or multiple panes so the assistant can target areas precisely.

## Environment and dependencies
- Requires `OPENAI_API_KEY` for `/api/manifesto-chat`.
- Feature flag: `NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED` gates the page.
