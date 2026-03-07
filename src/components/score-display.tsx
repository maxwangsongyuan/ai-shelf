import { Badge } from '@/components/ui/badge';
import type { Scores } from '@/lib/types';

const archetypeConfig = {
  Leader: { color: 'bg-green-600', emoji: '\uD83D\uDC51' },
  Challenger: { color: 'bg-yellow-600', emoji: '\u26A1' },
  'Niche Player': { color: 'bg-orange-600', emoji: '\uD83D\uDD38' },
  Invisible: { color: 'bg-red-600', emoji: '\uD83D\uDC7B' },
};

export function ScoreDisplay({ scores }: { scores: Scores }) {
  const config = archetypeConfig[scores.archetype];
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-7xl font-bold tabular-nums">
          {scores.overallScore}<span className="text-2xl text-zinc-500">/100</span>
        </div>
        <Badge className={`${config.color} text-white text-lg px-4 py-1 mt-2`}>
          {config.emoji} {scores.archetype}
        </Badge>
      </div>
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
