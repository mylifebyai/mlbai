import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – My Life, By AI",
  description:
    "Usage terms for MLBAI’s site, Promptly beta, and members-only tools.",
};

const sections = [
  {
    title: "1. Acceptance",
    body: [
      "By visiting mylifeby.ai, creating an account, or using Promptly, you agree to these Terms of Service (“Terms”). If you disagree with them, please do not use the site or apps.",
    ],
  },
  {
    title: "2. Who May Use It",
    body: [
      "You must be at least 18 years old (or the age of majority where you live) to participate in MLBAI experiments. You are responsible for keeping your login credentials secure.",
    ],
  },
  {
    title: "3. Accounts & Access",
    body: [
      "Accounts are provided for personal use only. Do not share your password or access tokens. We may suspend or terminate access if we detect abuse or suspicious activity.",
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "Don’t attempt to hack, overload, or reverse engineer the site.",
      "Don’t submit unlawful, abusive, or harassing content.",
      "Don’t copy prompts or tools for resale without permission.",
    ],
  },
  {
    title: "5. Promptly & Experimental Tools",
    body: [
      "Promptly is a beta feature that depends on third-party AI providers (currently OpenAI). We make no guarantees of availability, accuracy, or fitness for any purpose.",
      "You are responsible for reviewing any outputs before acting on them.",
    ],
  },
  {
    title: "6. Paid Memberships",
    body: [
      "Certain tools may require an active Patreon membership. Patreon’s own terms govern billing. We reserve the right to revoke MLBAI access if a membership lapses or is refunded.",
    ],
  },
  {
    title: "7. Intellectual Property",
    body: [
      "The site, video content, prompts, and tooling are owned by My Life, By AI unless otherwise noted. You may use them for personal purposes; commercial use requires written consent.",
    ],
  },
  {
    title: "8. Disclaimers",
    body: [
      "MLBAI is not medical, fitness, or legal advice. Consult professionals before making health or lifestyle changes.",
      "The site is provided “as is.” We disclaim all warranties to the extent permitted by law.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: [
      "We are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid us, if any, during the six months before a claim.",
    ],
  },
  {
    title: "10. Termination",
    body: [
      "We may suspend or terminate accounts at any time for violation of these Terms. You can delete your account by emailing mylife.byai@gmail.com.",
    ],
  },
  {
    title: "11. Changes",
    body: [
      "We may update these Terms as the project evolves. Continued use after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "Questions? Email mylife.byai@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="wrapper app-shell legal-card">
        <p className="hero-eyebrow">Terms of Service</p>
        <h1>My Life, By AI – Terms of Service</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="legal-intro">
          Please read these Terms carefully. They outline how you may use MLBAI’s public site, Promptly beta, the analytics dashboard, and any future members-only tools.
        </p>
        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.substring(0, 32)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
