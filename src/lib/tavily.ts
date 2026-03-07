import { tavily } from '@tavily/core';
import type { WebResult } from './types';

function getClient() {
  return tavily({ apiKey: process.env.TAVILY_API_KEY! });
}

export async function searchWeb(query: string, brandName: string, knownCompetitors: string[]): Promise<WebResult> {
  const client = getClient();
  const result = await client.search(query, { maxResults: 5, searchDepth: 'basic' });

  const brandLower = brandName.toLowerCase();
  const sources = result.results.map(r => ({
    title: r.title,
    url: r.url,
    brandMentioned: (r.title + ' ' + (r.content || '')).toLowerCase().includes(brandLower),
  }));

  const brandWebMentions = sources.filter(s => s.brandMentioned).length;

  const allContent = result.results.map(r => (r.title + ' ' + (r.content || '')).toLowerCase()).join(' ');
  const competitorWebMentions: Record<string, number> = {};
  for (const comp of knownCompetitors) {
    const escaped = comp.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (allContent.match(new RegExp(escaped, 'g')) || []).length;
    if (count > 0) competitorWebMentions[comp] = count;
  }

  return { query, sources, brandWebMentions, competitorWebMentions };
}

export async function searchBrandPresence(brandName: string): Promise<string> {
  const client = getClient();
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
