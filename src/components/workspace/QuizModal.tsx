import React, { useEffect, useState } from 'react';
import { X, Target, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import type { QuizQuestion } from '../../utils/learningPath';

interface QuizModalProps {
  open: boolean;
  questions: QuizQuestion[];
  onClose: () => void;
  onJumpToLine: (line: number) => void;
}

/** "What does this line do?" multiple-choice quiz built from the explanation engine. */
export const QuizModal: React.FC<QuizModalProps> = ({ open, questions, onClose, onJumpToLine }) => {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (open) {
      setIdx(0);
      setPicked(null);
      setScore(0);
    }
  }, [open, questions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const finished = idx >= questions.length;
  const q = questions[idx];

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
      <div className="w-full max-w-lg ws-bg-surface border ws-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b ws-border">
          <div id="quiz-title" className="flex items-center gap-2 text-sm font-bold ws-text-strong">
            <Target className="w-4 h-4 ws-tx-sky" /> Quiz me
          </div>
          <div className="flex items-center gap-3">
            {questions.length > 0 && !finished && (
              <span className="text-xs ws-text-muted font-mono">
                {idx + 1} / {questions.length}
              </span>
            )}
            <button onClick={onClose} aria-label="Close quiz" className="p-1 rounded ws-text-muted ws-hover-strong ws-hover-bg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm ws-text-2">Write a few more lines of Python to get a quiz.</p>
            <p className="text-xs ws-text-faint mt-1">The quiz asks what lines of your own program do, so it needs at least three different statements.</p>
          </div>
        ) : finished ? (
          <div className="px-5 py-8 text-center">
            <div className="text-4xl font-bold ws-text-strong">
              {score} / {questions.length}
            </div>
            <p className="text-sm ws-text-2 mt-2">
              {score === questions.length ? 'Perfect! You understand this program.' : score > 0 ? 'Good effort. Read the explanations for the ones you missed.' : 'Read the line explanations on the right, then try again.'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => {
                  setIdx(0);
                  setPicked(null);
                  setScore(0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded ws-bg-elevated ws-hover-bg border ws-border text-xs font-semibold ws-text-body"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try again
              </button>
              <button onClick={onClose} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="text-xs font-semibold ws-text-muted uppercase tracking-wider">What does this line do?</p>
            <button
              onClick={() => onJumpToLine(q.line)}
              className="mt-2 w-full text-left font-mono text-sm ws-bg-sunken border ws-border rounded-md px-3 py-2 ws-tx-emerald ws-hover-border"
              title="Show this line in the editor"
            >
              <span className="ws-text-faint mr-3 select-none">{q.line}</span>
              {q.code}
            </button>
            <div className="mt-4 space-y-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIndex;
                const isPicked = picked === i;
                const reveal = picked !== null;
                return (
                  <button
                    key={i}
                    disabled={reveal}
                    onClick={() => {
                      setPicked(i);
                      if (isCorrect) setScore((s) => s + 1);
                    }}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      reveal && isCorrect
                        ? 'border-emerald-500 bg-emerald-500/10 ws-tx-emerald-soft'
                        : reveal && isPicked
                          ? 'border-rose-500 bg-rose-500/10 ws-tx-rose-soft'
                          : 'ws-border ws-bg-sunken ws-text-body ws-hover-border '
                    }`}
                  >
                    <span className="w-5 h-5 shrink-0 rounded-full border border-current flex items-center justify-center text-[10px] font-bold opacity-80 mt-px">
                      {reveal && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : reveal && isPicked ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-semibold ${picked === q.correctIndex ? 'ws-tx-emerald' : 'ws-tx-rose'}`}>
                  {picked === q.correctIndex ? 'Correct!' : 'Not quite — the green answer is right.'}
                </span>
                <button
                  onClick={() => {
                    setIdx((v) => v + 1);
                    setPicked(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  {idx + 1 === questions.length ? 'See score' : 'Next question'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
