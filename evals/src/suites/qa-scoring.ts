import type { EvalCase, EvalSuite } from '../types';

interface ScoringCase {
  id: string;
  question: string;
  answer: string;
  tier: 'low' | 'mid' | 'high';
  expectedMin: number;
  expectedMax: number;
}

const cases: ScoringCase[] = [
  {
    id: 'url-shortener-low',
    question: 'Design a URL shortener like bit.ly.',
    answer: 'I would use a database to store URLs. Then when users hit a short URL, I look it up and redirect.',
    tier: 'low',
    expectedMin: 0,
    expectedMax: 40,
  },
  {
    id: 'url-shortener-mid',
    question: 'Design a URL shortener like bit.ly.',
    answer:
      'Use an API gateway behind a load balancer. A shortener service writes the (short, long) pair to a relational DB ' +
      'and caches it in Redis. Reads go through the cache; misses hit the DB. Analytics are offloaded to a Kafka-backed ' +
      'async pipeline. Scale the service tier horizontally.',
    tier: 'mid',
    expectedMin: 45,
    expectedMax: 75,
  },
  {
    id: 'url-shortener-high',
    question: 'Design a URL shortener like bit.ly.',
    answer:
      'Edge: anycast DNS + CDN + rate-limiting WAF. Shorten API: pre-sharded Snowflake ID generator to avoid hot partitions, ' +
      'writes to Cassandra (eventual consistency acceptable, TTL support, horizontal scale). Reads hit Redis (write-through) ' +
      'with 1% miss rate SLO; misses hit Cassandra. Hot keys get a local LRU in the service tier to prevent cache stampede. ' +
      'Analytics via Kafka → ClickHouse for OLAP, Flink for real-time counters. Multi-region active-active with conflict-free ' +
      'short IDs via region-prefixing. Chaos: graceful degradation when Redis is down (direct DB with concurrency cap).',
    tier: 'high',
    expectedMin: 75,
    expectedMax: 100,
  },
];

async function scoreAnswer(qaBackendUrl: string, question: string, answer: string): Promise<number> {
  const sessRes = await fetch(`${qaBackendUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'structured', questionText: question }),
  });
  if (!sessRes.ok) throw new Error(`POST /sessions ${sessRes.status}`);
  const { session } = await sessRes.json() as { session: { id: string } };

  const submitRes = await fetch(`${qaBackendUrl}/api/sessions/${session.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!submitRes.ok) throw new Error(`POST /submit ${submitRes.status}`);
  const submitted = await submitRes.json() as { result?: { totalScore?: number } };
  if (typeof submitted.result?.totalScore !== 'number') throw new Error('missing totalScore');
  return submitted.result.totalScore;
}

export const qaScoringSuite: EvalSuite = {
  name: 'qa-scoring',
  description: 'Assert that QA scoring is monotone across low/mid/high answer quality',
  cases: [
    ...cases.map<EvalCase>(c => ({
      id: c.id,
      description: `Score ${c.tier}-quality answer to: ${c.question}`,
      run: async ctx => {
        const score = await scoreAnswer(ctx.qaBackendUrl, c.question, c.answer);
        const pass = score >= c.expectedMin && score <= c.expectedMax;
        return {
          pass,
          score,
          maxScore: 100,
          details: `expected ${c.expectedMin}-${c.expectedMax}, got ${score}`,
          metrics: { totalScore: score },
        };
      },
    })),
    {
      id: 'monotonicity',
      description: 'High > mid > low scores (run each answer once, compare)',
      run: async ctx => {
        const [low, mid, high] = await Promise.all(
          cases.map(c => scoreAnswer(ctx.qaBackendUrl, c.question, c.answer)),
        );
        const pass = high > mid && mid > low;
        return {
          pass,
          score: pass ? 1 : 0,
          maxScore: 1,
          details: `low=${low} mid=${mid} high=${high}`,
          metrics: { low, mid, high },
        };
      },
    },
  ],
};
