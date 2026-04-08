export type TrackId = "care" | "extension" | "dialogue" | "opc";

export type RiskLevel = "低" | "中低" | "中";

export interface Track {
  id: TrackId;
  name: string;
  summary: string;
  goal: string;
  intro: string;
  promise: string;
  color: string;
  path: string;
  starterAudience: string[];
  heroNote: string;
  entryQuestion: string;
  signatureSignals: string[];
}

export interface RecipePitfall {
  issue: string;
  fix: string;
}

export interface RecipeDependency {
  name: string;
  kind: string;
  source: string;
  summary: string;
}

export interface RecipeSampleInput {
  title: string;
  content: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  trackId: TrackId;
  targetRoles: string[];
  outcome: string;
  whyItMatters: string;
  prerequisites: string[];
  riskLevel: RiskLevel;
  minutes: number;
  testCase: string;
  passCriteria: string[];
  promise: string;
  copyBlock: string;
  starterLabel?: string;
  salesPitch?: string;
  bestFor?: string[];
  prepareChecklist?: string[];
  youWillGet?: string[];
  experienceIncludes?: string[];
  executionFlow?: string[];
  dependencies?: RecipeDependency[];
  sampleInput?: RecipeSampleInput;
  outputPreview?: string;
  pitfalls?: RecipePitfall[];
  shortestCommand?: string;
  validationSteps?: string[];
  fallbackPlan?: string[];
  sourceTips?: string[];
  nextStep: string;
}

export interface StarterPackQuestion {
  title: string;
  answer: string;
}

export interface SourceNote {
  id: string;
  title: string;
  siteName: string;
  sourceUrl: string;
  contentType: string;
  boardFit: TrackId[];
  summary: string;
  keyPoints: string[];
  recommendedFor: string[];
  newbieFriendly: boolean;
  needsManualReview: boolean;
  citationMode: string;
  reuseTargets: string[];
  lastChecked: string;
  notes: string;
}

export type ReviewStatus =
  | "pending"
  | "approved_source_note"
  | "approved_recipe"
  | "rejected"
  | "archived";

export interface ReviewHistoryEntry {
  candidateKey: string;
  candidateId: string;
  title: string;
  status: ReviewStatus;
  notes: string;
  reviewer: string;
  reviewedAt: string;
  runFileName: string;
  sourceUrl: string;
}

export interface ReviewCandidate {
  key: string;
  candidateId: string;
  runFileName: string;
  runAt: string;
  collector: string;
  title: string;
  type: string;
  sourceName: string;
  sourceUrl: string;
  contentType: string;
  boardFit: TrackId[];
  whyItMatters: string;
  oneLineSummary: string;
  suggestedRecipeTitle: string;
  suggestedAngle: string;
  confidence: string;
  needsManualReview: boolean;
  status: ReviewStatus;
  notes: string;
  reviewer: string;
  reviewedAt: string;
  history: ReviewHistoryEntry[];
}

export interface ReviewSummary {
  totalCandidates: number;
  latestRunAt: string;
  counts: Record<ReviewStatus, number>;
}

export interface AdminSession {
  username: string;
  authenticatedAt: string;
  expiresAt: string;
}
