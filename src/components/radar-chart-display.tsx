'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { Scores } from '@/lib/types';

export function RadarChartDisplay({ radarScores }: { radarScores: Scores['radarScores'] }) {
  const data = [
    { dimension: 'Recognition', value: radarScores.recognition },
    { dimension: 'Sentiment', value: radarScores.sentiment },
    { dimension: 'Relevance', value: radarScores.relevance },
    { dimension: 'Citation', value: radarScores.citation },
    { dimension: 'Competitive', value: radarScores.competitive },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Brand" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
