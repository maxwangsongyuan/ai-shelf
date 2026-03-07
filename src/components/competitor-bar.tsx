interface CompetitorBarProps {
  mentions: Record<string, number>;
  brandName: string;
  brandMentions: number;
}

export function CompetitorBar({ mentions, brandName, brandMentions }: CompetitorBarProps) {
  const all = [
    { name: brandName, count: brandMentions, isBrand: true },
    ...Object.entries(mentions).map(([name, count]) => ({ name, count, isBrand: false })),
  ].sort((a, b) => b.count - a.count);

  const max = Math.max(...all.map(a => a.count), 1);

  return (
    <div className="space-y-2">
      {all.slice(0, 6).map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className={`text-sm w-32 truncate ${item.isBrand ? 'text-yellow-400 font-semibold' : 'text-zinc-400'}`}>
            {item.name}
          </span>
          <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${item.isBrand ? 'bg-yellow-600' : 'bg-zinc-600'}`}
              style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="text-sm text-zinc-500 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
