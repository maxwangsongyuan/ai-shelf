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
