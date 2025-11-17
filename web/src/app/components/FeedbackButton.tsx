import Link from "next/link";

export function FeedbackButton() {
  return (
    <Link
      href="/feedback"
      className="feedback-fab"
      aria-label="Report an issue or leave testing feedback"
    >
      <span aria-hidden="true">🐞</span>
    </Link>
  );
}
