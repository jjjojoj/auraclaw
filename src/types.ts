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
