import { SourceLink } from './source-link';
import type { GapItem } from '@/lib/types';

export function GapTable({ gaps, brandName, competitorName }: { gaps: GapItem[]; brandName: string; competitorName: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-zinc-400">
            <th className="text-left py-2 pr-4">Factor</th>
            <th className="text-center py-2 px-4">{brandName}</th>
            <th className="text-center py-2 px-4">{competitorName}</th>
            <th className="text-left py-2 px-4">Why It Matters</th>
            <th className="text-left py-2 pl-4">Source</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap, i) => (
            <tr key={i} className="border-b border-zinc-800">
              <td className="py-2 pr-4 font-medium">{gap.factor}</td>
              <td className="text-center py-2 px-4">{gap.brandStatus ? '\u2705' : '\u274C'}</td>
              <td className="text-center py-2 px-4">{gap.competitorStatus ? '\u2705' : '\u274C'}</td>
              <td className="py-2 px-4 text-zinc-400">{gap.importance}</td>
              <td className="py-2 pl-4">
                {gap.sourceUrl && gap.sourceUrl !== 'N/A' && <SourceLink title={'\uD83D\uDD17'} url={gap.sourceUrl} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
