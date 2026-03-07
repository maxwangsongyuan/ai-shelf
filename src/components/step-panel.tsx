'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StepPanelProps {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  children: React.ReactNode;
}

export function StepPanel({ stepNumber, title, isComplete, isActive, children }: StepPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={cn(
      'border transition-all',
      isActive && 'border-blue-600 bg-zinc-900',
      isComplete && 'border-zinc-700 bg-zinc-900',
      !isActive && !isComplete && 'border-zinc-800 bg-zinc-900/50 opacity-50'
    )}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium',
            isComplete ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'
          )}>
            {isComplete ? '\u2713' : stepNumber}
          </div>
          <span className="font-medium">{title}</span>
          {isActive && <span className="text-xs text-blue-400 animate-pulse">Processing...</span>}
        </div>
        <span className="text-zinc-500">{expanded ? '\u25BC' : '\u25B6'}</span>
      </button>
      {expanded && (isComplete || isActive) && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
}
