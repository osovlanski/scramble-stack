export interface EvalCase {
  id: string;
  description: string;
  run: (ctx: EvalContext) => Promise<EvalCaseResult>;
}

export interface EvalContext {
  anthropicApiKey: string;
  canvasBackendUrl: string;
  newsFeedBackendUrl: string;
  qaBackendUrl: string;
}

export interface EvalCaseResult {
  pass: boolean;
  score?: number;
  maxScore?: number;
  details: string;
  metrics?: Record<string, number>;
}

export interface EvalSuite {
  name: string;
  description: string;
  cases: EvalCase[];
}

export interface SuiteReport {
  suite: string;
  startedAt: string;
  finishedAt: string;
  results: Array<EvalCaseResult & { id: string; description: string; durationMs: number }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    score: number;
    maxScore: number;
    scorePct: number;
  };
}

export interface RunReport {
  startedAt: string;
  finishedAt: string;
  suites: SuiteReport[];
  overall: {
    total: number;
    passed: number;
    failed: number;
    scorePct: number;
  };
}
