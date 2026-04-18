import type { EvalSuite } from '../types';
import { judgeWithClaude } from '../judge';

interface DiagramPrompt {
  id: string;
  prompt: string;
  rubric: string;
  minNodes: number;
  requiredNodeTypes?: string[];
}

const prompts: DiagramPrompt[] = [
  {
    id: 'url-shortener',
    prompt: 'Design a URL shortener like bit.ly — 100M URLs/day, <10ms redirect latency.',
    rubric:
      '(a) Has a load balancer or API gateway at the edge. (b) Has an application tier (microservice/server). (c) Has a KV/cache for hot redirects. (d) Has durable storage (SQL/NoSQL). (e) Nodes connect sensibly — no orphan nodes.',
    minNodes: 4,
    requiredNodeTypes: ['cache', 'sql-db', 'nosql-db', 'object-storage'],
  },
  {
    id: 'chat-app',
    prompt: 'Design a real-time chat app supporting 1M concurrent users.',
    rubric:
      '(a) Has a message queue or pub/sub. (b) Has websocket-capable service tier. (c) Has persistent message storage. (d) Has a presence/session cache. (e) Nodes connect sensibly.',
    minNodes: 5,
    requiredNodeTypes: ['message-queue', 'cache'],
  },
  {
    id: 'video-streaming',
    prompt: 'Design YouTube-style video streaming — upload, transcode, playback.',
    rubric:
      '(a) Has a CDN. (b) Has object storage. (c) Has a transcoding path (workers/queue). (d) Has a metadata DB. (e) Playback path does not go through the DB for hot content.',
    minNodes: 5,
    requiredNodeTypes: ['cdn', 'object-storage'],
  },
];

async function generateDiagram(canvasBackendUrl: string, prompt: string): Promise<{ nodes: Array<{ id: string; data: { nodeType?: string } }>; edges: Array<{ source: string; target: string }> }> {
  const res = await fetch(`${canvasBackendUrl}/api/canvas/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer eval-token' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Canvas /generate returned ${res.status}: ${await res.text()}`);
  const text = await res.text();
  const nodes: Array<{ id: string; data: { nodeType?: string } }> = [];
  const edges: Array<{ source: string; target: string }> = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    try {
      const evt = JSON.parse(line.slice(5).trim());
      if (evt.type === 'node') nodes.push(evt.payload);
      else if (evt.type === 'edge') edges.push(evt.payload);
    } catch { /* ignore non-JSON SSE frames */ }
  }
  return { nodes, edges };
}

function orphanCount(nodes: Array<{ id: string }>, edges: Array<{ source: string; target: string }>): number {
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  return nodes.filter(n => !connected.has(n.id)).length;
}

export const canvasGeneratorSuite: EvalSuite = {
  name: 'canvas-generator',
  description: 'Validates the Canvas /generate endpoint produces well-formed, schema-compliant diagrams',
  cases: prompts.map(p => ({
    id: p.id,
    description: `Generate: ${p.prompt}`,
    run: async ctx => {
      const { nodes, edges } = await generateDiagram(ctx.canvasBackendUrl, p.prompt);
      const nodeCount = nodes.length;
      const edgeCount = edges.length;
      const orphans = orphanCount(nodes, edges);
      const presentTypes = new Set(nodes.map(n => n.data.nodeType).filter((x): x is string => Boolean(x)));
      const missingRequired = (p.requiredNodeTypes ?? []).filter(t => !presentTypes.has(t));

      const structuralOk = nodeCount >= p.minNodes && orphans === 0;
      const artifact = JSON.stringify({ nodes, edges }, null, 2);
      const verdict = await judgeWithClaude({
        apiKey: ctx.anthropicApiKey,
        rubric: p.rubric,
        artifact,
        passThreshold: 7,
      });

      const pass = structuralOk && verdict.pass && missingRequired.length <= 1;
      return {
        pass,
        score: verdict.score,
        maxScore: 10,
        details: [
          `nodes=${nodeCount} edges=${edgeCount} orphans=${orphans}`,
          `missingRequired=[${missingRequired.join(', ')}]`,
          `judge=${verdict.score}/10 — ${verdict.reasoning}`,
        ].join(' | '),
        metrics: { nodeCount, edgeCount, orphans, judgeScore: verdict.score },
      };
    },
  })),
};
