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
            <Badge className="bg-green-900/50 text-green-400 border-green-700">{'\u2705'} Mentioned</Badge>
          ) : (
            <Badge className="bg-red-900/50 text-red-400 border-red-700">{'\u274C'} Not Mentioned</Badge>
          )}
          <SentimentBadge sentiment={response.sentiment} />
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-400 hover:text-blue-300 mb-2">
        {expanded ? '\u25BC Hide response' : '\u25B6 Show AI response'}
      </button>
      {expanded && (
        <div className="text-sm text-zinc-300 bg-zinc-900 rounded p-3 mt-1 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {highlightBrand(response.response, brandName)}
        </div>
      )}
      {response.competitorsFound.length > 0 && (
        <p className="text-xs text-zinc-500 mt-2">Also mentioned: {response.competitorsFound.join(', ')}</p>
      )}
    </Card>
  );
}
