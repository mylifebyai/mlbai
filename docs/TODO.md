Context / memory anchor (what we’re building)
- Users draft a manifesto across the streamlined sections (Physical, Mental/Emotional, Diet & Movement, Work & Money, Relationships/Family/Social, Home/Environment, Identity & Purpose, Obstacles & Loops, Other).
- GPT acts as a deep reviewer per section: it reads what’s written, asks targeted follow-ups based on the user’s text, leaves inline comments/questions, rewrites the section, and iterates until it’s a 10/10 (rich enough that plans can be built from it). Users can edit anytime and resubmit; GPT keeps asking until quality is high and specific, not surface level.
- Once sections are approved, GPT generates the full manifesto (length as needed; detailed/verbose, not a summary) and we run a refinement loop on the full draft. Then we generate goals, trackers, and mandatory habits, with user review/approval. Finally we support PDF export and polish/privacy/QA.

[x] Step 1: Scaffold Manifesto Builder route/page with basic layout and feature gating.
[x] Step 2: Build and test the chat-style scaffold (local-only).
[x] Step 3: Pivot to section-based editor (streamlined sections + “Other”).
    - [x] Implement per-section text areas and status chips (draft/in review/complete).
    - [x] Keep placeholders; no per-section importance rating.
    - [x] Update UI/spec to reflect streamlined sections: Physical, Mental/Emotional, Diet & Movement, Work & Money, Relationships/Family/Social, Home/Environment, Identity & Purpose, Obstacles & Loops, Other.
[x] Step 4: Wire backend persistence (endpoint + storage) for manifesto drafts (section content + status, user-owned).
[ ] Step 5: Add per-section review/refine loop (GPT: follow-ups + revised section text; user can edit/approve).
    - [x] Extend section data model to store review artifacts (questions/comments, user replies, AI rewrite, rating, rationale, iteration count/history) and persist them.
    - [x] Add per-section review API contract/handler (input: section id/content/replies/include flag; output: follow-ups/comments, rewrite, rating/rationale); stub GPT call first.
    - [x] Build per-section UI block for “Review with AI” (start review, show questions/comments, capture replies, show rewrite + rating/rationale, allow manual edits).
    - [ ] Wire the iteration loop (resubmit with answers until rating hits 10/10; user can mark complete/approve; edits always allowed).
    - [ ] Respect include/skip flag and add loading/error handling and state transitions.
[ ] Step 6: Generate manifesto from approved sections; add refinement loop for the full draft.
[ ] Step 7: Generate goals + trackers + mandatory habits from the approved manifesto; add review/approve UI.
[ ] Step 8: Implement PDF export (manifesto + goals + trackers + habits).
[ ] Step 9: Final polish: privacy messaging, loading/empty states, navigation entry, QA.
