export type FeedbackStatus = "todo" | "complete";

export type FeedbackEnvironment = {
  browser: string;
  viewport: string;
};

export type FeedbackEntry = {
  id: string;
  name: string;
  contact: string;
  issueType: string;
  severity: string;
  affectedArea: string;
  description: string;
  steps: string;
  image?: string | null;
  imageName?: string | null;
  status: FeedbackStatus;
  createdAt: string;
  environment: FeedbackEnvironment;
};

export type FeedbackFormInput = Omit<FeedbackEntry, "id" | "createdAt" | "status"> & {
  status?: FeedbackStatus;
};

export type FeedbackDbRow = {
  id: string;
  name: string | null;
  contact: string | null;
  issue_type: string | null;
  severity: string | null;
  affected_area: string | null;
  description: string | null;
  steps: string | null;
  image: string | null;
  image_name: string | null;
  status: FeedbackStatus;
  environment: FeedbackEnvironment | null;
  created_at: string;
};

export const mapRowToEntry = (row: FeedbackDbRow): FeedbackEntry => ({
  id: row.id,
  name: row.name ?? "",
  contact: row.contact ?? "",
  issueType: row.issue_type ?? "",
  severity: row.severity ?? "",
  affectedArea: row.affected_area ?? "",
  description: row.description ?? "",
  steps: row.steps ?? "",
  image: row.image,
  imageName: row.image_name ?? undefined,
  status: row.status,
  createdAt: row.created_at,
  environment: row.environment ?? { browser: "Unknown", viewport: "Unknown" },
});
