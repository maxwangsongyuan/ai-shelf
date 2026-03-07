export interface AnalyzeRequest {
  brandName: string;
  category: string;
  region: string;
}

export interface GeneratedQuery {
  query: string;
  type: 'discovery' | 'verification';
  intent: string;
  intentEn: string;
}

export interface AIResponse {
  query: string;
  type: 'discovery' | 'verification';
  response: string;
  brandMentioned: boolean;
  mentionPosition: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorsFound: string[];
}

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

export interface GapItem {
  factor: string;
  brandStatus: boolean;
  competitorStatus: boolean;
  importance: string;
  sourceUrl: string;
}

export interface ActionItem {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  gapReference: string;
  expectedImpact: string;
  generatedContent?: string;
}

export type SSEEvent =
  | { step: 1; status: 'running' | 'done'; data?: GeneratedQuery[] }
  | { step: 2; status: 'running' | 'done'; data?: AIResponse[]; progress?: number }
  | { step: 3; status: 'running' | 'done'; data?: WebResult[]; progress?: number }
  | { step: 4; status: 'running' | 'done'; data?: Scores }
  | { step: 5; status: 'running' | 'done'; data?: GapItem[] }
  | { step: 6; status: 'running' | 'done'; data?: ActionItem[] }
  | { step: 'error'; message: string };
