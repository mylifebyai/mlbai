import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – My Life, By AI",
  description:
    "How we collect, use, and protect your data across the My Life, By AI site, apps, and experiments.",
};

const sections = [
  {
    title: "1. Summary",
    body: [
      "My Life, By AI (“MLBAI”) is a documentary-style project and product lab. We collect only the minimum data required to deliver the site, analyze traffic, and run experiments with community members.",
      "We do not sell or rent your data. We only share information with service providers that power the site (e.g., Vercel, Supabase, OpenAI) and only to provide the services you asked us to deliver.",
    ],
  },
  {
    title: "2. What We Collect",
    body: [
      "Account info: When you create an MLBAI account, we store your email address and a hashed password inside Supabase Auth.",
      "Analytics: Anonymous page views and duration events are logged to Supabase. We store the path, referrer, and a salted hash of the visitor IP (no raw IPs).",
      "Feedback + uploads: If you submit bug reports or screenshots, those go to Supabase along with any contact info you choose to provide.",
      "Promptly / API usage: Promptly requests are proxied to OpenAI and include the text you send. We don’t store full conversations, only high-level summaries for debugging.",
    ],
  },
  {
    title: "3. How We Use Data",
    body: [
      "Deliver the site and apps: Run Supabase Auth sessions, personalize experiences, and keep gated tools limited to members.",
      "Monitor performance: Understand which pages and features people find useful so we can prioritize the roadmap.",
      "Investigate issues: Diagnose bugs, abuse, or security problems, particularly if you submit feedback or contact support.",
      "Legal requirements: Comply with applicable laws and respond to lawful requests from public authorities when required.",
    ],
  },
  {
    title: "4. How Data Is Stored & Protected",
    body: [
      "Hosting: The site runs on Vercel, with data stored in Supabase (Postgres + storage). Both platforms provide encryption at rest and in transit.",
      "Access: Only the MLBAI team has access to the Supabase project and production secrets. Access is protected by strong passwords and multi-factor authentication where available.",
      "Retention: We keep analytics events and feedback indefinitely so we can analyze long-term trends. You can request deletion of your data at any time by emailing the address below.",
    ],
  },
  {
    title: "5. Third-Party Services",
    body: [
      "Supabase: Authentication, database, storage, anonymous analytics. Subject to Supabase’s privacy policy.",
      "Vercel: Hosts the web application and logs server metrics. Subject to Vercel’s privacy policy.",
      "OpenAI: Processes Promptly requests so we can generate prompts alongside you. Only the content you submit to Promptly is sent to OpenAI.",
      "Discord, Patreon, and other community tools have their own privacy policies. We only receive the information you explicitly share with us there.",
    ],
  },
  {
    title: "6. Your Choices & Rights",
    body: [
      "Opt out of optional data: You can block analytics requests in your browser; the site will continue to run.",
      "Access or delete data: Email mylife.byai@gmail.com with the email tied to your MLBAI account and we’ll export or delete your records.",
      "Close your account: Contact us and we’ll deactivate your Supabase login and remove any stored data (analytics is already anonymous).",
    ],
  },
  {
    title: "7. Changes",
    body: [
      "We may update this policy as the project evolves. We’ll post the new version here with an updated “last updated” date. If the changes are material, we’ll notify members via email.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      "Questions or requests? Email mylife.byai@gmail.com. That inbox is monitored daily and we’ll respond as soon as possible.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="wrapper app-shell legal-card">
        <p className="hero-eyebrow">Privacy Policy</p>
        <h1>My Life, By AI – Privacy Policy</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="legal-intro">
          This policy explains how we collect, use, and protect information across the MLBAI site,
          Promptly, and any gated experiments. It applies to all visitors and members.
        </p>
        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
