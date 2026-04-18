import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { runAll } from './runner';
import { canvasGeneratorSuite } from './suites/canvas-generator';
import { qaScoringSuite } from './suites/qa-scoring';
import { newsCuratorSuite } from './suites/news-curator';
import type { EvalSuite, RunReport } from './types';

const SUITES: Record<string, EvalSuite> = {
  'canvas-generator': canvasGeneratorSuite,
  'qa-scoring': qaScoringSuite,
  'news-curator': newsCuratorSuite,
};

function parseArgs(argv: string[]): { suite: string; writeBaseline: boolean; regressionPct: number } {
  let suite = 'all';
  let writeBaseline = false;
  let regressionPct = 5;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--suite') suite = argv[++i];
    else if (a === '--write-baseline') writeBaseline = true;
    else if (a === '--regression-pct') regressionPct = Number(argv[++i]);
  }
  return { suite, writeBaseline, regressionPct };
}

function compareToBaseline(current: RunReport, baselinePath: string, regressionPct: number): { regressed: boolean; reason: string } {
  if (!existsSync(baselinePath)) return { regressed: false, reason: 'no baseline yet' };
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as RunReport;
  const drop = baseline.overall.scorePct - current.overall.scorePct;
  if (drop > regressionPct) {
    return { regressed: true, reason: `score dropped ${drop.toFixed(1)}% (baseline ${baseline.overall.scorePct.toFixed(1)}% → current ${current.overall.scorePct.toFixed(1)}%)` };
  }
  return { regressed: false, reason: `within tolerance (Δ ${(-drop).toFixed(1)}%)` };
}

async function main(): Promise<void> {
  const { suite, writeBaseline, regressionPct } = parseArgs(process.argv.slice(2));

  const ctx = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    canvasBackendUrl: process.env.CANVAS_BACKEND_URL ?? 'http://localhost:3000',
    newsFeedBackendUrl: process.env.NEWS_FEED_BACKEND_URL ?? 'http://localhost:3001',
    qaBackendUrl: process.env.QA_BACKEND_URL ?? 'http://localhost:3002',
  };
  if (!ctx.anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY is required');
    process.exit(2);
  }

  const selected: EvalSuite[] = suite === 'all' ? Object.values(SUITES) : [SUITES[suite]];
  if (selected.some(s => !s)) {
    console.error(`Unknown suite "${suite}". Available: all, ${Object.keys(SUITES).join(', ')}`);
    process.exit(2);
  }

  const report = await runAll(selected, ctx);

  const reportDir = resolve(process.cwd(), 'reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = resolve(reportDir, 'latest.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const baselinePath = resolve(reportDir, `baseline-${suite}.json`);
  if (writeBaseline) {
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, JSON.stringify(report, null, 2));
    console.log(`\n✓ wrote baseline → ${baselinePath}`);
  }

  const cmp = compareToBaseline(report, baselinePath, regressionPct);

  console.log('\n=== Summary ===');
  for (const s of report.suites) {
    console.log(`  ${s.suite}: ${s.summary.passed}/${s.summary.total} pass, score ${s.summary.scorePct.toFixed(1)}%`);
  }
  console.log(`  OVERALL: ${report.overall.passed}/${report.overall.total} pass, score ${report.overall.scorePct.toFixed(1)}%`);
  console.log(`  BASELINE: ${cmp.reason}`);
  console.log(`  Report written: ${reportPath}`);

  if (cmp.regressed || report.overall.failed > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
