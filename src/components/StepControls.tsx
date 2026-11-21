import React, { useState, useEffect, useRef } from 'react';
import { Footprints, SkipBack, SkipForward, Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';

interface StepControlsProps {
  isStepMode: boolean;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playSpeedMs: number;
  disabled?: boolean;
  isTraceOutdated?: boolean;
  onStartStep: () => void;
  onStepNext: () => void;
  onStepBack: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onChangeSpeed: (speedMs: number) => void;
}

export const StepControls: React.FC<StepControlsProps> = ({
  isStepMode,
  stepIndex,
  totalSteps,
  isPlaying,
  playSpeedMs,
  disabled = false,
  isTraceOutdated = false,
  onStartStep,
  onStepNext,
  onStepBack,
  onTogglePlay,
  onReset,
  onChangeSpeed,
}) => {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);

  // Close speed menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedMenuOpen(false);
      }
    };
    if (speedMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [speedMenuOpen]);

  // F10 Global / Workspace Shortcut for Next Step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (!isStepMode) {
          onStartStep();
        } else {
          onStepNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStepMode, onStartStep, onStepNext]);

  if (!isStepMode) {
    return (
      <button
        onClick={onStartStep}
        disabled={disabled}
        title="Step-by-step Execution with Variables & Call Stack (F10)"
        aria-label="Step-by-step execution"
        className="nx-btn-step shrink-0"
      >
        <Footprints className="w-3.5 h-3.5 text-white" />
        <span className="whitespace-nowrap">Step</span>
      </button>
    );
  }

  const speedOptions = [
    { label: 'Fast (0.3s)', value: 300 },
    { label: 'Normal (0.8s)', value: 800 },
    { label: 'Slow (1.5s)', value: 1500 },
    { label: 'Very Slow (2.5s)', value: 2500 },
  ];

  const currentSpeedLabel = speedOptions.find((s) => s.value === playSpeedMs)?.label || `${playSpeedMs / 1000}s`;

  return (
    <div className="nx-seg shrink-0 animate-fadeIn text-xs">
      {/* 1. Reset Button */}
      <button
        onClick={onReset}
        title="Exit / Reset Step Mode"
        aria-label="Exit / Reset Step Mode"
        className="nx-icon-btn nx-sm"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* 2. Step Back Button */}
      <button
        onClick={onStepBack}
        disabled={stepIndex <= 0}
        title="Step Back to Previous Line"
        aria-label="Step Back"
        className="nx-icon-btn nx-sm disabled:opacity-30"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button>

      {/* 3. Next Step Button (F10) */}
      <button
        onClick={onStepNext}
        disabled={stepIndex >= totalSteps - 1}
        title="Next Step (F10)"
        aria-label="Next Step"
        className="nx-btn-step nx-sm"
      >
        <SkipForward className="w-3.5 h-3.5 fill-white" />
        <span className="hidden sm:inline">Next</span>
        <kbd className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-black/20 text-white/90 font-mono font-bold">F10</kbd>
      </button>

      {/* 4. Auto-Play / Pause Button */}
      <button
        onClick={onTogglePlay}
        title={isPlaying ? 'Pause Auto-play' : 'Auto-play through Steps'}
        aria-label={isPlaying ? 'Pause Auto-play' : 'Auto-play'}
        className={`nx-icon-btn nx-sm ${isPlaying ? 'is-on' : ''}`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
      </button>

      {/* 5. Speed Selector Dropdown */}
      <div className="relative" ref={speedRef}>
        <button
          onClick={() => setSpeedMenuOpen((o) => !o)}
          title={`Auto-play Speed: ${currentSpeedLabel}`}
          aria-label="Change auto-play speed"
          className="nx-seg-btn !h-6 !px-1.5 text-[11px]"
        >
          <Clock className="w-3 h-3 ws-text-muted" />
          <span className="hidden lg:inline">{playSpeedMs / 1000}s</span>
        </button>

        {speedMenuOpen && (
          <div className="absolute top-full mt-1 left-0 z-50 ws-bg-surface border ws-border rounded-md shadow-xl py-1 w-32 animate-fadeIn text-[11px]">
            {speedOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChangeSpeed(opt.value);
                  setSpeedMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1 transition-colors flex items-center justify-between ${
                  playSpeedMs === opt.value
                    ? 'bg-amber-600/20 ws-tx-amber font-bold'
                    : 'ws-text-2 ws-hover-bg'
                }`}
              >
                <span>{opt.label}</span>
                {playSpeedMs === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Step Count Badge */}
      <span
        title="Rows = statements explained. Steps = lines actually executed."
        className="nx-chip nx-chip-muted cursor-help mx-0.5"
      >
        {isTraceOutdated
          ? 'Code changed'
          : totalSteps > 0
          ? `${stepIndex + 1}/${totalSteps} steps`
          : '0 steps'}
      </span>
    </div>
  );
};
