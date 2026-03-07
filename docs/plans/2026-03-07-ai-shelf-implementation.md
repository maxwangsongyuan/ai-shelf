# The AI Shelf — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a GEO (Generative Engine Optimization) analysis tool that measures brand visibility in AI responses, deployed on Vercel, in 2 hours.

**Architecture:** Single-page Next.js app with SSE-streaming API route. Backend orchestrates 6 analysis steps (query generation → AI responses → web search → scoring → gap analysis → action plan) using Claude Haiku 4.5 via Vercel AI SDK and Tavily search. Frontend renders results progressively as each step completes.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS + shadcn/ui · Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) · Tavily (`@tavily/core`) · Recharts · Zod · Vercel deployment

**Reference Docs:**
- Design: `docs/plans/2026-03-07-ai-shelf-design.md`
- Flowchart: `docs/plans/2026-03-07-implementation-flowchart.md`

**Important Notes:**
- This is a 2-hour hackathon build — speed > perfection
- Skip TDD — verify by running `npm run dev` and testing in browser
- Commit after each task completes
- Node.js runtime (NOT Edge) for API routes — `@ai-sdk/anthropic` needs it
- Step 2 uses JS string matching for analysis (NOT extra Claude calls)

---

## Task 1: Project Scaffold

**Files:**
- Create: `src/app/layout.tsx` (overwrite default)
- Create: `src/app/page.tsx` (overwrite default)
- Create: `src/lib/types.ts`
- Create: `.env.local`

**Step 1: Create Next.js project and install dependencies**

```bash
cd /Users/maxwsy/workspace/ai-shelf
npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-npm --yes
```

Note: The `.` uses the current directory. If it prompts about existing files, accept.

**Step 2: Initialize shadcn/ui**

```bash
cd /Users/maxwsy/workspace/ai-shelf
npx shadcn@latest init -d
npx shadcn@latest add card progress badge table tabs input button separator
```

**Step 3: Install runtime dependencies**

```bash
cd /Users/maxwsy/workspace/ai-shelf
npm install ai @ai-sdk/anthropic @tavily/core zod recharts
```

**Step 4: Create `.env.local`**

```
ANTHROPIC_API_KEY=<user must fill in>
TAVILY_API_KEY=<user must fill in>
```

**Step 5: Create `src/lib/types.ts`**

```typescript
// === Input ===
export interface AnalyzeRequest {
  brandName: string;
  category: string;
  region: string;
}

// === Step 1: Query Generation ===
export interface GeneratedQuery {
  query: string;
  type: 'discovery' | 'verification';
  intent: string;
  intentEn: string;
}

// === Step 2: AI Response ===
export interface AIResponse {
  query: string;
  type: 'discovery' | 'verification';
  response: string;
  brandMentioned: boolean;
  mentionPosition: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorsFound: string[];
}

// === Step 3: Web Reality ===
export interface WebResult {
  query: string;
  sources: Array<{
    title: string;
    url: string;
    brandMentioned: boolean;
  }>;
  brandWebMentions: number;
  competitorWebMentions: Record<string, number>;
}

// === Step 4: Scores ===
export interface Scores {
  discoveryScore: number;
  trustScore: number;
  overallScore: number;
  archetype: 'Leader' | 'Challenger' | 'Niche Player' | 'Invisible';
  radarScores: {
    recognition: number;
    sentiment: number;
    relevance: number;
    citation: number;
    competitive: number;
  };
  promptSensitivity: Array<{
    query: string;
    winner: string;
    opportunity: boolean;
  }>;
}

// === Step 5: Gap Analysis ===
export interface GapItem {
  factor: string;
  brandStatus: boolean;
  competitorStatus: boolean;
  importance: string;
  sourceUrl: string;
}

// === Step 6: Action Plan ===
export interface ActionItem {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  gapReference: string;
  expectedImpact: string;
  generatedContent?: string;
}

// === SSE Events ===
export type SSEEvent =
  | { step: 1; status: 'running' | 'done'; data?: GeneratedQuery[] }
  | { step: 2; status: 'running' | 'done'; data?: AIResponse[]; progress?: number }
  | { step: 3; status: 'running' | 'done'; data?: WebResult[]; progress?: number }
  | { step: 4; status: 'running' | 'done'; data?: Scores }
  | { step: 5; status: 'running' | 'done'; data?: GapItem[] }
  | { step: 6; status: 'running' | 'done'; data?: ActionItem[] }
  | { step: 'error'; message: string };
```

**Step 6: Verify scaffold**

```bash
cd /Users/maxwsy/workspace/ai-shelf && npm run dev
```

Open `http://localhost:3000` — should see default Next.js page.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies and types"
```

---

## Task 2: Prompt Templates + Analysis Utilities

**Files:**
- Create: `src/lib/prompts.ts`
- Create: `src/lib/analyze-response.ts`
- Create: `src/lib/scoring.ts`
- Create: `src/lib/tavily.ts`

**Step 1: Create `src/lib/prompts.ts`**

All Claude system/user prompt templates as exported functions.

```typescript
import type { AnalyzeRequest, GeneratedQuery } from './types';

export function queryGenerationPrompt(req: AnalyzeRequest) {
  return {
    system: `You are a GEO (Generative Engine Optimization) analyst specializing in understanding how potential customers search for products and services using AI assistants. Always respond with valid JSON only, no markdown.`,
    user: `Generate exactly 6 search queries that potential customers might ask AI assistants about the following brand's industry. Split into two categories:

Brand: ${req.brandName}
Category: ${req.category}
Region: ${req.region}

DISCOVERY QUERIES (3): Questions a customer would ask when looking for a new provider in this category, WITHOUT knowing this specific brand. Think about real pain points and natural language.

VERIFICATION QUERIES (3): Questions a customer would ask to verify/research this specific brand after hearing about it (e.g., after a sales visit).

For EACH query, provide:
- query: The exact query text (in English, natural language)
- type: "discovery" or "verification"
- intent: A short Chinese description of WHY the customer is asking this
- intentEn: Same intent in English

Return as a JSON array of objects with fields: query, type, intent, intentEn`,
  };
}

export function aiResponsePrompt(query: string, type: 'discovery' | 'verification', category: string, brandName: string) {
  if (type === 'discovery') {
    return {
      system: `You are a ${category} expert helping a professional find the best provider. Answer naturally and recommend specific brands by name. Be detailed and helpful. Do NOT mention that you are an AI or that you have limitations.`,
      user: query,
    };
  }
  return {
    system: `You are a knowledgeable industry expert. Answer questions about specific companies honestly and in detail. If you have limited information, say so naturally. Do NOT mention that you are an AI.`,
    user: query,
  };
}

export function gapAnalysisPrompt(
  brandName: string,
  brandWebData: string,
  competitorWebData: string,
  aiResponsesSummary: string
) {
  return {
    system: `You are a GEO gap analyst. Always respond with valid JSON only, no markdown.`,
    user: `Compare ${brandName} vs its top competitor based on web presence data. Identify specific factors that explain WHY AI knows the competitor but not this brand.

Web search data for ${brandName}: ${brandWebData}
Web search data for competitor: ${competitorWebData}
AI responses summary: ${aiResponsesSummary}

Return a JSON array of objects, each with:
- factor: name of the gap factor (e.g., "Wikipedia Page", "Schema.org Markup")
- brandStatus: boolean (true if brand has this)
- competitorStatus: boolean (true if competitor has this)
- importance: why this matters for AI visibility
- sourceUrl: evidence URL (use real URLs from the search data, or "N/A")

Focus on: Wikipedia, Schema.org, industry forums, review sites, content depth, structured data, social media presence. Return 5-7 items.`,
  };
}

export function actionPlanPrompt(
  brandName: string,
  category: string,
  region: string,
  gapsJson: string
) {
  return {
    system: `You are a GEO strategy consultant. Always respond with valid JSON only, no markdown.`,
    user: `Based on the gap analysis, create a prioritized action plan to improve ${brandName}'s AI visibility.

Brand: ${brandName} (${category}, ${region})
Gaps identified: ${gapsJson}

For Priority 1 items, generate ACTUAL CONTENT the brand can use immediately:
- Wikipedia draft paragraph
- Schema.org JSON-LD code
- Comparison page outline

Return a JSON array of objects, each with:
- priority: 1, 2, or 3
- title: action title
- description: what to do and why
- gapReference: which gap this addresses
- expectedImpact: expected improvement
- generatedContent: actual usable content (for priority 1 only, null for others)

Return 5-8 items across all 3 priority levels.`,
  };
}

export function radarScoringPrompt(brandName: string, step2Summary: string, step3Summary: string) {
  return {
    system: `You are a brand visibility analyst. Always respond with valid JSON only, no markdown.`,
    user: `Score ${brandName} on 5 dimensions (0-100) based on:

AI responses to 6 queries: ${step2Summary}
Web search results: ${step3Summary}

Dimensions:
1. recognition: How well does AI know this brand?
2. sentiment: How positively does AI describe this brand?
3. relevance: How relevant are AI mentions to the brand's actual services?
4. citation: How likely is AI to cite/recommend this brand?
5. competitive: How does this brand compare to competitors in AI responses?

Return JSON: { "recognition": number, "sentiment": number, "relevance": number, "citation": number, "competitive": number }`,
  };
}
```

**Step 2: Create `src/lib/analyze-response.ts`**

JS string matching for brand mention analysis — avoids extra Claude calls.

```typescript
import type { AIResponse } from './types';

export function analyzeResponse(
  response: string,
  brandName: string
): Omit<AIResponse, 'query' | 'type' | 'response'> {
  const lower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  // Also check shorter variations (e.g., "iCo" for "iCo Dental Group")
  const brandFirstWord = brandName.split(' ')[0].toLowerCase();
  const brandMentioned = lower.includes(brandLower) ||
    (brandFirstWord.length > 2 && lower.includes(brandFirstWord));

  // Find position in numbered list
  const lines = response.split('\n');
  let mentionPosition: number | null = null;
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)[.)]/);
    if (match && line.toLowerCase().includes(brandLower)) {
      mentionPosition = parseInt(match[1]);
      break;
    }
  }

  // Sentiment via keyword matching around brand mention
  let sentiment: 'positive' | 'neutral' | 'negative' | null = null;
  if (brandMentioned) {
    const idx = lower.indexOf(brandLower);
    const contextStart = Math.max(0, idx - 150);
    const contextEnd = Math.min(response.length, idx + brandName.length + 300);
    const context = lower.substring(contextStart, contextEnd);

    const positiveWords = ['excellent', 'great', 'reliable', 'trusted', 'recommend', 'quality', 'leading', 'reputable', 'well-known', 'popular', 'top', 'best', 'strong', 'impressive'];
    const negativeWords = ['limited information', 'unknown', 'no information', 'cannot confirm', 'unclear', 'not widely', 'don\'t have specific', 'limited data', 'not well-known'];

    if (negativeWords.some(w => context.includes(w))) {
      sentiment = 'negative';
    } else if (positiveWords.some(w => context.includes(w))) {
      sentiment = 'positive';
    } else {
      sentiment = 'neutral';
    }
  }

  // Extract competitor names from numbered lists
  const competitorsFound: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*\d+[.)]\s*\*?\*?([^-–:*\n]+)/);
    if (match) {
      const name = match[1].trim().replace(/\*+/g, '').trim();
      if (
        name.length > 2 &&
        name.length < 60 &&
        !name.toLowerCase().includes(brandLower) &&
        !name.toLowerCase().includes(brandFirstWord)
      ) {
        competitorsFound.push(name);
      }
    }
  }

  return { brandMentioned, mentionPosition, sentiment, competitorsFound };
}
```

**Step 3: Create `src/lib/scoring.ts`**

```typescript
import type { AIResponse, WebResult, Scores } from './types';

export function calculateScores(
  aiResponses: AIResponse[],
  webResults: WebResult[],
  radarScores?: Scores['radarScores']
): Scores {
  const discoveryResponses = aiResponses.filter(r => r.type === 'discovery');
  const verificationResponses = aiResponses.filter(r => r.type === 'verification');

  // Discovery Score: % of discovery queries where brand was mentioned
  const discoveryScore = discoveryResponses.length > 0
    ? Math.round(
        (discoveryResponses.filter(r => r.brandMentioned).length / discoveryResponses.length) * 100
      )
    : 0;

  // Trust Score: composite of verification query results
  const trustFactors = verificationResponses.map(r => {
    let score = 0;
    if (r.brandMentioned) score += 20;
    if (r.brandMentioned && r.response.length > 200) score += 20;
    if (r.sentiment === 'positive') score += 20;
    if (r.mentionPosition === 1) score += 20;
    if (r.competitorsFound.length === 0 || r.brandMentioned) score += 20;
    return score;
  });
  const trustScore = trustFactors.length > 0
    ? Math.round(trustFactors.reduce((a, b) => a + b, 0) / trustFactors.length)
    : 0;

  const overallScore = Math.round(discoveryScore * 0.5 + trustScore * 0.5);

  const archetype: Scores['archetype'] =
    overallScore >= 70 ? 'Leader' :
    overallScore >= 40 ? 'Challenger' :
    overallScore >= 15 ? 'Niche Player' : 'Invisible';

  // Prompt sensitivity: for each query, who "won"?
  const promptSensitivity = aiResponses.map(r => {
    const winner = r.brandMentioned
      ? 'Brand'
      : r.competitorsFound[0] || 'No clear winner';
    return {
      query: r.query,
      winner,
      opportunity: !r.brandMentioned && r.competitorsFound.length === 0,
    };
  });

  return {
    discoveryScore,
    trustScore,
    overallScore,
    archetype,
    radarScores: radarScores || { recognition: 0, sentiment: 0, relevance: 0, citation: 0, competitive: 0 },
    promptSensitivity,
  };
}
```

**Step 4: Create `src/lib/tavily.ts`**

```typescript
import { tavily } from '@tavily/core';
import type { WebResult } from './types';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function searchWeb(
  query: string,
  brandName: string,
  knownCompetitors: string[]
): Promise<WebResult> {
  const result = await client.search(query, {
    maxResults: 5,
    searchDepth: 'basic',
  });

  const brandLower = brandName.toLowerCase();
  const sources = result.results.map(r => ({
    title: r.title,
    url: r.url,
    brandMentioned: (r.title + ' ' + (r.content || '')).toLowerCase().includes(brandLower),
  }));

  const brandWebMentions = sources.filter(s => s.brandMentioned).length;

  // Count competitor mentions across all results
  const allContent = result.results.map(r => (r.title + ' ' + (r.content || '')).toLowerCase()).join(' ');
  const competitorWebMentions: Record<string, number> = {};
  for (const comp of knownCompetitors) {
    const count = (allContent.match(new RegExp(comp.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
      competitorWebMentions[comp] = count;
    }
  }

  return { query, sources, brandWebMentions, competitorWebMentions };
}

export async function searchBrandPresence(brandName: string): Promise<string> {
  const queries = [
    `${brandName} wikipedia`,
    `${brandName} reviews`,
    `${brandName} site:reddit.com OR site:dentaltown.com`,
  ];

  const results = await Promise.all(
    queries.map(q => client.search(q, { maxResults: 3, searchDepth: 'basic' }))
  );

  return JSON.stringify(
    results.flatMap(r => r.results.map(item => ({
      title: item.title,
      url: item.url,
      snippet: item.content?.slice(0, 200),
    })))
  );
}
```

**Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add prompt templates, response analyzer, scoring, and tavily wrapper"
```

---

## Task 3: Backend API Route (SSE Streaming)

**Files:**
- Create: `src/app/api/analyze/route.ts`

**Step 1: Create the SSE API route**

This is the heart of the app — orchestrates all 6 steps and streams results.

```typescript
import { generateText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { AnalyzeRequest, GeneratedQuery, AIResponse, SSEEvent } from '@/lib/types';
import { queryGenerationPrompt, aiResponsePrompt, gapAnalysisPrompt, actionPlanPrompt, radarScoringPrompt } from '@/lib/prompts';
import { analyzeResponse } from '@/lib/analyze-response';
import { calculateScores } from '@/lib/scoring';
import { searchWeb, searchBrandPresence } from '@/lib/tavily';

const model = anthropic('claude-haiku-4-5-20251001');

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as AnalyzeRequest;
  const { brandName, category, region } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // === Step 1: Generate Queries ===
        send({ step: 1, status: 'running' });
        const prompt1 = queryGenerationPrompt(body);
        const { object: queries } = await generateObject({
          model,
          schema: z.array(z.object({
            query: z.string(),
            type: z.enum(['discovery', 'verification']),
            intent: z.string(),
            intentEn: z.string(),
          })),
          system: prompt1.system,
          prompt: prompt1.user,
        });
        send({ step: 1, status: 'done', data: queries });

        // === Step 2 + 3: AI Responses + Web Search (parallel) ===
        send({ step: 2, status: 'running' });
        send({ step: 3, status: 'running' });

        const aiResponsesPromise = Promise.all(
          queries.map(async (q): Promise<AIResponse> => {
            const prompt2 = aiResponsePrompt(q.query, q.type, category, brandName);
            const { text } = await generateText({
              model,
              system: prompt2.system,
              prompt: prompt2.user,
            });
            const analysis = analyzeResponse(text, brandName);
            return {
              query: q.query,
              type: q.type,
              response: text,
              ...analysis,
            };
          })
        );

        // Collect all competitor names from AI responses first, then search web
        const aiResponses = await aiResponsesPromise;
        send({ step: 2, status: 'done', data: aiResponses });

        const allCompetitors = [...new Set(aiResponses.flatMap(r => r.competitorsFound))];

        const webResults = await Promise.all(
          queries.map(q => searchWeb(q.query, brandName, allCompetitors))
        );
        send({ step: 3, status: 'done', data: webResults });

        // === Step 4: Scoring ===
        send({ step: 4, status: 'running' });

        // Optional radar scores via Claude
        let radarScores = undefined;
        try {
          const step2Summary = aiResponses.map(r =>
            `Q: "${r.query}" → Brand mentioned: ${r.brandMentioned}, Sentiment: ${r.sentiment}, Competitors: ${r.competitorsFound.join(', ')}`
          ).join('\n');
          const step3Summary = webResults.map(r =>
            `Q: "${r.query}" → Brand web mentions: ${r.brandWebMentions}, Sources: ${r.sources.map(s => s.url).join(', ')}`
          ).join('\n');

          const radarPrompt = radarScoringPrompt(brandName, step2Summary, step3Summary);
          const { object } = await generateObject({
            model,
            schema: z.object({
              recognition: z.number(),
              sentiment: z.number(),
              relevance: z.number(),
              citation: z.number(),
              competitive: z.number(),
            }),
            system: radarPrompt.system,
            prompt: radarPrompt.user,
          });
          radarScores = object;
        } catch {
          // Radar is optional — continue without it
        }

        const scores = calculateScores(aiResponses, webResults, radarScores);
        send({ step: 4, status: 'done', data: scores });

        // === Step 5: Gap Analysis ===
        send({ step: 5, status: 'running' });

        const topCompetitor = allCompetitors[0] || 'industry leader';
        const [brandWebData, competitorWebData] = await Promise.all([
          searchBrandPresence(brandName),
          searchBrandPresence(topCompetitor),
        ]);

        const aiResponsesSummary = aiResponses.map(r =>
          `Q: "${r.query}" (${r.type}) → Mentioned: ${r.brandMentioned}, Position: ${r.mentionPosition}, Sentiment: ${r.sentiment}`
        ).join('\n');

        const gapPrompt = gapAnalysisPrompt(brandName, brandWebData, competitorWebData, aiResponsesSummary);
        const { object: gaps } = await generateObject({
          model,
          schema: z.array(z.object({
            factor: z.string(),
            brandStatus: z.boolean(),
            competitorStatus: z.boolean(),
            importance: z.string(),
            sourceUrl: z.string(),
          })),
          system: gapPrompt.system,
          prompt: gapPrompt.user,
        });
        send({ step: 5, status: 'done', data: gaps });

        // === Step 6: Action Plan ===
        send({ step: 6, status: 'running' });
        const actionPrompt = actionPlanPrompt(brandName, category, region, JSON.stringify(gaps));
        const { object: actions } = await generateObject({
          model,
          schema: z.array(z.object({
            priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
            title: z.string(),
            description: z.string(),
            gapReference: z.string(),
            expectedImpact: z.string(),
            generatedContent: z.string().nullable(),
          })),
          system: actionPrompt.system,
          prompt: actionPrompt.user,
        });
        send({ step: 6, status: 'done', data: actions });

      } catch (error) {
        send({ step: 'error', message: error instanceof Error ? error.message : String(error) });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

**Step 2: Verify API works**

```bash
cd /Users/maxwsy/workspace/ai-shelf && npm run dev
```

Test with curl (only if API keys are set in `.env.local`):
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"brandName":"iCo Dental Group","category":"dental lab","region":"New Jersey"}'
```

Expected: SSE stream with `data: {...}` lines for each step.

**Step 3: Commit**

```bash
git add src/app/api/
git commit -m "feat: add SSE streaming API route with 6-step analysis pipeline"
```

---

## Task 4: Frontend — Layout + Brand Input + SSE Consumer

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/brand-input.tsx`
- Create: `src/components/progress-stepper.tsx`

**Step 1: Update `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The AI Shelf — Brand Visibility in AI',
  description: 'Measure your brand\'s visibility in AI-generated responses. GEO analysis tool.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Create `src/components/brand-input.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface BrandInputProps {
  onSubmit: (data: { brandName: string; category: string; region: string }) => void;
  isLoading: boolean;
}

export function BrandInput({ onSubmit, isLoading }: BrandInputProps) {
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brandName && category && region) {
      onSubmit({ brandName, category, region });
    }
  };

  const fillExample = () => {
    setBrandName('iCo Dental Group');
    setCategory('dental lab');
    setRegion('New Jersey');
  };

  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Brand Name</label>
            <Input
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="e.g., iCo Dental Group"
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Category</label>
            <Input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g., dental lab"
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Region</label>
            <Input
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="e.g., New Jersey"
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8">
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
          <Button type="button" variant="outline" onClick={fillExample} className="border-zinc-700 text-zinc-300">
            Try: iCo Dental Group
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

**Step 3: Create `src/components/progress-stepper.tsx`**

```tsx
'use client';

import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Query Generation' },
  { num: 2, label: 'AI Responses' },
  { num: 3, label: 'Web Reality Check' },
  { num: 4, label: 'Scoring' },
  { num: 5, label: 'Gap Analysis' },
  { num: 6, label: 'Action Plan' },
];

interface ProgressStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-4">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                completedSteps.has(step.num)
                  ? 'bg-green-600 text-white'
                  : currentStep === step.num
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-zinc-800 text-zinc-500'
              )}
            >
              {completedSteps.has(step.num) ? '✓' : step.num}
            </div>
            <span className="text-xs text-zinc-500 mt-1 text-center w-20">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'h-px w-8 mx-1 mt-[-16px]',
                completedSteps.has(step.num) ? 'bg-green-600' : 'bg-zinc-800'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Update `src/app/page.tsx` — main page with SSE consumer**

```tsx
'use client';

import { useState, useCallback } from 'react';
import type { AnalyzeRequest, GeneratedQuery, AIResponse, WebResult, Scores, GapItem, ActionItem, SSEEvent } from '@/lib/types';
import { BrandInput } from '@/components/brand-input';
import { ProgressStepper } from '@/components/progress-stepper';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Step data
  const [step1Data, setStep1Data] = useState<GeneratedQuery[] | null>(null);
  const [step2Data, setStep2Data] = useState<AIResponse[] | null>(null);
  const [step3Data, setStep3Data] = useState<WebResult[] | null>(null);
  const [step4Data, setStep4Data] = useState<Scores | null>(null);
  const [step5Data, setStep5Data] = useState<GapItem[] | null>(null);
  const [step6Data, setStep6Data] = useState<ActionItem[] | null>(null);
  const [brandName, setBrandName] = useState('');

  const handleAnalyze = useCallback(async (input: AnalyzeRequest) => {
    // Reset state
    setIsAnalyzing(true);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setError(null);
    setStep1Data(null);
    setStep2Data(null);
    setStep3Data(null);
    setStep4Data(null);
    setStep5Data(null);
    setStep6Data(null);
    setBrandName(input.brandName);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const event = JSON.parse(part.slice(6)) as SSEEvent;

          if (event.step === 'error') {
            setError(event.message);
            continue;
          }

          if (event.status === 'running') {
            setCurrentStep(event.step);
          }

          if (event.status === 'done') {
            setCompletedSteps(prev => new Set([...prev, event.step]));
            switch (event.step) {
              case 1: setStep1Data(event.data || null); break;
              case 2: setStep2Data(event.data || null); break;
              case 3: setStep3Data(event.data || null); break;
              case 4: setStep4Data(event.data || null); break;
              case 5: setStep5Data(event.data || null); break;
              case 6: setStep6Data(event.data || null); break;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          The AI Shelf
        </h1>
        <p className="text-zinc-400 text-lg">
          Measure your brand&apos;s visibility on the invisible AI shelf
        </p>
      </div>

      {/* Input */}
      <BrandInput onSubmit={handleAnalyze} isLoading={isAnalyzing} />

      {/* Progress */}
      {currentStep > 0 && (
        <div className="mt-8">
          <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      {/* Results — placeholder, will be filled in Task 5 */}
      <div className="mt-8 space-y-6">
        {step1Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 1: Generated Queries</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step1Data, null, 2)}</pre>
          </div>
        )}
        {step2Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 2: AI Responses</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step2Data, null, 2)}</pre>
          </div>
        )}
        {step3Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 3: Web Reality Check</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step3Data, null, 2)}</pre>
          </div>
        )}
        {step4Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 4: Scores</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step4Data, null, 2)}</pre>
          </div>
        )}
        {step5Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 5: Gap Analysis</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step5Data, null, 2)}</pre>
          </div>
        )}
        {step6Data && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-2">Step 6: Action Plan</h3>
            <pre className="text-xs text-zinc-400 overflow-auto">{JSON.stringify(step6Data, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
```

**Step 5: Verify**

```bash
cd /Users/maxwsy/workspace/ai-shelf && npm run dev
```

Open browser → enter iCo Dental Group / dental lab / New Jersey → click Analyze → should see progress stepper animate and raw JSON appear for each step.

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add frontend layout, brand input, progress stepper, and SSE consumer"
```

---

## Task 5: Frontend — Result Components (Visual Polish)

**Files:**
- Create: `src/components/score-display.tsx`
- Create: `src/components/evidence-card.tsx`
- Create: `src/components/intent-badge.tsx`
- Create: `src/components/sentiment-badge.tsx`
- Create: `src/components/source-link.tsx`
- Create: `src/components/gap-table.tsx`
- Create: `src/components/competitor-bar.tsx`
- Create: `src/components/step-panel.tsx`

**Step 1: Create small utility components**

`src/components/intent-badge.tsx`:
```tsx
import { Badge } from '@/components/ui/badge';

export function IntentBadge({ type, intent }: { type: 'discovery' | 'verification'; intent: string }) {
  return (
    <Badge variant="outline" className={type === 'discovery' ? 'border-blue-500 text-blue-400' : 'border-purple-500 text-purple-400'}>
      {type === 'discovery' ? '🔍' : '✓'} {intent}
    </Badge>
  );
}
```

`src/components/sentiment-badge.tsx`:
```tsx
import { Badge } from '@/components/ui/badge';

export function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' | null }) {
  if (!sentiment) return null;
  const config = {
    positive: { label: 'Positive', className: 'bg-green-900/50 text-green-400 border-green-700' },
    neutral: { label: 'Neutral', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
    negative: { label: 'Negative', className: 'bg-red-900/50 text-red-400 border-red-700' },
  };
  const c = config[sentiment];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}
```

`src/components/source-link.tsx`:
```tsx
export function SourceLink({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 truncate block max-w-md"
    >
      {title || url}
    </a>
  );
}
```

**Step 2: Create `src/components/score-display.tsx`**

```tsx
import { Badge } from '@/components/ui/badge';
import type { Scores } from '@/lib/types';

const archetypeConfig = {
  Leader: { color: 'bg-green-600', emoji: '👑' },
  Challenger: { color: 'bg-yellow-600', emoji: '⚡' },
  'Niche Player': { color: 'bg-orange-600', emoji: '🔸' },
  Invisible: { color: 'bg-red-600', emoji: '👻' },
};

export function ScoreDisplay({ scores }: { scores: Scores }) {
  const config = archetypeConfig[scores.archetype];
  return (
    <div className="space-y-6">
      {/* Hero Score */}
      <div className="text-center">
        <div className="text-7xl font-bold tabular-nums">
          {scores.overallScore}
          <span className="text-2xl text-zinc-500">/100</span>
        </div>
        <Badge className={`${config.color} text-white text-lg px-4 py-1 mt-2`}>
          {config.emoji} {scores.archetype}
        </Badge>
      </div>

      {/* Two scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-sm text-zinc-400 mb-1">Discovery Score</div>
          <div className="text-3xl font-bold">{scores.discoveryScore}%</div>
          <div className="text-xs text-zinc-500 mt-1">Found in general searches</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-sm text-zinc-400 mb-1">Trust Score</div>
          <div className="text-3xl font-bold">{scores.trustScore}%</div>
          <div className="text-xs text-zinc-500 mt-1">AI can vouch for you</div>
        </div>
      </div>

      {/* Prompt Sensitivity */}
      {scores.promptSensitivity.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Prompt Sensitivity</h4>
          <div className="space-y-1">
            {scores.promptSensitivity.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-zinc-800">
                <span className="text-zinc-300 truncate max-w-xs">&quot;{p.query}&quot;</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">{p.winner}</span>
                  {p.opportunity && <Badge variant="outline" className="border-yellow-600 text-yellow-400 text-xs">Opportunity</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create `src/components/evidence-card.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntentBadge } from './intent-badge';
import { SentimentBadge } from './sentiment-badge';
import type { AIResponse } from '@/lib/types';

function highlightBrand(text: string, brand: string): React.ReactNode {
  if (!brand) return text;
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === brand.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 px-0.5 rounded font-semibold text-yellow-200">{part}</mark>
      : part
  );
}

export function EvidenceCard({ response, brandName }: { response: AIResponse; brandName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 bg-zinc-800/50 border-zinc-700">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-1">
          <p className="font-medium text-sm">&quot;{response.query}&quot;</p>
          <IntentBadge type={response.type} intent={response.type} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {response.brandMentioned ? (
            <Badge className="bg-green-900/50 text-green-400 border-green-700">✅ Mentioned</Badge>
          ) : (
            <Badge className="bg-red-900/50 text-red-400 border-red-700">❌ Not Mentioned</Badge>
          )}
          <SentimentBadge sentiment={response.sentiment} />
        </div>
      </div>

      {/* Collapsible AI response */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-400 hover:text-blue-300 mb-2"
      >
        {expanded ? '▼ Hide response' : '▶ Show AI response'}
      </button>

      {expanded && (
        <div className="text-sm text-zinc-300 bg-zinc-900 rounded p-3 mt-1 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {highlightBrand(response.response, brandName)}
        </div>
      )}

      {/* Competitors */}
      {response.competitorsFound.length > 0 && (
        <p className="text-xs text-zinc-500 mt-2">
          Also mentioned: {response.competitorsFound.join(', ')}
        </p>
      )}
    </Card>
  );
}
```

**Step 4: Create `src/components/competitor-bar.tsx`**

```tsx
interface CompetitorBarProps {
  mentions: Record<string, number>;
  brandName: string;
  brandMentions: number;
}

export function CompetitorBar({ mentions, brandName, brandMentions }: CompetitorBarProps) {
  const all = [
    { name: brandName, count: brandMentions, isBrand: true },
    ...Object.entries(mentions).map(([name, count]) => ({ name, count, isBrand: false })),
  ].sort((a, b) => b.count - a.count);

  const max = Math.max(...all.map(a => a.count), 1);

  return (
    <div className="space-y-2">
      {all.slice(0, 6).map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className={`text-sm w-32 truncate ${item.isBrand ? 'text-yellow-400 font-semibold' : 'text-zinc-400'}`}>
            {item.name}
          </span>
          <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${item.isBrand ? 'bg-yellow-600' : 'bg-zinc-600'}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-sm text-zinc-500 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
```

**Step 5: Create `src/components/gap-table.tsx`**

```tsx
import { SourceLink } from './source-link';
import type { GapItem } from '@/lib/types';

export function GapTable({ gaps, brandName, competitorName }: { gaps: GapItem[]; brandName: string; competitorName: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-zinc-400">
            <th className="text-left py-2 pr-4">Factor</th>
            <th className="text-center py-2 px-4">{brandName}</th>
            <th className="text-center py-2 px-4">{competitorName}</th>
            <th className="text-left py-2 px-4">Why It Matters</th>
            <th className="text-left py-2 pl-4">Source</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap, i) => (
            <tr key={i} className="border-b border-zinc-800">
              <td className="py-2 pr-4 font-medium">{gap.factor}</td>
              <td className="text-center py-2 px-4">{gap.brandStatus ? '✅' : '❌'}</td>
              <td className="text-center py-2 px-4">{gap.competitorStatus ? '✅' : '❌'}</td>
              <td className="py-2 px-4 text-zinc-400">{gap.importance}</td>
              <td className="py-2 pl-4">
                {gap.sourceUrl && gap.sourceUrl !== 'N/A' && (
                  <SourceLink title="🔗" url={gap.sourceUrl} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 6: Create `src/components/step-panel.tsx`**

Generic collapsible panel wrapper for each step.

```tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StepPanelProps {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  children: React.ReactNode;
}

export function StepPanel({ stepNumber, title, isComplete, isActive, children }: StepPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={cn(
      'border transition-all',
      isActive && 'border-blue-600 bg-zinc-900',
      isComplete && 'border-zinc-700 bg-zinc-900',
      !isActive && !isComplete && 'border-zinc-800 bg-zinc-900/50 opacity-50'
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium',
            isComplete ? 'bg-green-600 text-white' :
            isActive ? 'bg-blue-600 text-white animate-pulse' :
            'bg-zinc-800 text-zinc-500'
          )}>
            {isComplete ? '✓' : stepNumber}
          </div>
          <span className="font-medium">{title}</span>
          {isActive && <span className="text-xs text-blue-400 animate-pulse">Processing...</span>}
        </div>
        <span className="text-zinc-500">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (isComplete || isActive) && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </Card>
  );
}
```

**Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add result display components — scores, evidence cards, gap table, competitor bars"
```

---

## Task 6: Wire Up Result Components in Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace the raw JSON placeholder sections in `page.tsx` with proper components**

Replace the entire results `<div>` section (the `{/* Results — placeholder */}` area) with:

```tsx
{/* Results */}
<div className="mt-8 space-y-4">
  {/* Step 1: Queries */}
  {(step1Data || currentStep >= 1) && (
    <StepPanel stepNumber={1} title="Query Generation" isComplete={completedSteps.has(1)} isActive={currentStep === 1 && !completedSteps.has(1)}>
      {step1Data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-2">🔍 Discovery Queries</h4>
            <div className="space-y-2">
              {step1Data.filter(q => q.type === 'discovery').map((q, i) => (
                <div key={i} className="bg-zinc-800 rounded p-3">
                  <p className="text-sm font-medium">&quot;{q.query}&quot;</p>
                  <p className="text-xs text-zinc-400 mt-1">{q.intentEn}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-400 mb-2">✓ Verification Queries</h4>
            <div className="space-y-2">
              {step1Data.filter(q => q.type === 'verification').map((q, i) => (
                <div key={i} className="bg-zinc-800 rounded p-3">
                  <p className="text-sm font-medium">&quot;{q.query}&quot;</p>
                  <p className="text-xs text-zinc-400 mt-1">{q.intentEn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </StepPanel>
  )}

  {/* Step 2: AI Responses */}
  {(step2Data || currentStep >= 2) && (
    <StepPanel stepNumber={2} title="AI Responses" isComplete={completedSteps.has(2)} isActive={currentStep === 2 && !completedSteps.has(2)}>
      {step2Data && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            {brandName} mentioned in {step2Data.filter(r => r.brandMentioned).length} of {step2Data.length} queries
          </p>
          {step2Data.map((r, i) => (
            <EvidenceCard key={i} response={r} brandName={brandName} />
          ))}
        </div>
      )}
    </StepPanel>
  )}

  {/* Step 3: Web Reality */}
  {(step3Data || currentStep >= 3) && (
    <StepPanel stepNumber={3} title="Web Reality Check" isComplete={completedSteps.has(3)} isActive={currentStep === 3 && !completedSteps.has(3)}>
      {step3Data && (
        <div className="space-y-4">
          {/* Aggregate competitor mentions */}
          <CompetitorBar
            mentions={step3Data.reduce((acc, w) => {
              Object.entries(w.competitorWebMentions).forEach(([k, v]) => {
                acc[k] = (acc[k] || 0) + v;
              });
              return acc;
            }, {} as Record<string, number>)}
            brandName={brandName}
            brandMentions={step3Data.reduce((sum, w) => sum + w.brandWebMentions, 0)}
          />
          {/* Source links per query */}
          {step3Data.map((w, i) => (
            <div key={i} className="border-t border-zinc-800 pt-2">
              <p className="text-sm font-medium mb-1">&quot;{w.query}&quot;</p>
              <div className="space-y-1">
                {w.sources.map((s, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-xs">{s.brandMentioned ? '✅' : '⬜'}</span>
                    <SourceLink title={s.title} url={s.url} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </StepPanel>
  )}

  {/* Step 4: Scores */}
  {(step4Data || currentStep >= 4) && (
    <StepPanel stepNumber={4} title="Brand Score" isComplete={completedSteps.has(4)} isActive={currentStep === 4 && !completedSteps.has(4)}>
      {step4Data && <ScoreDisplay scores={step4Data} />}
    </StepPanel>
  )}

  {/* Step 5: Gap Analysis */}
  {(step5Data || currentStep >= 5) && (
    <StepPanel stepNumber={5} title="Gap Analysis" isComplete={completedSteps.has(5)} isActive={currentStep === 5 && !completedSteps.has(5)}>
      {step5Data && (
        <GapTable
          gaps={step5Data}
          brandName={brandName}
          competitorName={step2Data?.[0]?.competitorsFound[0] || 'Competitor'}
        />
      )}
    </StepPanel>
  )}

  {/* Step 6: Action Plan */}
  {(step6Data || currentStep >= 6) && (
    <StepPanel stepNumber={6} title="Action Plan" isComplete={completedSteps.has(6)} isActive={currentStep === 6 && !completedSteps.has(6)}>
      {step6Data && (
        <div className="space-y-4">
          {[1, 2, 3].map(priority => {
            const items = step6Data.filter(a => a.priority === priority);
            if (items.length === 0) return null;
            const labels = { 1: 'This Week', 2: 'This Month', 3: 'Ongoing' };
            const colors = { 1: 'border-red-600', 2: 'border-yellow-600', 3: 'border-green-600' };
            return (
              <div key={priority}>
                <h4 className={`text-sm font-medium mb-2 ${priority === 1 ? 'text-red-400' : priority === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                  Priority {priority}: {labels[priority as 1|2|3]}
                </h4>
                <div className="space-y-2">
                  {items.map((action, i) => (
                    <div key={i} className={`border-l-2 ${colors[priority as 1|2|3]} pl-4 py-2`}>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-zinc-400 mt-1">{action.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">Expected: {action.expectedImpact}</p>
                      {action.generatedContent && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-400 cursor-pointer">View generated content</summary>
                          <pre className="text-xs text-zinc-300 bg-zinc-800 rounded p-2 mt-1 whitespace-pre-wrap overflow-auto max-h-48">
                            {action.generatedContent}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StepPanel>
  )}
</div>
```

Add the necessary imports at the top of `page.tsx`:

```typescript
import { StepPanel } from '@/components/step-panel';
import { EvidenceCard } from '@/components/evidence-card';
import { ScoreDisplay } from '@/components/score-display';
import { CompetitorBar } from '@/components/competitor-bar';
import { GapTable } from '@/components/gap-table';
import { SourceLink } from '@/components/source-link';
```

**Step 2: Verify**

```bash
cd /Users/maxwsy/workspace/ai-shelf && npm run dev
```

Full end-to-end test with iCo Dental Group. All 6 steps should render beautifully.

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: wire up all result components with proper visual rendering"
```

---

## Task 7: Radar Chart (Optional — Time Permitting)

**Files:**
- Create: `src/components/radar-chart-display.tsx`
- Modify: `src/app/page.tsx` (add radar chart to Step 4 panel)

**Step 1: Create `src/components/radar-chart-display.tsx`**

```tsx
'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { Scores } from '@/lib/types';

export function RadarChartDisplay({ radarScores }: { radarScores: Scores['radarScores'] }) {
  const data = [
    { dimension: 'Recognition', value: radarScores.recognition },
    { dimension: 'Sentiment', value: radarScores.sentiment },
    { dimension: 'Relevance', value: radarScores.relevance },
    { dimension: 'Citation', value: radarScores.citation },
    { dimension: 'Competitive', value: radarScores.competitive },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Brand"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Add to Step 4 panel in `page.tsx`**

After `<ScoreDisplay scores={step4Data} />`, add:
```tsx
{step4Data.radarScores && step4Data.radarScores.recognition > 0 && (
  <RadarChartDisplay radarScores={step4Data.radarScores} />
)}
```

Import: `import { RadarChartDisplay } from '@/components/radar-chart-display';`

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: add optional radar chart for 5-dimension brand visibility"
```

---

## Task 8: Deploy to Vercel

**Step 1: Build check**

```bash
cd /Users/maxwsy/workspace/ai-shelf && npm run build
```

Fix any type errors or build issues.

**Step 2: Deploy**

```bash
cd /Users/maxwsy/workspace/ai-shelf
npx vercel login
npx vercel env add ANTHROPIC_API_KEY
npx vercel env add TAVILY_API_KEY
npx vercel --prod
```

**Step 3: Verify deployment**

Open the Vercel URL → test with iCo Dental Group → verify all 6 steps complete.

**Step 4: Commit deployment config**

```bash
git add -A
git commit -m "chore: vercel deployment config"
```

---

## Task 9: Polish + Error Handling

**Files:**
- Modify: `src/app/api/analyze/route.ts` (add input validation, API key check)
- Modify: `src/app/page.tsx` (add loading skeleton)

**Step 1: Add input validation to API route**

At the top of the POST handler, before the stream:

```typescript
if (!process.env.ANTHROPIC_API_KEY || !process.env.TAVILY_API_KEY) {
  return new Response(
    JSON.stringify({ error: 'API keys not configured. Set ANTHROPIC_API_KEY and TAVILY_API_KEY.' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

if (!body.brandName || !body.category || !body.region) {
  return new Response(
    JSON.stringify({ error: 'Missing required fields: brandName, category, region' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Step 2: Commit**

```bash
git add src/
git commit -m "feat: add input validation and error handling polish"
```

---

## Summary: Task Dependency Graph

```
Task 1 (Scaffold)
  └→ Task 2 (Lib utilities)
       └→ Task 3 (API route)
            └→ Task 4 (Frontend skeleton + SSE)
                 └→ Task 5 (Result components)
                      └→ Task 6 (Wire up page)
                           ├→ Task 7 (Radar chart, optional)
                           └→ Task 8 (Deploy)
                                └→ Task 9 (Polish)
```

All tasks are sequential. Estimated total: ~90-100 min of coding + 20 min testing/deploy.
