import React from 'react';
import { Sparkles, GraduationCap, Keyboard } from 'lucide-react';
import type { PresetSample } from '../../utils/workspacePresets';

interface EmptyEditorStateProps {
  presets: PresetSample[];
  onLoadPreset: (id: string) => void;
  onStartLessons: (() => void) | null;
  onFocusEditor: () => void;
}

/** Shown on top of an empty editor so a new student never faces a blank screen. */
export const EmptyEditorState: React.FC<EmptyEditorStateProps> = ({ presets, onLoadPreset, onStartLessons, onFocusEditor }) => {
  // Skip graphics demos (pygame) — they can't run in the browser sandbox
  const examples = presets.filter((p) => !/pygame/i.test(p.name)).slice(0, 4);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md text-center ws-bg-surface border ws-border rounded-xl shadow-2xl p-6 backdrop-blur-xs">
        <div className="w-10 h-10 mx-auto rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 ws-tx-blue" />
        </div>
        <h3 className="mt-3 text-base font-bold ws-text-strong">Start with an example</h3>
        <p className="mt-1 text-xs ws-text-muted">Load a ready-made program to explore, or start typing your own.</p>

        {examples.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {examples.map((p) => (
              <button
                key={p.id}
                onClick={() => onLoadPreset(p.id)}
                className="p-2.5 rounded-lg border ws-border ws-bg-sunken hover:border-blue-500/60 ws-hover-accent transition-colors"
              >
                <span className="block text-xs font-bold ws-text-strong truncate">{p.name}</span>
                <span className="block text-[11px] ws-text-muted leading-snug mt-0.5 line-clamp-2">{p.description}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {onStartLessons && (
            <button
              onClick={onStartLessons}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Start a guided lesson
            </button>
          )}
          <button
            onClick={onFocusEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md ws-bg-elevated ws-hover-bg border ws-border text-xs font-semibold ws-text-body"
          >
            <Keyboard className="w-3.5 h-3.5" /> Write my own code
          </button>
        </div>
      </div>
    </div>
  );
};
