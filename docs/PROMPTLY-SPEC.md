# Promptly – Prompt Helper Page (v1 Spec)

This document captures the goals, flow, and implementation plan for the `/promptly` page in the MLBAI site.

---

## 1. Purpose & Goals

Promptly exists to help people who feel “bad at prompts” get to a **copy‑paste‑ready prompt** for their situation, without needing “magic prompt” knowledge.

Primary goals:

- Encode the principles from the Prompt Guide:
  - Conversation over “magic prompts”.
  - Talk like a human.
  - Add context, not just constraints.
  - Ask clearly for what you want back.
  - Give ChatGPT a role/perspective.
  - Course‑correct fast and use chain prompting.
  - Ask for clarifying questions.
  - Meta‑prompting (let the AI improve your prompt).
  - Rubrics (ACUC / self‑designed) as a reality check.
- Work **without login** and **without Supabase** in v1.
- Make the **current best prompt** always visible and easy to copy while chatting.

---

## 2. High‑Level UX Flow

Route: `/promptly`

Sections:

1. **Hero / Intro**
   - Short explanation of what Promptly does:
     - “Tell me what you’re trying to do; I’ll interview you and build the prompt with you.”
   - Reinforce: “No magic prompts, just conversation.”

2. **Step 1 – Choose starting point**
   - Two options:
     - **A. Improve an existing prompt** – “I already have a prompt. Help me make it better.”
     - **B. Start from scratch** – “I don’t have a prompt yet. Help me build one.”

3. **Main interaction: chat + current prompt panel**
   - Layout:
     - Left: conversational UI.
     - Right: “Current prompt” sidebar.
   - Left (chat):
     - Messages between user and “Promptly”.
     - Input box where the user types in plain language.
   - Right (prompt sidebar):
     - Title: “Current recommended prompt”.
     - Read‑only text area / code block with the current `promptDraft`.
     - “Copy prompt” button.
     - Small note like: “Paste this into ChatGPT (or your AI tool of choice). Keep chatting here to refine it further.”

4. **Finish state**
   - Assistant explicitly states when the prompt is solid:
     - “Here’s the prompt I recommend based on everything you’ve told me. You can keep tweaking it with me, or copy it now.”
   - Optional “Start a new prompt” / “Reset” control to clear chat + promptDraft.

---

## 3. Promptly’s “Brain” (Business Logic)

Promptly is just a conversational UI on top of a single ChatGPT instance that is primed with your principles and given a clear job:

- **Job:** Co‑create a high‑quality prompt with the user over multiple messages.
- **Output:** After each exchange, update:
  - A natural‑language assistant reply (for the chat).
  - A best‑so‑far `promptDraft` string (for the sidebar).

### 3.1 Modes

2 modes, chosen at the start:

- **Mode A – Improve existing prompt**
  - Ask user to paste their current prompt.
  - Use **meta‑prompting** heavily:
    - “What’s missing, what should be added, what categories matter?”
  - Ask clarifying questions based on the prompt and goal.
  - Continuously rewrite the prompt into a clearer, more complete version.

- **Mode B – Build prompt from scratch**
  - Start with: “What are you trying to do?” and “Where are you stuck?”
  - Pull out:
    - Goal / task.
    - Context and story (history, failures, environment).
    - Constraints (time, budget, tools, health, etc.).
    - Desired role (coach, nutritionist, writer, project manager, etc.).
    - Desired output format (plan, checklist, script, table, etc.).
  - Gradually assemble the prompt from these pieces.

### 3.2 Diagnostic & Technique Selection

Before diving into questioning, Promptly should run a lightweight diagnostic:

- Ask: “What’s breaking in your current prompt or what’s missing?” (e.g., not enough context, unclear format, wrong role, no rubric, etc.).
- Based on the answer, recommend one or two techniques from the Prompt Guide (clarifying questions, role assignment, meta-prompting, rubrics, etc.).
- Explain why: “Sounds like we should lean on clarifying questions + role assignment.” This helps users understand the plan.
- As the conversation evolves, Promptly can switch or stack techniques, but it should keep the user aware of which levers it’s pulling.

Only after the diagnostic does Promptly begin the deeper interview / rewrite phase.

### 3.3 Techniques to apply (driven by system prompt)

For both modes, Promptly should:

- **Use clarifying questions** (Section 8 of the guide):
  - Proactively ask “What else do I need to know?”.
  - Group questions into logical categories when helpful (e.g., goals, constraints, habits).
- **Add context, not just constraints**:
  - Encourage the user to share their story, not just the target output.
- **Ask clearly for what they want back**:
  - “What kind of answer do you want ChatGPT to give you — a list, a day plan, a script, a schedule, a table?”
- **Assign a role / perspective**:
  - Suggest and incorporate roles:
    - “fitness coach”, “nutritionist”, “project manager”, “interior designer”, etc.
- **Course‑correct fast and chain prompt**:
  - Treat every user reply as a chance to refine the prompt.
  - Never assume the first version of the prompt is final.
- **Meta‑prompt at the end (especially in Mode A)**:
  - Once there’s a working draft, ask the model to critique and re‑write the prompt itself for clarity and completeness.
- **Rubric / ACUC on the prompt**:
  - Before returning an updated `promptDraft`, run a mini‑check:
    - **Accuracy** – matches what the user said.
    - **Completeness** – includes goal, context, constraints, role, output format where applicable.
    - **Usefulness** – is copy‑pastable and specific, not vague inspiration.
    - **Clarity** – plain language, not jargon.
  - If any category fails, refine before returning.

### 3.4 Response structure from the backend

Each backend call returns structured data, not just a single message:

- `assistantMessage`: string – what appears in the chat.
- `promptDraft`: string – the current best prompt for the right‑hand panel.
- (Optional later) `techniqueLabel`: string – e.g., “Clarifying questions + meta‑prompting” for analytics or future UI hints.

The system prompt for the OpenAI call will:

- Encode the principles above.
- Instruct the assistant to always return both `assistantMessage` and `promptDraft`.
- Emphasize that it must **not** try to do everything in one response; it should ask questions and iteratively improve.

---

## 4. State & Data Flow (v1)

### 4.1 No Supabase required (v1)

For Promptly v1, we keep state in the browser and in the Next.js API:

- **Client-side (React state)**:
  - `mode` – “improve-existing” or “new”.
  - `messages` – array of `{ role: "user" | "assistant", content: string }`.
  - `isLoading` – whether we’re waiting on a response.

- **Persistence**:
  - Optional: mirror `messages` and `promptDraft` into `localStorage` so a refresh doesn’t wipe the session.
  - No Supabase tables or user accounts.

### 4.2 Request/response loop

1. User chooses mode and sends a message.
2. Frontend appends that message to `messages` and calls `/api/promptly` with:
   - `mode`
   - `messages`
3. `/api/promptly`:
   - Builds the OpenAI request with:
     - System message encoding the Promptly spec / principles.
     - Conversation history (`messages`).
     - Response format forcing JSON with `assistantMessage`.
   - Calls the model.
   - Returns JSON with `assistantMessage` (which includes the conversational reply and fenced prompt block when available).
4. Frontend:
   - Pushes `assistantMessage` into `messages`.

### 4.3 When to bring in Supabase (later)

Supabase becomes useful for:

- Login and saved prompts across devices.
- “My Prompt Library” with tags, dates, and outcomes.
- Analytics on which techniques/modes are used most.
- Sharing prompts with the community.

None of this is required for a solid v1; the first version is intentionally lightweight.

---

## 5. UI Layout & Components (Implementation Sketch)

Route: `web/src/app/promptly/page.tsx` (client component).

Suggested component structure:

- `<PromptlyPage />`
  - `<PromptlyHero />` – short intro + “no magic prompts” message.
  - `<ModeSelector />` – radio buttons or cards:
    - “Improve an existing prompt”
    - “Start from scratch”
  - `<PromptlyLayout />` – two‑column layout:
    - Left: `<PromptChat />`
      - Renders `messages`.
      - Input box + send button.
      - Shows loading indicator between turns.
    - Right: `<PromptSidebar />`
      - Shows the `promptDraft`.
      - “Copy prompt” button.
      - Short usage note.
      - Maybe a tiny “Technique in use: clarifying questions + meta‑prompting” label later.

Styling notes:

- Reuse existing typography, card styles, and layout grid from the main page (`globals.css`).
- Maintain the same warm, calm visual tone.
- Keep the chat and prompt sidebar visually distinct but cohesive.

---

## 6. v1 Scope & Non‑Goals

**In scope:**

- New `/promptly` page integrated into the existing Next.js app.
- Interactive chat that:
  - Asks clarifying questions.
  - Builds/updates a prompt over multiple turns.
  - Always shows a “current prompt” panel with copy button.
- OpenAI integration via a single Next.js API route.

**Out of scope for v1:**

- User accounts, authentication, and saved prompt libraries.
- Analytics dashboards.
- Multi‑user collaboration.
- Detailed Supabase data models.

These can be layered on later once Promptly has proven utility.

---

## 7. Success Criteria (v1)

Promptly v1 is successful if:

- A new user can arrive with either:
  - A vague sense of what they want, or
  - A messy prompt they’re unhappy with,
  and leave with a **clear, specific, copy‑pastable prompt** they understand.
- Users feel guided, not judged:
  - The assistant feels like a coach interviewing them, not a form they have to fill perfectly.
- The right‑hand “Current prompt” panel updates often enough that users can see their answers shaping the prompt.
- The implementation is simple enough to iterate on:
  - Single page.
  - Single API route.
  - No hard dependency on Supabase in v1.
