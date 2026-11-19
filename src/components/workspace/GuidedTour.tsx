import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, X, Compass } from 'lucide-react';
import { ExperienceLevel, LEVEL_META } from '../../utils/experienceLevel';
import { LEVEL_ICONS, LEVEL_ACCENT } from './LevelSwitcher';

interface TourStep {
  target: string; // value of data-tour attribute
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  { target: 'editor', title: 'Write your code here', body: 'Type or paste a program. Lines are colour-coded by indentation so you can see which block each line belongs to.' },
  { target: 'run', title: 'Run it', body: 'Press Run (or Ctrl+Enter). Output appears in the console at the bottom. If something goes wrong, you get a plain-English explanation of the error.' },
  { target: 'step', title: 'Watch it step by step', body: 'Step through a Python program one line at a time. The current line, its explanation, the flowchart and the variables all move together.' },
  { target: 'blueprint', title: 'Read the explanation', body: 'Every line is explained in plain words. Click any explanation to jump to that line in the editor.' },
  { target: 'lessons', title: 'Learn with lessons', body: 'Short goal-based lessons check your program automatically when you run it, and track the concepts you have mastered.' },
  { target: 'level', title: 'Change your level any time', body: 'Switch between Beginner, Intermediate and Senior to show more or fewer tools. Nothing is ever removed.' },
];

interface GuidedTourProps {
  open: boolean;
  level: ExperienceLevel;
  onChooseLevel: (level: ExperienceLevel) => void;
  onClose: () => void;
}

/** First-visit welcome (pick a level) followed by a spotlight walkthrough of the workspace. */
export const GuidedTour: React.FC<GuidedTourProps> = ({ open, level, onChooseLevel, onClose }) => {
  const [stepIdx, setStepIdx] = useState(-1); // -1 = welcome card
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setStepIdx(-1);
  }, [open]);

  // Steps whose target is not on screen (hidden by level / layout) are skipped
  const visibleSteps = STEPS.filter((s) => {
    if (!open) return false;
    const el = document.querySelector(`[data-tour="${s.target}"]`) as HTMLElement | null;
    return !!el && el.getClientRects().length > 0;
  });
  const step = stepIdx >= 0 ? visibleSteps[stepIdx] : null;

  useLayoutEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step?.target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && stepIdx >= 0) setStepIdx((i) => Math.min(i + 1, visibleSteps.length - 1));
      if (e.key === 'ArrowLeft' && stepIdx > 0) setStepIdx((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stepIdx, visibleSteps.length]);

  useEffect(() => {
    if (open && stepIdx >= 0 && !step) onClose();
  }, [open, stepIdx, step]);

  if (!open) return null;

  // ── Welcome card ──
  if (stepIdx === -1) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <div className="w-full max-w-lg ws-bg-surface border ws-border rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 ws-tx-blue text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4" /> Welcome to your workspace
            </div>
            <h2 id="tour-title" className="text-xl font-bold ws-text-strong">How much coding have you done?</h2>
            <p className="text-sm ws-text-muted mt-1">We will set up the workspace to match. You can change this any time from the toolbar.</p>
          </div>
          <div className="px-6 space-y-2">
            {LEVEL_META.map((meta) => {
              const Icon = LEVEL_ICONS[meta.key];
              const active = meta.key === level;
              return (
                <button
                  key={meta.key}
                  onClick={() => onChooseLevel(meta.key)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    active ? 'border-blue-500 bg-blue-500/10' : 'ws-border ws-hover-border ws-bg-sunken'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-lg ws-bg-elevated flex items-center justify-center shrink-0 ${LEVEL_ACCENT[meta.key]}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold ws-text-strong">{meta.label}</span>
                      <span className="text-[11px] ws-text-faint">{meta.tagline}</span>
                    </span>
                    <span className="block text-xs ws-text-muted mt-0.5 leading-snug">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-6 py-4 mt-4 border-t ws-border ws-bg-sunken">
            <button onClick={onClose} className="text-xs font-semibold ws-text-muted ws-hover-strong">
              Skip tour
            </button>
            <button
              onClick={() => (visibleSteps.length ? setStepIdx(0) : onClose())}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Show me around <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null; // target disappeared; the effect below closes the tour

  // ── Spotlight step ──
  const pad = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(320, vw - 32);
  let cardTop = rect ? rect.bottom + 12 : vh / 2 - 80;
  if (rect && cardTop + 190 > vh) cardTop = Math.max(16, rect.top - 190);
  let cardLeft = rect ? rect.left + rect.width / 2 - cardW / 2 : vw / 2 - cardW / 2;
  cardLeft = Math.max(16, Math.min(cardLeft, vw - cardW - 16));
  const isLast = stepIdx === visibleSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* click-catcher */}
      <div className="absolute inset-0" onClick={onClose} />
      {rect && (
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-200 ring-2 ring-blue-500"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(1, 4, 9, 0.72)',
          }}
        />
      )}
      <div
        className="absolute ws-bg-surface border ws-border rounded-lg shadow-2xl p-4"
        style={{ top: cardTop, left: cardLeft, width: cardW }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider ws-tx-blue">
            Step {stepIdx + 1} of {visibleSteps.length}
          </div>
          <button onClick={onClose} aria-label="Close tour" className="ws-text-faint ws-hover-strong -mt-1 -mr-1 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="text-sm font-bold ws-text-strong mt-1">{step.title}</h3>
        <p className="text-xs ws-text-2 leading-relaxed mt-1">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {visibleSteps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === stepIdx ? 'w-4 bg-blue-500' : 'w-1.5 ws-bg-elevated2'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button onClick={() => setStepIdx((i) => i - 1)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold ws-text-2 ws-hover-strong">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStepIdx((i) => i + 1))}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
            >
              {isLast ? 'Start coding' : 'Next'} {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
