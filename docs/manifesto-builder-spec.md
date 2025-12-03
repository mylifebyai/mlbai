# MLBAI Manifesto Builder — Full Specification

## 1. Purpose

The Manifesto Builder is the first module in the MLBAI system. It guides the user through a deep, 30–60 minute AI-led interview, gathers detailed information across every major domain of life, and produces a personalized 2,000–3,000 word manifesto that reflects identity, struggles, goals, patterns, values, constraints, and mandatory habits. At the end:

1. A long-form manifesto is generated.
2. The user reviews and edits it with ChatGPT’s help.
3. The user approves the final version.
4. MLBAI generates long-term goals, short-term goals, and trackers.
5. A PDF is generated.
6. The user can view their manifesto and goals inside the app.
7. The manifesto is stored privately and not visible to admins.

## 2. High-Level Flow

### Step 1 — Start
- Explain duration (30–60 minutes).
- Explain privacy (strictly private, admin cannot access).

### Step 2 — Life Areas Scan
- Structured scan of: Physical Health, Mental Health, Diet & Eating Patterns, Sleep, Exercise/Fitness, Productivity, Work/Career/Business, Finances, Relationships/Family, Social Life, Home Environment, Emotional Life, Identity/Purpose, Creativity, Addictions/Destructive Behavior, and anything else the user mentions.
- For each area, ask Importance (1–10) and Pain (1–10).

### Step 3 — Deep Dives
- For high-importance AND high-pain domains, gather: history, triggers, attempts, failures, emotional patterns, internal dialogue, constraints, daily friction, ideal state, self-sabotage loops.

### Step 4 — Tangent Exploration
- When emotionally/practically significant items surface (trauma, shame, patterns, loneliness, money guilt, perfectionism, etc.), pause and ask 2–5 probing follow-ups before returning to the main flow.

### Step 5 — Stop Condition
- Do not write until: every major domain has been touched; high-pain/high-importance domains are deeply explored; tangents explored; can write several paragraphs per domain; user has nothing significant to add.

### Step 6 — Manifesto Draft (2,000–3,000 words)
- Generate: title, 1–2 sentence summary, multi-section long-form manifesto capturing identity, goals, obstacles, patterns, values, psychological drivers, long-term vision, mandatory habits.

### Step 7 — Feedback & Refinement
- Show draft; user can request rewrites, tone changes, emphasis changes, removals. Iterate until approved.

### Step 8 — Save Manifesto Privately
- Store privately/encrypted; only user can view; not visible to admins; warn user about privacy stance.

### Step 9 — Goals & Trackers Generation
- Long-term goals (6–12 months): vision, why it matters, obstacles, success definition, identity shifts.
- Short-term goals (2–4 weeks): controllable, simple, actionable, linked to long-term goals.
- Trackers: at least one per goal (examples: steps/week, calories, protein, resting HR, deep work blocks/week, net gain/loss, sleep hours, binge frequency, interactions, reach-outs).
- Mandatory habits: ask “Which habits must you do no matter what?” (wake-up time, diet adherence, exercise minimum, spending limits, etc.).

### Step 10 — User Reviews Goals
- User adjusts targets, marks goals as mandatory/flexible, confirms final set.

### Step 11 — PDF Export
- Provide PDF with manifesto, goals, trackers, mandatory habits.

### Step 12 — App Storage & Viewing
- “Manifesto & Goals” screen to view manifesto (read-only), goals, trackers; proceed to next module (Check-ins).

## 3. ChatGPT Behavior Ruleset

### General
- Act as a deep, reflective interviewer; supportive and emotionally intelligent.
- Maintain structure but allow tangents; avoid summarizing early; keep clarifying until saturation.

### Coverage
- Explore all major domains, even briefly.

### Depth
- For high-importance/pain/loaded domains, dig with: “Tell me more,” “What happens when…,” “How does it make you feel,” “What triggered this,” “Perfect version looks like what?”

### Tangents
- If shame/trauma/identity conflicts/relationship pain/self-sabotage/childhood influence/guilt/perfectionism/fear/burnout/avoidance appear, add 2–5 follow-ups before resuming flow.

### Stop Condition
- Only proceed to writing at 10/10 understanding of struggles, behaviors, patterns, goals, values, constraints, motivation, emotional reality.

## 4. Manifesto Requirements

- Length: 1,000–2,000 words; narrative, detailed, in user’s voice.
- Sections: Title; Summary; Physical Health; Mental Health; Diet & Food Relationship; Sleep; Fitness; Productivity; Work/Career/Business; Finances; Social Life; Relationships; Home Environment; Emotional Patterns; Core Obstacles; Identity Themes; Long-Term Vision; Mandatory Habits; Commitment Declaration.

## 5. Goals & Trackers System

- Long-Term Goals: 4–7 major goals; why it matters; success definition; obstacles.
- Short-Term Goals: 3–7 for first 30 days; measurable; simple; user-controlled; tied to long-term goals.
- Trackers: at least one per short-term goal (steps, sleep, calories, protein, binge episodes, spending, savings, deep work, mood, anxiety, social interactions, screen time, check-in consistency).
- Mandatory Habits: non-negotiables (wake time, nutrition adherence, daily movement, spending limits, etc.).

## 6. Privacy & Storage

- Manifesto: encrypted, user-only, not viewable by admins; user notified.
- Goals/Trackers: stored normally for later modules; can be updated/regenerated.
- PDF: downloadable by user only; not auto-shared.

## 7. Future Integration (design-friendly)

- Structure supports check-ins, adaptation, weekly review, daily prompts using manifesto summary, goals, trackers, and check-in data.

## 8. Implementation Notes (UI/backend prompts)

- Use the branch alias for Preview `PATREON_REDIRECT_URI`: `https://mlbai-git-feature-manifesto-builder-mlbais-projects.vercel.app/api/patreon/callback` (stable across deployments on this branch).
- Keep Production and Preview env vars separate in Vercel; adjust Preview to staging values when available; redeploy preview after env changes.
- All manifesto content and user responses should be treated as sensitive; scope database access so only the user can read their manifesto.
