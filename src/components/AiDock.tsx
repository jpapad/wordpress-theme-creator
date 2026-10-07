import React, { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

interface AiDockProps {
  isBusy: boolean;
  onSubmit: (instruction: string) => void;
}

const SUGGESTIONS = [
  'Turn repeated cards into a custom post type',
  'Make the hero editable with ACF fields',
  'Add a blog archive with pagination',
];

/**
 * Floating command bar: sends the sources plus a natural-language request to Gemini.
 */
export const AiDock: React.FC<AiDockProps> = ({ isBusy, onSubmit }) => {
  const [value, setValue] = useState('');

  const submit = (text: string) => {
    if (isBusy) return;
    onSubmit(text.trim());
    setValue('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="self-center w-full max-w-[820px] flex flex-col gap-2.5 p-2.5 rounded-[22px] bg-ink text-white shadow-dock"
    >
      <div className="hidden sm:flex flex-wrap gap-1.5 px-1 pt-0.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={isBusy}
            onClick={() => submit(s)}
            className="h-[30px] px-3 rounded-full border border-[#343A47] text-xs text-[#D7DAE1] hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <label htmlFor="ai-ask" className="sr-only">
          Ask Theme Studio
        </label>
        <input
          id="ai-ask"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isBusy}
          placeholder={isBusy ? 'Gemini is refining your theme…' : 'Ask Theme Studio to change the theme… (empty = full AI refine)'}
          className="flex-1 min-w-0 h-[46px] px-3.5 rounded-[14px] bg-[#1D212B] text-white placeholder:text-[#A9AFBC] text-[15px] outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={isBusy}
          aria-label="Send to AI"
          className="w-[46px] h-[46px] rounded-[14px] bg-accent text-white flex items-center justify-center shrink-0 hover:bg-accent-ink transition-colors disabled:opacity-60"
        >
          {isBusy ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.4} />}
        </button>
      </div>
    </form>
  );
};
