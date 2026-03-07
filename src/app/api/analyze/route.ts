import { generateText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { AnalyzeRequest, AIResponse, SSEEvent } from '@/lib/types';
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

  if (!process.env.ANTHROPIC_API_KEY || !process.env.TAVILY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API keys not configured. Set ANTHROPIC_API_KEY and TAVILY_API_KEY.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!brandName || !category || !region) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: brandName, category, region' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Step 1: Generate Queries
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

        // Step 2 + 3: AI Responses + Web Search (parallel where possible)
        send({ step: 2, status: 'running' });
        send({ step: 3, status: 'running' });

        const aiResponses: AIResponse[] = await Promise.all(
          queries.map(async (q) => {
            const prompt2 = aiResponsePrompt(q.query, q.type, category, brandName);
            const { text } = await generateText({
              model,
              system: prompt2.system,
              prompt: prompt2.user,
            });
            const analysis = analyzeResponse(text, brandName);
            return { query: q.query, type: q.type, response: text, ...analysis };
          })
        );
        send({ step: 2, status: 'done', data: aiResponses });

        const allCompetitors = [...new Set(aiResponses.flatMap(r => r.competitorsFound))];
        const webResults = await Promise.all(
          queries.map(q => searchWeb(q.query, brandName, allCompetitors))
        );
        send({ step: 3, status: 'done', data: webResults });

        // Step 4: Scoring
        send({ step: 4, status: 'running' });
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
        } catch { /* radar is optional */ }

        const scores = calculateScores(aiResponses, webResults, radarScores);
        send({ step: 4, status: 'done', data: scores });

        // Step 5: Gap Analysis
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

        // Step 6: Action Plan
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
