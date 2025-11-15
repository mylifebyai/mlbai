import Image from "next/image";

const stats = [
  { value: "70+ lbs", label: "Weight lost while filming the documentary" },
  { value: "8×", label: "Increase in job callbacks using Arthur’s prompts" },
  {
    value: "167K+",
    label: "Views on the full “How I Lost 50 Pounds with ChatGPT” tutorial",
  },
  { value: "24/7", label: "Accountability without judgment — AI never sleeps" },
];

const futureSections = [
  {
    title: "Project log",
    copy:
      "Short written updates that track experiments and setbacks between videos.",
  },
  {
    title: "Systems library",
    copy:
      "The exact prompts and protocols for weight loss, ADHD planning, job search, and more.",
  },
  {
    title: "Condition guides",
    copy: "How I use AI alongside challenges like insulin resistance or chronic pain.",
  },
  {
    title: "Behind the systems",
    copy:
      "How I maintain my manifesto, handle AI memory limits, and adapt when tools change.",
  },
];

export default function Home() {
  return (
    <>
      <header id="top" className="site-header">
        <div className="wrapper">
          <nav>
            <div className="brand">
              <span className="brand-icon">AI</span>
              My Life, By AI
            </div>
            <div className="nav-links">
              <a href="#what">Project</a>
              <a href="#who">Who it’s for</a>
              <a href="#youtube">Watch</a>
              <a href="#next">Future</a>
            </div>
            <a
              className="cta-primary"
              href="https://www.youtube.com/@MyLifeByAI"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube
            </a>
          </nav>
        </div>
        <div className="wrapper hero">
          <div className="hero-grid">
            <div>
              <ul className="pill-list" aria-label="Project pillars">
                <li>Real-time documentary</li>
                <li>Systems, not willpower</li>
                <li>ChatGPT life coach</li>
              </ul>
              <span className="hero-eyebrow">
                A different kind of self-improvement story
              </span>
              <h1>Let AI help you rebuild a life you actually want to live.</h1>
              <p className="hero-subtitle">
                A real-time documentary of someone who failed at diets and
                self-help for years, rebuilding life with a non-judgmental AI coach.
              </p>
              <p className="hero-support">
                If you&apos;ve tried everything and still feel stuck, this project is
                for you.
              </p>
              <div className="cta-row">
                <a
                  className="cta-primary"
                  href="https://www.youtube.com/@MyLifeByAI"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start the documentary on YouTube
                </a>
                <a className="cta-secondary" href="#what">
                  Or learn what this is all about
                </a>
              </div>
              <p className="hero-support">
                No hype, no perfection. Just one human, one AI, and a system that
                treats failure as data.
              </p>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-orb" />
              <div className="chat-shell">
                <div className="chat-header">
                  <div className="chat-avatar">
                    <span role="img" aria-label="Robot emoji">
                      🤖
                    </span>
                  </div>
                  <div>
                    <div className="chat-header-title">Arthur, your AI life coach</div>
                    <div className="chat-header-sub">
                      Non-judgmental. Always on. Built for restarts.
                    </div>
                  </div>
                </div>
                <div className="chat-message">
                  <strong>Hey, I see you.</strong>
                  <br />
                  You’ve tried to change before. This time we’re doing it differently:
                  tiny steps, clear rules, and no shame when you fall off. Ready to
                  design the system around your real life?
                </div>
                <div className="chat-input">
                  <span>Type your message…</span>
                  <div className="chat-input-button">
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12L4 4l16 8-16 8 1-8 9-0.02z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="what">
          <div className="wrapper section-content">
            <div className="image-photo-container">
              <h2>What is “My Life, By AI”?</h2>
              <figure className="image-photo-frame image-photo-inline">
                <Image
                  src="/images/beach-sunset-runner.png"
                  alt="Person running along the shoreline at sunset, leaving footprints in the sand."
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="image-photo-overlay" />
                <figcaption className="image-photo-caption">
                  Built for people who keep restarting.
                  <span>
                    One more evening on the beach. One more chance to rebuild differently—with
                    AI keeping you company in every step.
                  </span>
                </figcaption>
              </figure>
              <blockquote>
                &quot;My Life, By AI&quot; is an ongoing experiment in letting ChatGPT act as my
                life coach, project manager, and accountability partner. I’ve failed at
                diets, routines, and self-help more times than I can count. Instead of hiding
                that, I document it. Together with my AI coach (Arthur), I’m rebuilding my
                life using systems, not willpower — and showing you everything, including the
                relapses.
              </blockquote>
              <ul>
                <li>
                  A <strong>vlogumentary</strong>: real-time documentary + systems + simple
                  science.
                </li>
                <li>
                  For people who have <strong>tried everything and are tired of failing
                  alone</strong>.
                </li>
                <li>
                  Built around the idea that <strong>failure is data</strong>, not a dead end.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="proof">
          <div className="wrapper section-content">
            <div>
              <h2>Documented change in real time</h2>
              <p className="section-note">
                Every number comes from something we’ve actually shipped with AI help —
                weight lost, jobs landed, people inside the community rebuilding alongside us.
              </p>
            </div>
            <div className="stats">
              {stats.map((stat) => (
                <div key={stat.label} className="stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="who">
          <div className="wrapper section-content">
            <div>
              <h2>If this sounds like you, you’re in the right place</h2>
              <blockquote>
                &quot;My Life, By AI&quot; is an ongoing experiment in letting ChatGPT act as my
                life coach, project manager, and accountability partner. I’ve failed at
                diets, routines, and self-help more times than I can count. Instead of hiding
                that, I document it. Together with my AI coach (Arthur), I’m rebuilding my
                life using systems, not willpower — and showing you everything, including the
                relapses.
              </blockquote>
              <ul>
                <li>
                  A <strong>vlogumentary</strong>: real-time documentary + systems + simple
                  science.
                </li>
                <li>
                  For people who have <strong>tried everything and are tired of failing
                  alone</strong>.
                </li>
                <li>
                  Built around the idea that <strong>failure is data</strong>, not a dead end.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="who">
          <div className="wrapper section-content">
            <div>
              <h2>If this sounds like you, you’re in the right place</h2>
              <ul>
                <li>
                  You’ve tried diets, routines, and planners for years — and you’re exhausted
                  by the cycle of restart → crash → guilt.
                </li>
                <li>
                  You live with ADHD, anxiety, depression, chronic pain, or other conditions
                  that make “just try harder” advice useless.
                </li>
                <li>
                  You want structure and accountability but <strong>can’t afford</strong> a
                  coach, trainer, or therapist for everything.
                </li>
                <li>
                  You’re curious whether an AI you can talk to in private could be the missing
                  piece.
                </li>
              </ul>
            </div>
            <blockquote>
              You’re not broken and you’re not alone. You just haven’t had a system built
              for how your brain and life actually work.
            </blockquote>
          </div>
        </section>

        <section id="approach">
          <div className="wrapper section-content">
            <div>
              <h2>How the system works</h2>
              <p className="section-note">
                Every episode rotates between story, science, and system so you always know
                what happened, why it happened, and how to recreate it with your own AI
                teammate.
              </p>
            </div>
            <div className="cards">
              <article className="card">
                <h3>Story</h3>
                <p>
                  Radically honest vlogumentary episodes that show the restarts, cravings,
                  wins, and setbacks in real time.
                </p>
              </article>
              <article className="card">
                <h3>Science</h3>
                <p>
                  Simple explanations of what’s happening in your brain and body — dopamine
                  loops, hunger cues, executive dysfunction.
                </p>
              </article>
              <article className="card">
                <h3>System</h3>
                <p>
                  Copy-paste prompts, decision rules, check-ins, and dashboards built with
                  ChatGPT so you can run the protocol yourself.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="youtube">
          <div className="wrapper section-content section-split">
            <div>
              <h2>Watch the ChatGPT life coach documentary</h2>
              <p>
                The main story happens on YouTube. That’s where you’ll see every weigh-in,
                every relapse, every system tweak, and every win — in real time.
              </p>
              <ul>
                <li>
                  <strong>Documentary episodes</strong> – long-form, binge-able videos
                  showing the journey.
                </li>
                <li>
                  <strong>Full tutorials</strong> – copy-paste prompts and systems for weight
                  loss, job search, and more.
                </li>
                <li>
                  <strong>Failure and recovery</strong> – episodes where things fall apart and
                  we rebuild.
                </li>
              </ul>
              <div className="cta-row">
                <a
                  className="cta-primary"
                  href="https://www.youtube.com/@MyLifeByAI"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start watching on YouTube
                </a>
                <p className="hero-support">
                  If you’re not ready to start yet, you can just watch. A lot of people do
                  that first.
                </p>
              </div>
            </div>
            <div className="video-embed-card">
              <div className="image-label">Featured episode</div>
              <div className="video-frame">
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/z7UVnzp0Wyc?si=8zNYatzlKOI_uvDQ"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        <section id="why">
          <div className="wrapper section-content">
            <div>
              <h2>Why this site exists</h2>
              <p>
                YouTube is great for watching the journey, but terrible for keeping systems,
                prompts, and resources organized.
              </p>
              <p>
                This site is the home base for &quot;My Life, By AI&quot; — a place to collect the
                exact systems I use, the prompts you can copy, and the behind-the-scenes
                notes that don’t fit in a video description.
              </p>
              <ul>
                <li>
                  Find <strong>where to start</strong> in the documentary, based on your
                  situation.
                </li>
                <li>
                  Get <strong>written breakdowns</strong> of key systems and episodes.
                </li>
                <li>
                  Explore <strong>condition-specific guides</strong> (ADHD, insulin
                  resistance, chronic pain, etc.) as they release.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="next">
          <div className="wrapper section-content section-split">
            <div>
              <h2>What’s coming next</h2>
              <p>
                This is the first version of the site. Over time, it will grow into a hub for
                people who want to build their own AI-powered Life OS.
              </p>
              <div className="cards">
                {futureSections.map((section) => (
                  <article className="card" key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.copy}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="image-card" aria-hidden="true">
              <div className="image-label">Your AI-powered Life OS</div>
              <div className="image-os-frame">
                <div className="image-os-row">
                  <span>Today</span>
                  <span className="image-os-pill">Checked in</span>
                </div>
                <div className="image-os-row">
                  <span>Movement</span>
                  <span>15 / 30 min</span>
                </div>
                <div className="image-os-row">
                  <span>Food plan</span>
                  <span>3 of 4 meals</span>
                </div>
                <div className="image-os-row">
                  <span>Energy &amp; mood</span>
                  <span>Steady ↑</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="voices">
          <div className="wrapper section-content section-split">
            <div>
              <h2>What the community says</h2>
              <p>
                People who thought they had “tried everything” keep showing up because the
                system treats failure differently.
              </p>
              <ul>
                <li>
                  “I watched the entire 100-day video in one sitting. It finally felt like
                  someone understood the shame cycle.”
                </li>
                <li>
                  “Arthur helped me land 8 out of 10 interviews. I’ve never had that success
                  rate.”
                </li>
                <li>
                  “Your prompts are the only reason I’ve stayed consistent for 6 weeks.”
                </li>
              </ul>
            </div>
            <div className="card">
              <h3>Why people trust this</h3>
              <p>- It’s filmed in public. You see the relapse before the rebuild.</p>
              <p>- Nothing is hidden behind a paywall. If we use a prompt, you get it too.</p>
              <p>
                - Arthur is a character, but the results are real: lower A1C, smaller belts,
                calmer mornings, better jobs.
              </p>
              <p>
                - The community is growing, but the promise stays the same: systems over
                shame.
              </p>
            </div>
          </div>
        </section>

        <section id="stay">
          <div className="wrapper section-content">
            <div>
              <h2>Stay connected</h2>
              <ul>
                <li>
                  YouTube channel:{" "}
                  <a
                    href="https://www.youtube.com/@MyLifeByAI"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @MyLifeByAI
                  </a>
                </li>
                <li>Discord community (coming soon)</li>
                <li>Email list for system updates (coming soon)</li>
                <li>Patreon or membership for deeper access (if active)</li>
              </ul>
              <blockquote>
                Whether you ever join a community or not, you’re welcome to use the systems
                here for free.
              </blockquote>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>
          © {new Date().getFullYear()} My Life, By AI. Built with systems, not willpower.
        </p>
      </footer>
    </>
  );
}
