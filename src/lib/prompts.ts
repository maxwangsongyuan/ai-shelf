import type { AnalyzeRequest } from './types';

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

export function gapAnalysisPrompt(brandName: string, brandWebData: string, competitorWebData: string, aiResponsesSummary: string) {
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

export function actionPlanPrompt(brandName: string, category: string, region: string, gapsJson: string) {
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
