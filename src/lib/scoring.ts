import type { AIResponse, WebResult, Scores } from './types';

export function calculateScores(
  aiResponses: AIResponse[],
  webResults: WebResult[],
  radarScores?: Scores['radarScores']
): Scores {
  const discoveryResponses = aiResponses.filter(r => r.type === 'discovery');
  const verificationResponses = aiResponses.filter(r => r.type === 'verification');

  const discoveryScore = discoveryResponses.length > 0
    ? Math.round((discoveryResponses.filter(r => r.brandMentioned).length / discoveryResponses.length) * 100)
    : 0;

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

  const promptSensitivity = aiResponses.map(r => {
    const winner = r.brandMentioned ? 'Brand' : r.competitorsFound[0] || 'No clear winner';
    return { query: r.query, winner, opportunity: !r.brandMentioned && r.competitorsFound.length === 0 };
  });

  return {
    discoveryScore, trustScore, overallScore, archetype,
    radarScores: radarScores || { recognition: 0, sentiment: 0, relevance: 0, citation: 0, competitive: 0 },
    promptSensitivity,
  };
}
