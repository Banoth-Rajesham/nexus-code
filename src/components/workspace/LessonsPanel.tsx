import React, { useEffect, useMemo, useState } from 'react';
import { X, GraduationCap, CheckCircle2, Circle, PlayCircle, Target, Lightbulb, Trophy, Lock, LogOut, ChevronRight } from 'lucide-react';
import { CONCEPTS, LESSONS, Lesson, LessonResult, masteredConcepts } from '../../utils/learningPath';
import { ExperienceLevel, LEVEL_META } from '../../utils/experienceLevel';
import { LEVEL_ACCENT } from './LevelSwitcher';

interface LessonsPanelProps {
  open: boolean;
  onClose: () => void;
  completed: string[];
  activeLessonId: string | null;
  passedLessonTitle?: string;
  suggestedLesson: Lesson | null;
  level: ExperienceLevel;
  isPython: boolean;
  onStartLesson: (lesson: Lesson) => void;
  onOpenQuiz: () => void;
}

/** Slide-over drawer with the learning path, progress and concepts. */
export const LessonsPanel: React.FC<LessonsPanelProps> = ({
  open,
  onClose,
  completed,
  activeLessonId,
  passedLessonTitle,
  suggestedLesson: upNext,
  level,
  isPython,
  onStartLesson,
  onOpenQuiz,
}) => {
  const done = useMemo(() => new Set(completed), [completed]);
  const mastered = useMemo(() => masteredConcepts(completed), [completed]);
  const pct = Math.round((completed.filter((id) => LESSONS.some((l) => l.id === id)).length / LESSONS.length) * 100);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label="Lessons">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full ws-bg-sunken border-l ws-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b ws-border ws-bg-surface">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider ws-tx-blue">
                <GraduationCap className="w-4 h-4" /> Learning path
              </div>
              <h2 className="text-lg font-bold ws-text-strong mt-1">Python lessons</h2>
              <p className="text-xs ws-text-muted mt-0.5">{passedLessonTitle ? `Lesson complete! You passed “${passedLessonTitle}”.` : 'Pick a lesson, write the code, press Run. It is checked automatically.'}</p>
            </div>
            <button onClick={onClose} aria-label="Close lessons" className="p-1.5 rounded ws-text-muted ws-hover-strong ws-hover-bg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="ws-text-2 font-semibold">
                {completed.filter((id) => LESSONS.some((l) => l.id === id)).length} of {LESSONS.length} lessons complete
              </span>
              <span className="font-mono ws-text-muted">{pct}%</span>
            </div>
            <div className="h-2 rounded-full ws-bg-elevated overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {upNext ? (
            <button
              onClick={() => onStartLesson(upNext)}
              disabled={!isPython}
              className="mt-4 w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
            >
              <PlayCircle className="w-5 h-5 ws-text-strong shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider ws-tx-blue-soft">{passedLessonTitle ? 'Start next lesson' : 'Up next'}</span>
                <span className="block text-sm font-bold ws-text-strong truncate">{upNext.title}</span>
              </span>
              <ChevronRight className="w-4 h-4 ws-text-strong" />
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Trophy className="w-5 h-5 ws-tx-amber shrink-0" />
              <span className="text-sm font-semibold ws-tx-emerald-soft">All lessons complete. Great work!</span>
            </div>
          )}
          {!isPython && (
            <p className="mt-2 text-[11px] ws-tx-amber">Lessons use Python. Switch the language to Python to start one.</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Concepts */}
          <div className="px-5 py-4 border-b ws-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider ws-text-muted">Concepts</span>
              <span className="text-[11px] ws-text-faint">{mastered.size} / {CONCEPTS.length} mastered</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CONCEPTS.map((c) => {
                const isDone = mastered.has(c.key);
                return (
                  <span
                    key={c.key}
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${
                      isDone ? 'bg-emerald-500/15 border-emerald-500/40 ws-tx-emerald-soft' : 'ws-bg-surface ws-border ws-text-muted'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3 opacity-50" />}
                    {c.title}
                  </span>
                );
              })}
            </div>
            <button
              onClick={onOpenQuiz}
              className="mt-3 text-xs font-semibold ws-tx-sky ws-hover-tx-sky flex items-center gap-1"
            >
              <Target className="w-3.5 h-3.5" /> Quiz me on the code in my editor
            </button>
          </div>

          {/* Lessons grouped by level */}
          {LEVEL_META.map((meta) => {
            const lessons = LESSONS.filter((l) => l.level === meta.key);
            const aboveLevel = LEVEL_META.findIndex((m) => m.key === meta.key) > LEVEL_META.findIndex((m) => m.key === level);
            return (
              <div key={meta.key} className="px-5 py-4 border-b ws-border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${LEVEL_ACCENT[meta.key]}`}>{meta.label}</span>
                  {aboveLevel && (
                    <span className="flex items-center gap-1 text-[10px] ws-text-faint">
                      <Lock className="w-3 h-3" /> Above your level — still available
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {lessons.map((lesson) => {
                    const isDone = done.has(lesson.id);
                    const isActive = lesson.id === activeLessonId;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onStartLesson(lesson)}
                        disabled={!isPython}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isActive
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'ws-border ws-bg-surface ws-hover-border ws-hover-bg'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 ws-tx-emerald shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 ws-text-faint shrink-0 mt-0.5" />
                        )}
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-bold ws-text-strong">{lesson.title}</span>
                            {isActive && !isDone && <span className="text-[9px] font-bold uppercase ws-tx-blue bg-blue-500/20 px-1.5 py-0.5 rounded">In progress</span>}
                          </span>
                          <span className="block text-[11px] ws-text-muted leading-snug mt-0.5">{lesson.goal}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

interface ActiveLessonBannerProps {
  lesson: Lesson;
  result: LessonResult | null;
  onExit: () => void;
  onNext: (() => void) | null;
  onOpenLessons: () => void;
}

/** Shows the current lesson's goal above the editor, and the result after each run. */
export const ActiveLessonBanner: React.FC<ActiveLessonBannerProps> = ({ lesson, result, onExit, onNext, onOpenLessons }) => {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => setShowHint(false), [lesson.id]);

  const passed = result?.passed;
  return (
    <div
      className={`shrink-0 border-b px-3 py-2 text-xs ${
        passed ? 'bg-emerald-950/50 border-emerald-500/40' : 'ws-bg-accent-soft border-blue-500/30'
      }`}
      data-tour="lesson-banner"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {passed ? <Trophy className="w-4 h-4 ws-tx-amber shrink-0" /> : <Target className="w-4 h-4 ws-tx-blue shrink-0" />}
        <button onClick={onOpenLessons} className="font-bold ws-text-strong hover:underline shrink-0">
          {passed ? 'Lesson complete!' : `Lesson: ${lesson.title}`}
        </button>
        <span className="ws-text-2 min-w-0 truncate">{lesson.goal}</span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {!passed && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded ws-tx-amber-soft hover:bg-amber-500/10 font-semibold"
            >
              <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'Hide hint' : 'Hint'}
            </button>
          )}
          {passed && onNext && (
            <button onClick={onNext} className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              Next lesson <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onExit} className="flex items-center gap-1 px-2 py-0.5 rounded ws-text-muted ws-hover-strong ws-hover-bg" title="Leave lesson mode">
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </div>
      {showHint && !passed && (
        <pre className="mt-1.5 ml-6 text-[11px] font-mono ws-tx-amber-soft bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 whitespace-pre-wrap">{lesson.hint}</pre>
      )}
      {result && !passed && result.problems.length > 0 && (
        <ul className="mt-1.5 ml-6 space-y-0.5">
          {result.problems.map((p, i) => (
            <li key={i} className="text-[11px] ws-tx-rose-soft flex items-start gap-1.5">
              <span className="ws-tx-rose mt-px">•</span> {p}
            </li>
          ))}
        </ul>
      )}
      {!result && !passed && <div className="mt-1 ml-6 text-[11px] ws-text-faint">Write your code, then press Run to check it.</div>}
    </div>
  );
};
