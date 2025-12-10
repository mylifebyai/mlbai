// Core types for the Productivity experiment.

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type SPBlock = {
  id: string;
  label: string;
  // Preferred time-blocked schedule; if omitted, fall back to weeklyTargetHours.
  days?: DayOfWeek[];
  startTime?: string; // "09:00"
  endTime?: string; // "15:00"
  weeklyTargetHours?: number;
  notes?: string;
};

export type OutputMetric = {
  id: string;
  label: string;
  target: number;
  period: "week" | "month";
  unit?: string; // e.g., "videos", "features", "km"
};

export type RelapseRule = {
  id: string;
  name: string;
  description: string;
  category: "time_block" | "system";
};

export type Punishment = {
  description: string;
  triggerRelapses: number; // e.g., 3 relapses triggers this punishment
};

export type TokenRules = {
  enabled: boolean;
  tokensPerSP?: number;
  tokenValue?: number; // optional monetary mapping
  monthlyBudget?: number; // optional cap on discretionary spend
};

export type ExperimentContract = {
  version: number;
  startDate: string; // ISO date
  spPlan: SPBlock[];
  outputs: OutputMetric[];
  relapseRules: RelapseRule[];
  punishment: Punishment;
  tokens?: TokenRules;
  trackFallingApart: boolean;
  retroactiveCheckinCostsRelapse: boolean;
};

export type BlockLog = {
  blockId: string;
  minutesCompleted: number;
  note?: string;
};

export type RelapseLog = {
  ruleId: string;
  timestamp: string; // ISO datetime
  note?: string;
};

export type DailyLog = {
  date: string; // ISO date
  blocksCompleted: BlockLog[];
  relapses: RelapseLog[];
  reflection?: string;
  tokensEarned?: number;
  tokensSpent?: number;
  tokensNote?: string;
  missingCheckIn?: boolean;
  retroactive?: boolean; // true if filled later (costs a relapse)
};

export type OutputSummary = {
  outputId: string;
  target: number;
  actual: number;
};

export type BlockSummary = {
  blockId: string;
  plannedHours?: number;
  actualHours: number;
};

export type WeeklyReview = {
  weekStart: string; // ISO date
  weekEnd: string; // ISO date
  blocks: BlockSummary[];
  outputs: OutputSummary[];
  relapses: RelapseLog[];
  fallingApart: string[];
  adjustments: string; // freeform notes on what to change
  nextWeekPlan?: Partial<ExperimentContract>;
};
