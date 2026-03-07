import { Badge } from '@/components/ui/badge';

export function IntentBadge({ type, intent }: { type: 'discovery' | 'verification'; intent: string }) {
  return (
    <Badge variant="outline" className={type === 'discovery' ? 'border-blue-500 text-blue-400' : 'border-purple-500 text-purple-400'}>
      {type === 'discovery' ? '\uD83D\uDD0D' : '\u2713'} {intent}
    </Badge>
  );
}
