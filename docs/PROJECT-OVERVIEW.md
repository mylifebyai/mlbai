# My Life, By AI – Project Overview & Plan (Audience-Aligned)

## 1. What This Project Is

"My Life, By AI" is a long‑form, real‑time documentary of a person who has failed at traditional self‑improvement over and over, using ChatGPT (Arthur) as a non‑judgmental life coach and system builder.

The project lives primarily on YouTube, but this site is the **home base** for:
- The documentary itself (what to watch, in what order).
- The systems and prompts behind the transformation.
- Written breakdowns of what works, what fails, and why.
- The community and, eventually, the app/Life OS that people can use themselves.

This document explains:
- Who we are building for.
- What problems we are solving for them.
- What makes this project different from other AI or self‑improvement content.
- How the website and tech stack support that mission.

---

## 2. Who This Is For

The core viewer is **the Serial Restarter** – someone who has tried to change their life many times and feels like they keep failing the same way.

### Demographics (high level)
- Primarily 25–55 years old.
- Global, with strong presence in US, UK, Australia, New Zealand, Canada.
- Mixed gender, slight female lean.
- Life stages: mid‑career professionals, parents, students, retirees.

### Psychographics
- Has tried "everything" before (multiple diets, gym memberships, self‑help books).
- Struggles with **consistency**, not information.
- Stuck in cycles: motivation → crash → guilt → restart.
- Often living with ADHD, anxiety, depression, chronic illness, or mobility issues.
- Feels isolated and ashamed of repeated failures.
- Tech‑comfortable but not necessarily tech‑savvy.
- Values **authenticity over polish**.

### Key Audience Segments

1. **The Weight Loss Desperates**  
   Repeated diet failures, often 50–150+ lbs to lose, health complications emerging or worsening. They need systems for meal planning, hunger management, emotional eating, and non‑scale victory tracking.

2. **The ADHD/Neurodivergent Organizers**  
   Diagnosed or suspected ADHD/autism/executive dysfunction. They have ideas but struggle with initiation, organization, and follow‑through. They need decision reduction, task breakdown, and gentle accountability without shame.

3. **The Vicarious Transformers**  
   Not ready to start themselves yet, but binge‑watching your journey to build courage. They want honest struggle, long‑form storytelling, and a community they can observe before joining.

---

## 3. Core Problems We’re Solving

From comments and behavior, the main pain points are:

- **Chronic failure cycles**  
  "I’ve tried dozens of diets", "Every diet’s always failed".

- **Lack of accountability**  
  "I quit when I’m winning", "I get depressed and just stay there".

- **Decision overload**  
  "Brain bombarded with ideas, never know where to start".

- **Cost barriers**  
  Can’t afford coaches, trainers, nutritionists, or therapists.

- **Shame and judgment**  
  Don’t want to talk to a real human about failures and health.

- **Complex health and neurodivergent realities**  
  Gout, prediabetes, OSA, insulin resistance, chronic pain, ADHD, autism, chronic fatigue.

- **Emotional eating and self‑sabotage**  
  Most people don’t quit from hunger; they quit from emotional overwhelm.

The project’s promise is:
- Your failures are not personal defects.
- Structure beats willpower.
- Accountability can be non‑judgmental.
- Systems can replace shame.

---

## 4. What Makes This Project Unique

This is not "AI content" for its own sake. It’s a **ChatGPT life coach documentary** for people who have failed repeatedly.

Key differentiators:

1. **Documented transformation, not theory**  
   - 70+ lbs lost, 8× job callback improvement, and 6+ months of sustained change.
   - Viewers can see the systems in action over time, not just before/after snapshots.

2. **Radical transparency about failure**  
   - Nachos, binges, skipped workouts, depressive episodes – they’re all on camera.
   - Failure is framed as data, not the end.

3. **"Failure is part of the system" philosophy**  
   - Goal: get back up faster, not never fall.
   - Relapse and recovery are designed into the protocols.

4. **Practical systems over motivation**  
   - Not selling willpower or pep talks.
   - Selling decision removal, structure, prompts, and adaptive plans.
   - "You don’t need answers, you need a system."

5. **ChatGPT as non‑judgmental human stand‑in**  
   - Human enough to feel accountable to, robot enough to not feel ashamed.
   - Personified as Arthur, which makes AI feel like a partner, not a tool demo.

6. **Whole‑life transformation, not single‑issue**  
   - Weight, career, mental health, mobility, food, planning – all connected.
   - One Life OS instead of a dozen separate hacks.

---

## 5. Content & Format Philosophy – The Vlogumentary

Every major piece of content aims to answer:

> I help **[who]** to **[what]** so they can **[why]**.

The format is a **vlogumentary** – a hybrid of:
- **Story** – real‑time, vulnerable documentation of struggle and change.
- **Science** – simple, visual explanations of what’s happening in the brain/body.
- **System** – concrete prompts, rules, and check‑ins people can copy.

Ideal narrative loop for episodes:

1. **The Problem (Story)**  
   Vulnerable hook about a real issue: exhaustion, cravings, identity drift, relapse.

2. **The Hypothesis (Science)**  
   A short explanation of the underlying psychology/biology.

3. **The System (Solution)**  
   Arthur + you design a protocol: rules, prompts, measurements.

4. **The Experiment (Story‑in‑Action)**  
   Vlog footage of trying the protocol – including failures and adjustments.

5. **The Reflection (Science + Story)**  
   Data, graphs, and emotional insights about what happened.

6. **The Integration (System)**  
   Takeaways viewers can apply, including copy‑paste prompts.

This loop gives viewers empathy (they feel seen), structure (they see a path), and understanding (they know why it works).

---

## 6. Website – Version 1 Scope

The v1 website is small on purpose. It exists to:

- Clearly state **who this is for**: people who have tried everything and are tired of failing alone.
- Explain **what the project is**: a ChatGPT life‑coach documentary + systems library.
- Direct visitors to **where to start**: the main YouTube channel and key flagship videos.
- Hint at **what’s coming next**: project logs, system guides, condition‑specific protocols, and an eventual app.

The v1 landing page should answer, quickly:

- "Is this for someone like me (serial restarter, ADHD, chronic conditions)?"
- "Will you actually show the failures, not just the highlights?"
- "Can I copy this system without paying for an expensive program?"

Primary call‑to‑action: **Start the documentary on YouTube**  
Channel: https://www.youtube.com/@MyLifeByAI

### 6.1 Current Landing Page Layout (Snapshot)

The current static HTML landing page (`index.html`) follows the brief in `docs/LANDING-PAGE-BRIEF.md`. A dev could recreate it from that brief plus this layout summary:

- **Hero**  
  Two-column layout (stacked on mobile):
  - Left: eyebrow line, main headline about letting AI help you rebuild your life, subtitle, supporting copy, primary YouTube CTA, secondary “learn more” link, and a reassurance line about failure as data.
  - Right: chat-style visual card for Arthur:
    - Circular orange-gradient avatar with 🤖.
    - Title: “Arthur, your AI life coach”; subtext about being non‑judgmental and always on.
    - Warm yellow chat bubble explaining this time uses tiny steps, clear rules, and no shame.
    - Input bar with “Type your message…” placeholder and an orange send button.

- **“What is My Life, By AI?”**  
  - Top: full-width beach photo in warm orange sunset tones (runner, shoreline, footprints) with a caption about people who keep restarting.
  - Below: heading, blockquote describing the experiment with Arthur, and three bullets (vlogumentary, who it’s for, failure-as-data).

- **Who this is for**  
  - Text-only section with four bullets describing Serial Restarters and a reassuring blockquote.

- **YouTube / Primary CTA**  
  Two-column layout:
  - Left: heading, description, three bullets (documentary episodes, tutorials, failure & recovery), repeated orange CTA button, and optional reassurance line.
  - Right: “video card” image with label (“Your journey, in chapters”), a gradient progress bar, a line like “Week 12 · Cravings & comeback · 42 min”, and three orange thumbnail blocks.

- **Why this site exists**  
  - Text-only section explaining the site as the organized home for systems, prompts, and deeper write-ups.

- **What’s coming next**  
  Two-column layout:
  - Left: heading, body text, and four small cards for “Project log”, “Systems library”, “Condition guides”, and “Behind the systems”.
  - Right: “Life OS” card – warm yellow panel with rows for Today (Checked in), Movement (15 / 30 min), Food plan (3 of 4 meals), and Energy & mood (Steady ↑).

- **Stay connected**  
  - Text section listing YouTube now and future Discord/email/Patreon, plus a closing reassurance that people can use the systems for free.

---

## 7. Tech Stack Plan

We’re choosing tools that make it easy to ship a simple landing page now and a richer hub later.

- **Framework**: Next.js  
  Static‑friendly, great SEO, and simple routing for future sections (logs, resources, app pages).

- **Language**: React + TypeScript  
  Type safety for faster iteration as systems and UI naturally grow more complex.

- **Styling**: Tailwind CSS or lightweight CSS Modules  
  Start with clean, minimal layouts. No heavy design system required.

- **Hosting**: Vercel (or similar)  
  Easy deployments from this repo, solid support for Next.js features, good performance.

Why this matters for the audience:
- Good SEO helps "struggling transformers" actually find this when they search.
- Fast, clean pages respect their limited energy and attention.
- A modern stack makes it realistic to ship tools (Life OS, protocols, downloads) on the same domain later.

---

## 8. Docs & Repo Structure

We use a `docs` folder to keep internal thinking and external copy aligned.

Planned docs:

- `docs/PROJECT-OVERVIEW.md`  
  This document – the audience‑aligned overview and plan.

- `docs/LANDING-PAGE-BRIEF.md`  
  Detailed content and structure for the landing page.

- `docs/AUDIENCE-ANALYSIS.md` (optional)  
  A lightly edited version of the full audience analysis you already created, for quick reference during future decisions.

- `docs/CONTENT-STRATEGY.md` (future)  
  How tutorials, documentary episodes, and systems content interlock.

- `docs/ROADMAP.md` (future)  
  Concrete milestones for the channel, site, community, and app.

---

## 9. Roadmap (High Level)

**Phase 1 – Foundations**
- Capture the audience analysis and POV in docs.
- Ship a v1 landing page that speaks directly to Serial Restarters.
- Make the YouTube channel the clear starting point.

**Phase 2 – Storytelling Hub**
- Add guides to "what to watch first" and episode paths (e.g., weight‑loss arc, job‑search arc, ADHD systems arc).
- Create simple written summaries for key videos (problem → system → result).

**Phase 3 – Systems Hub**
- Publish copy‑paste prompts and protocols (weight loss, ADHD planning, job search, etc.).
- Add condition‑specific guides (e.g., insulin resistance, chronic pain, ADHD).
- Document how to adapt the Life OS to other AI tools if needed.

**Phase 4 – Community & App**
- Integrate Discord/Patreon/email into the site as the community backbone.
- Begin exposing the Life OS/app as a productized system.
- Keep content and tools affordable and non‑exploitative.

---

## 10. Principles We’ll Follow

- **Radical honesty**  
  Show the whole cycle: relapse, regret, and recovery. This is the moat.

- **System over motivation**  
  Always pair the "why" with the "how" and the actual prompts.

- **Fail forward**  
  Treat failure as data and design recovery into every protocol.

- **Accessibility and replicability**  
  Use tools and workflows that viewers can realistically copy, even without a big budget.

- **Protect the audience**  
  Avoid exploitative monetization, respect privacy concerns, and be explicit about what AI can’t replace (e.g., professional mental health care).

- **Warm, non-intimidating visual tone**  
  Use a calm orange-and-white palette (like the current landing page: warm creams, light peaches, and soft orange CTAs) so the design feels friendly and safe rather than clinical or high-pressure.

- **Community over algorithm**  
  Prioritize the people who are changing their lives with this system over chasing trends or purely viral formats.
