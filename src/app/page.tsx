'use client';

import { useState, useCallback } from 'react';
import type { AnalyzeRequest, GeneratedQuery, AIResponse, WebResult, Scores, GapItem, ActionItem, SSEEvent } from '@/lib/types';
import { BrandInput } from '@/components/brand-input';
import { ProgressStepper } from '@/components/progress-stepper';
import { StepPanel } from '@/components/step-panel';
import { EvidenceCard } from '@/components/evidence-card';
import { ScoreDisplay } from '@/components/score-display';
import { CompetitorBar } from '@/components/competitor-bar';
import { GapTable } from '@/components/gap-table';
import { SourceLink } from '@/components/source-link';
import { RadarChartDisplay } from '@/components/radar-chart-display';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<GeneratedQuery[] | null>(null);
  const [step2Data, setStep2Data] = useState<AIResponse[] | null>(null);
  const [step3Data, setStep3Data] = useState<WebResult[] | null>(null);
  const [step4Data, setStep4Data] = useState<Scores | null>(null);
  const [step5Data, setStep5Data] = useState<GapItem[] | null>(null);
  const [step6Data, setStep6Data] = useState<ActionItem[] | null>(null);
  const [brandName, setBrandName] = useState('');

  const handleAnalyze = useCallback(async (input: AnalyzeRequest) => {
    setIsAnalyzing(true);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setError(null);
    setStep1Data(null);
    setStep2Data(null);
    setStep3Data(null);
    setStep4Data(null);
    setStep5Data(null);
    setStep6Data(null);
    setBrandName(input.brandName);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const event = JSON.parse(part.slice(6)) as SSEEvent;

          if (event.step === 'error') { setError(event.message); continue; }
          if (event.status === 'running') setCurrentStep(event.step);
          if (event.status === 'done') {
            setCompletedSteps(prev => new Set([...prev, event.step]));
            switch (event.step) {
              case 1: setStep1Data(event.data || null); break;
              case 2: setStep2Data(event.data || null); break;
              case 3: setStep3Data(event.data || null); break;
              case 4: setStep4Data(event.data || null); break;
              case 5: setStep5Data(event.data || null); break;
              case 6: setStep6Data(event.data || null); break;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">The AI Shelf</h1>
        <p className="text-zinc-400 text-lg">Measure your brand&apos;s visibility on the invisible AI shelf</p>
      </div>

      <BrandInput onSubmit={handleAnalyze} isLoading={isAnalyzing} />

      {currentStep > 0 && (
        <div className="mt-8">
          <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">Error: {error}</div>
      )}

      <div className="mt-8 space-y-4">
        {/* Step 1: Queries */}
        {(step1Data || currentStep >= 1) && (
          <StepPanel stepNumber={1} title="Query Generation" isComplete={completedSteps.has(1)} isActive={currentStep === 1 && !completedSteps.has(1)}>
            {step1Data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">{'\uD83D\uDD0D'} Discovery Queries</h4>
                  <div className="space-y-2">
                    {step1Data.filter(q => q.type === 'discovery').map((q, i) => (
                      <div key={i} className="bg-zinc-800 rounded p-3">
                        <p className="text-sm font-medium">&quot;{q.query}&quot;</p>
                        <p className="text-xs text-zinc-400 mt-1">{q.intentEn}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-400 mb-2">{'\u2713'} Verification Queries</h4>
                  <div className="space-y-2">
                    {step1Data.filter(q => q.type === 'verification').map((q, i) => (
                      <div key={i} className="bg-zinc-800 rounded p-3">
                        <p className="text-sm font-medium">&quot;{q.query}&quot;</p>
                        <p className="text-xs text-zinc-400 mt-1">{q.intentEn}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </StepPanel>
        )}

        {/* Step 2: AI Responses */}
        {(step2Data || currentStep >= 2) && (
          <StepPanel stepNumber={2} title="AI Responses" isComplete={completedSteps.has(2)} isActive={currentStep === 2 && !completedSteps.has(2)}>
            {step2Data && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  {brandName} mentioned in {step2Data.filter(r => r.brandMentioned).length} of {step2Data.length} queries
                </p>
                {step2Data.map((r, i) => (
                  <EvidenceCard key={i} response={r} brandName={brandName} />
                ))}
              </div>
            )}
          </StepPanel>
        )}

        {/* Step 3: Web Reality */}
        {(step3Data || currentStep >= 3) && (
          <StepPanel stepNumber={3} title="Web Reality Check" isComplete={completedSteps.has(3)} isActive={currentStep === 3 && !completedSteps.has(3)}>
            {step3Data && (
              <div className="space-y-4">
                <CompetitorBar
                  mentions={step3Data.reduce((acc, w) => {
                    Object.entries(w.competitorWebMentions).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
                    return acc;
                  }, {} as Record<string, number>)}
                  brandName={brandName}
                  brandMentions={step3Data.reduce((sum, w) => sum + w.brandWebMentions, 0)}
                />
                {step3Data.map((w, i) => (
                  <div key={i} className="border-t border-zinc-800 pt-2">
                    <p className="text-sm font-medium mb-1">&quot;{w.query}&quot;</p>
                    <div className="space-y-1">
                      {w.sources.map((s, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-xs">{s.brandMentioned ? '\u2705' : '\u2B1C'}</span>
                          <SourceLink title={s.title} url={s.url} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StepPanel>
        )}

        {/* Step 4: Scores */}
        {(step4Data || currentStep >= 4) && (
          <StepPanel stepNumber={4} title="Brand Score" isComplete={completedSteps.has(4)} isActive={currentStep === 4 && !completedSteps.has(4)}>
            {step4Data && (
              <>
                <ScoreDisplay scores={step4Data} />
                {step4Data.radarScores && step4Data.radarScores.recognition > 0 && (
                  <RadarChartDisplay radarScores={step4Data.radarScores} />
                )}
              </>
            )}
          </StepPanel>
        )}

        {/* Step 5: Gap Analysis */}
        {(step5Data || currentStep >= 5) && (
          <StepPanel stepNumber={5} title="Gap Analysis" isComplete={completedSteps.has(5)} isActive={currentStep === 5 && !completedSteps.has(5)}>
            {step5Data && (
              <GapTable gaps={step5Data} brandName={brandName} competitorName={step2Data?.[0]?.competitorsFound[0] || 'Competitor'} />
            )}
          </StepPanel>
        )}

        {/* Step 6: Action Plan */}
        {(step6Data || currentStep >= 6) && (
          <StepPanel stepNumber={6} title="Action Plan" isComplete={completedSteps.has(6)} isActive={currentStep === 6 && !completedSteps.has(6)}>
            {step6Data && (
              <div className="space-y-4">
                {([1, 2, 3] as const).map(priority => {
                  const items = step6Data.filter(a => a.priority === priority);
                  if (items.length === 0) return null;
                  const labels = { 1: 'This Week', 2: 'This Month', 3: 'Ongoing' };
                  const colors = { 1: 'border-red-600', 2: 'border-yellow-600', 3: 'border-green-600' };
                  const textColors = { 1: 'text-red-400', 2: 'text-yellow-400', 3: 'text-green-400' };
                  return (
                    <div key={priority}>
                      <h4 className={`text-sm font-medium mb-2 ${textColors[priority]}`}>
                        Priority {priority}: {labels[priority]}
                      </h4>
                      <div className="space-y-2">
                        {items.map((action, i) => (
                          <div key={i} className={`border-l-2 ${colors[priority]} pl-4 py-2`}>
                            <p className="font-medium text-sm">{action.title}</p>
                            <p className="text-xs text-zinc-400 mt-1">{action.description}</p>
                            <p className="text-xs text-zinc-500 mt-1">Expected: {action.expectedImpact}</p>
                            {action.generatedContent && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-400 cursor-pointer">View generated content</summary>
                                <pre className="text-xs text-zinc-300 bg-zinc-800 rounded p-2 mt-1 whitespace-pre-wrap overflow-auto max-h-48">
                                  {action.generatedContent}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </StepPanel>
        )}
      </div>
    </main>
  );
}
