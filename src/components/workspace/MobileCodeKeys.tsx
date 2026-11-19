import React from 'react';

interface MobileCodeKeysProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  tabSize: number;
  onInsert: (newValue: string, cursor: number) => void;
}

const KEYS: { label: string; insert: string; caretBack?: number; aria?: string }[] = [
  { label: 'Tab', insert: '\t', aria: 'Insert indentation' },
  { label: ':', insert: ':' },
  { label: '( )', insert: '()', caretBack: 1, aria: 'Insert parentheses' },
  { label: '[ ]', insert: '[]', caretBack: 1, aria: 'Insert square brackets' },
  { label: '{ }', insert: '{}', caretBack: 1, aria: 'Insert curly braces' },
  { label: '" "', insert: '""', caretBack: 1, aria: 'Insert quotes' },
  { label: "' '", insert: "''", caretBack: 1, aria: 'Insert single quotes' },
  { label: '=', insert: '=' },
  { label: '==', insert: ' == ' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '*', insert: '*' },
  { label: '/', insert: '/' },
  { label: '%', insert: '%' },
  { label: '<', insert: '<' },
  { label: '>', insert: '>' },
  { label: '#', insert: '# ' },
  { label: '_', insert: '_' },
  { label: ',', insert: ', ' },
];

/** Row of coding symbols that are hard to reach on phone keyboards. */
export const MobileCodeKeys: React.FC<MobileCodeKeysProps> = ({ textareaRef, tabSize, onInsert }) => {
  const insert = (text: string, caretBack = 0) => {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const chunk = text === '\t' ? ' '.repeat(tabSize) : text;
    const next = value.slice(0, start) + chunk + value.slice(end);
    onInsert(next, start + chunk.length - caretBack);
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div
      className="md:hidden shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-1.5 ws-bg-surface border-t ws-border"
      role="toolbar"
      aria-label="Code symbols"
    >
      {KEYS.map((k) => (
        <button
          key={k.label}
          type="button"
          aria-label={k.aria || `Insert ${k.label}`}
          // keep the textarea focused so the phone keyboard stays open
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(k.insert, k.caretBack)}
          className="min-w-[40px] h-9 px-2.5 shrink-0 rounded-md ws-bg-elevated active:bg-blue-600 border ws-border text-sm font-mono font-semibold ws-text-body"
        >
          {k.label}
        </button>
      ))}
    </div>
  );
};
