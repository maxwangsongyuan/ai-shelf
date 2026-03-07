'use client';

import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Query Generation' },
  { num: 2, label: 'AI Responses' },
  { num: 3, label: 'Web Reality Check' },
  { num: 4, label: 'Scoring' },
  { num: 5, label: 'Gap Analysis' },
  { num: 6, label: 'Action Plan' },
];

interface ProgressStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-4">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
              completedSteps.has(step.num) ? 'bg-green-600 text-white'
                : currentStep === step.num ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-zinc-800 text-zinc-500'
            )}>
              {completedSteps.has(step.num) ? '\u2713' : step.num}
            </div>
            <span className="text-xs text-zinc-500 mt-1 text-center w-20">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px w-8 mx-1 mt-[-16px]', completedSteps.has(step.num) ? 'bg-green-600' : 'bg-zinc-800')} />
          )}
        </div>
      ))}
    </div>
  );
}
