import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CornerDownLeft, X } from 'lucide-react';

interface InputPromptModalProps {
  promptText: string;
  line: number;
  onSubmit: (val: string) => void;
  onCancel: () => void;
}

export const InputPromptModal: React.FC<InputPromptModalProps> = ({
  promptText,
  line,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(value);
    setValue('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Program Input Required</h3>
              <p className="text-[11px] text-slate-400">Triggered by input() at Line {line}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            title="Cancel execution"
            aria-label="Cancel input"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-amber-300 mb-1.5">
              {promptText ? promptText : 'Please enter input:'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type your input and press Enter..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-hidden transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm focus:ring-2 focus:ring-amber-400"
            >
              <span>Submit & Continue</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
