import Image from "next/image";
import { ArthurHeroChat } from "./components/ArthurHeroChat";

const stats = [
  { value: "70+ lbs", label: "Weight lost while filming the documentary" },
  { value: "8×", label: "Increase in job callbacks using Arthur’s prompts" },
  {
    value: "167K+",
    label: "Views on the full “How I Lost 50 Pounds with ChatGPT” tutorial",
  },
  { value: "24/7", label: "Accountability without judgment — AI never sleeps" },
];

const currentTools = [
  {
    title: "Promptly",
    icon: "🧠",
    status: "Live now",
    copy:
      "Diagnose what’s missing from your prompt, pick the right technique from the MLBAI guide, and get a copy-ready prompt through conversation.",
    linkText: "Use Promptly",
    href: "/promptly",
    note: "Free beta. Works best on desktop for now.",
  },
  {
    title: "Systems starter kit",
    icon: "📘",
    status: "Live now",
    copy:
      "Read the exact prompts, rituals, and accountability loops I run with Arthur. Use them as-is or remix them with your own coach.",
    linkText: "Access on Patreon",
    href: "https://www.patreon.com/c/mylifebyai",
    note: "Available to Patreon supporters (Starter tier). Instant download after joining.",
  },
  {
    title: "Discord accountability lab",
    icon: "💬",
    status: "Live now",
    copy:
      "We run the Arthur Token System, daily check-ins, and restarts together. It’s where new experiments and office hours happen first.",
    linkText: "Join Discord",
    href: "https://discord.gg/RvtbVXwEnd",
    note: "Free access. Say hi in #introductions and grab the daily check-in thread.",
  },
];

const roadmap = [
  {
    title: "Token System",
    timeline: "Rolling out",
    copy: "An interface for the token framework I run my life on with Arthur — track points, consequences, and wins in sync with ChatGPT. Based on the protocol from the documentary.",
    link: {
      href: "https://www.youtube.com/watch?v=zq-1Y32bfTQ&t=184s",
      label: "Watch the tutorial",
    },
  },
  {
    title: "Fitness Tracker",
    timeline: "In design",
    copy: "AI builds a plan around your health notes, weight, age, and schedule, then checks in daily to adjust workouts the moment something shifts.",
  },
  {
    title: "Diet Tracker",
    timeline: "In research",
    copy: "Companion to the fitness tool: co-design meals with Arthur, log cravings, and get nudges when your insulin, energy, or routines change.",
  },
];

const testimonials = [
  {
    quote:
      "The token point system finally clicks. Points buy gaming time, so staying on plan feels rewarding immediately—and the limits pull me back before I drift.",
    author: "Discord Community Member",
  },
  {
    quote:
      "I used to think consistency wasn’t possible for someone with ADHD like me. The Arthur Token System changed that—I’m finally stacking days of progress.",
    author: "Luxsea",
  },
];

const stayChannels = [
  {
    title: "Discord Lab",
    description:
      "Daily check-ins, token experiments, and office hours with the people running these systems alongside me.",
    linkText: "Join Discord",
    href: "https://discord.gg/RvtbVXwEnd",
  },
  {
    title: "Newsletter",
    description:
      "Weekly prompt drops, relapse reports, and behind-the-scenes build notes. Land in your inbox before YouTube.",
    linkText: "Subscribe on Beehiiv",
    href: "https://mylifebyai.beehiiv.com/",
  },
  {
    title: "Patreon",
    description:
      "Access the systems starter kit, token template, and future MLBAI app betas the moment they ship.",
    linkText: "Support on Patreon",
    href: "https://www.patreon.com/c/mylifebyai",
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
          </nav>
        </div>
        <div className="wrapper hero">
          <div className="hero-grid">
            <div>
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
              <p className="hero-support">
                This site is the basecamp for My Life, By AI — the systems I run with
                Arthur and the MLBAI apps that grow out of them.
              </p>
              <div className="hero-feature">
                <div className="hero-feature-media">
                  <Image
                    src="/images/weightloss.png"
                    alt="Weight loss progress collage showing weekly check-ins from the documentary."
                    width={640}
                    height={420}
                    className="hero-feature-img"
                    priority
                  />
                </div>
                <p className="hero-feature-note">
                  70+ lbs lost with Arthur watching every relapse and restart. No hype
                  — just the weekly systems that actually held.
                </p>
              </div>
              <p className="hero-support">
                No hype, no perfection. Just one human, one AI, and a system that
                treats failure as data.
              </p>
            </div>
            <div className="hero-visual">
              <div className="hero-orb" />
              <ArthurHeroChat />
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
                &quot;My Life, By AI&quot; is me letting ChatGPT act as my life coach,
                project manager, and accountability partner. I’ve failed at diets,
                routines, and self-help more times than I can count, so I document the
                rebuild instead of hiding it. Arthur and I are designing systems, not
                relying on willpower — and every relapse is part of the report.
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
                  <strong>Full tutorials</strong> – copy-paste prompts and systems for
                  weight loss, job search, and more.
                </li>
                <li>
                  <strong>Failure and recovery</strong> – episodes where things fall apart
                  and we rebuild.
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
        <section id="tools">
          <div className="wrapper section-content">
            <div>
              <h2>What you can use right now</h2>
              <p className="section-note">
                These are the live experiments tied to the documentary. Each one is part of
                the MLBAI platform and grows as we learn what actually works.
              </p>
            </div>
            <div className="tools-grid">
              {currentTools.map((tool) => (
                <article className="tool-card" key={tool.title}>
                  <div className="tool-card-status">{tool.status}</div>
                  {tool.icon && <div className="tool-card-icon">{tool.icon}</div>}
                  <h3>{tool.title}</h3>
                  <p>{tool.copy}</p>
                  {tool.note && <p className="tool-card-note">{tool.note}</p>}
                  <a
                    href={tool.href}
                    target={tool.href.startsWith("http") ? "_blank" : undefined}
                    rel={tool.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="tool-card-link"
                  >
                    {tool.linkText}
                  </a>
                </article>
              ))}
            </div>
            <div className="roadmap">
              <h3>Up next</h3>
              <div className="roadmap-items">
                {roadmap.map((item) => (
                  <article className="roadmap-item" key={item.title}>
                    <div className="roadmap-item-label">{item.timeline}</div>
                    <h4>{item.title}</h4>
                    <p>{item.copy}</p>
                    {item.link && (
                      <a
                        className="roadmap-link"
                        href={item.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.link.label}
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="voices">
          <div className="wrapper section-content section-split">
            <div>
              <h2>What the community says</h2>
              <p>
                These are real notes from people running their own versions of the My Life,
                By AI systems alongside me.
              </p>
              <div className="testimonial-highlight">
                <p>
                  “I’ve lost 34 pounds in 5 months… and it’s been the easiest weight loss I’ve
                  ever experienced. Arthur adjusts my workouts, meals, creativity time — without
                  shame.”
                </p>
                <span>Dan “Bearlee” Lorius</span>
              </div>
              <div className="testimonial-grid">
                {testimonials.map((testimonial) => (
                  <article className="testimonial-card" key={testimonial.author}>
                    <p>{testimonial.quote}</p>
                    <span>{testimonial.author}</span>
                  </article>
                ))}
              </div>
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
              <div className="stay-card">
                Every MLBAI app or experiment launches from here first — these channels are
                how you’ll hear about new prompt builders, check-ins, and tools the minute
                they’re ready.
              </div>
              <div className="stay-actions">
                {stayChannels.map((channel) => (
                  <article className="stay-action" key={channel.title}>
                    <h3>{channel.title}</h3>
                    <p>{channel.description}</p>
                    <a
                      className="cta-primary stay-action-link"
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {channel.linkText}
                    </a>
                  </article>
                ))}
              </div>
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
