import type { AIResponse } from './types';

export function analyzeResponse(
  response: string,
  brandName: string
): Omit<AIResponse, 'query' | 'type' | 'response'> {
  const lower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const brandFirstWord = brandName.split(' ')[0].toLowerCase();
  const brandMentioned = lower.includes(brandLower) ||
    (brandFirstWord.length > 2 && lower.includes(brandFirstWord));

  const lines = response.split('\n');
  let mentionPosition: number | null = null;
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)[.)]/);
    if (match && line.toLowerCase().includes(brandLower)) {
      mentionPosition = parseInt(match[1]);
      break;
    }
  }

  let sentiment: 'positive' | 'neutral' | 'negative' | null = null;
  if (brandMentioned) {
    const idx = lower.indexOf(brandLower);
    const contextStart = Math.max(0, idx - 150);
    const contextEnd = Math.min(response.length, idx + brandName.length + 300);
    const context = lower.substring(contextStart, contextEnd);

    const positiveWords = ['excellent', 'great', 'reliable', 'trusted', 'recommend', 'quality', 'leading', 'reputable', 'well-known', 'popular', 'top', 'best', 'strong', 'impressive'];
    const negativeWords = ['limited information', 'unknown', 'no information', 'cannot confirm', 'unclear', 'not widely', "don't have specific", 'limited data', 'not well-known'];

    if (negativeWords.some(w => context.includes(w))) {
      sentiment = 'negative';
    } else if (positiveWords.some(w => context.includes(w))) {
      sentiment = 'positive';
    } else {
      sentiment = 'neutral';
    }
  }

  const competitorsFound: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*\d+[.)]\s*\*?\*?([^-–:*\n]+)/);
    if (match) {
      const name = match[1].trim().replace(/\*+/g, '').trim();
      if (name.length > 2 && name.length < 60 && !name.toLowerCase().includes(brandLower) && !name.toLowerCase().includes(brandFirstWord)) {
        competitorsFound.push(name);
      }
    }
  }

  return { brandMentioned, mentionPosition, sentiment, competitorsFound };
}
