import type { EvalContext, EvalSuite, RunReport, SuiteReport } from './types';

export async function runSuite(suite: EvalSuite, ctx: EvalContext): Promise<SuiteReport> {
  const startedAt = new Date().toISOString();
  const results: SuiteReport['results'] = [];
  for (const c of suite.cases) {
    const t0 = Date.now();
    let entry: SuiteReport['results'][number];
    try {
      const r = await c.run(ctx);
      entry = { id: c.id, description: c.description, durationMs: Date.now() - t0, ...r };
    } catch (err) {
      entry = {
        id: c.id,
        description: c.description,
        durationMs: Date.now() - t0,
        pass: false,
        details: `threw: ${(err as Error).message}`,
      };
    }
    results.push(entry);
    const badge = entry.pass ? 'PASS' : 'FAIL';
    const scoreStr = entry.score !== undefined && entry.maxScore !== undefined ? ` (${entry.score}/${entry.maxScore})` : '';
    console.log(`  [${badge}] ${c.id}${scoreStr} — ${entry.details}`);
  }
  const finishedAt = new Date().toISOString();
  const passed = results.filter(r => r.pass).length;
  const score = results.reduce((acc, r) => acc + (r.score ?? 0), 0);
  const maxScore = results.reduce((acc, r) => acc + (r.maxScore ?? 0), 0);
  return {
    suite: suite.name,
    startedAt,
    finishedAt,
    results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      score,
      maxScore,
      scorePct: maxScore > 0 ? (score / maxScore) * 100 : 0,
    },
  };
}

export async function runAll(suites: EvalSuite[], ctx: EvalContext): Promise<RunReport> {
  const startedAt = new Date().toISOString();
  const reports: SuiteReport[] = [];
  for (const suite of suites) {
    console.log(`\n▶ ${suite.name} — ${suite.description}`);
    reports.push(await runSuite(suite, ctx));
  }
  const finishedAt = new Date().toISOString();
  const total = reports.reduce((a, r) => a + r.summary.total, 0);
  const passed = reports.reduce((a, r) => a + r.summary.passed, 0);
  const overallScore = reports.reduce((a, r) => a + r.summary.score, 0);
  const overallMax = reports.reduce((a, r) => a + r.summary.maxScore, 0);
  return {
    startedAt,
    finishedAt,
    suites: reports,
    overall: {
      total,
      passed,
      failed: total - passed,
      scorePct: overallMax > 0 ? (overallScore / overallMax) * 100 : 0,
    },
  };
}
