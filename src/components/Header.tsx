import React, { useEffect, useRef, useState } from 'react';
import { Check, AlertTriangle, BookOpen, ChevronDown, Layers, Play, Settings2 } from 'lucide-react';
import { ConversionResult, SampleTemplate } from '../types';
import { SAMPLE_TEMPLATES } from '../utils/samples';

export type Stage = 'build' | 'audit' | 'ship';

interface HeaderProps {
  stage: Stage;
  setStage: (stage: Stage) => void;
  themeName: string;
  result: ConversionResult | null;
  onOpenConfig: () => void;
  onOpenPlayground: () => void;
  onSelectSample: (sample: SampleTemplate) => void;
  onOpenGuide: () => void;
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'audit', label: 'Audit' },
  { id: 'ship', label: 'Ship' },
];

export const Header: React.FC<HeaderProps> = ({
  stage,
  setStage,
  themeName,
  result,
  onOpenConfig,
  onOpenPlayground,
  onSelectSample,
  onOpenGuide,
}) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Close the presets menu on outside click / Escape
  useEffect(() => {
    if (!presetsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!presetsRef.current?.contains(e.target as Node)) setPresetsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPresetsOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [presetsOpen]);

  const errors = result?.validations.filter((v) => v.status === 'error').length ?? 0;
  const phpCheck = result?.validations.find((v) => v.id === 'security-php-syntax');
  const phpValid = phpCheck?.status === 'pass';

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-2.5 pl-4 pr-3 rounded-[20px] bg-island shadow-float">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-[34px] h-[34px] rounded-[11px] bg-ink flex items-center justify-center shrink-0" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l3 12 5-9 5 9 3-12" />
          </svg>
        </div>
        <span className="font-display font-bold text-[17px]">Theme Studio</span>
        <span className="text-line-strong" aria-hidden="true">/</span>
        <span className="font-medium truncate max-w-[220px]">{themeName || 'Untitled theme'}</span>
      </div>

      {/* Stages */}
      <nav aria-label="Stages" className="flex gap-1 p-1 rounded-[14px] bg-inset">
        {STAGES.map((s) => (
          <button
            key={s.id}
            id={`tab-${s.id}`}
            type="button"
            onClick={() => setStage(s.id)}
            aria-current={stage === s.id ? 'page' : undefined}
            className={`px-4 py-2 rounded-[10px] text-[13px] transition-all ${
              stage === s.id ? 'bg-island text-ink font-semibold shadow-[0_1px_2px_rgba(17,19,24,0.08)]' : 'text-muted font-medium hover:text-ink'
            }`}
          >
            {s.label}
            {s.id === 'audit' && errors > 0 && (
              <span className="ml-1.5 px-1.5 rounded-full bg-err-soft text-err text-[11px] font-bold">{errors}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {result && phpCheck && (
          <button
            type="button"
            onClick={() => setStage('audit')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              phpValid ? 'bg-ok-soft text-ok' : 'bg-err-soft text-err'
            }`}
          >
            {phpValid ? <Check className="w-3 h-3" strokeWidth={3} /> : <AlertTriangle className="w-3 h-3" />}
            {phpValid ? 'PHP valid' : 'PHP errors'}
          </button>
        )}

        <div className="relative" ref={presetsRef}>
          <button
            type="button"
            onClick={() => setPresetsOpen((o) => !o)}
            aria-expanded={presetsOpen}
            aria-haspopup="menu"
            className="h-[38px] px-3 rounded-xl border border-line-strong bg-island text-[13px] font-semibold flex items-center gap-1.5 hover:bg-inset transition-colors"
          >
            <Layers className="w-4 h-4 text-muted" />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown className={`w-3.5 h-3.5 text-faint transition-transform ${presetsOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetsOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-island shadow-float border border-line z-50">
              {SAMPLE_TEMPLATES.map((sample) => (
                <button
                  key={sample.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onSelectSample(sample);
                    setPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-inset transition-colors"
                >
                  <span className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                    {sample.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-inset text-muted font-mono uppercase">{sample.options.themeType}</span>
                  </span>
                  <span className="block text-xs text-muted mt-0.5 truncate">{sample.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          aria-label="Theme settings"
          title="Theme settings"
          className="w-[38px] h-[38px] rounded-xl border border-line-strong bg-island flex items-center justify-center hover:bg-inset transition-colors"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onOpenGuide}
          aria-label="Guide"
          title="Theme architecture guide"
          className="w-[38px] h-[38px] rounded-xl border border-line-strong bg-island flex items-center justify-center hover:bg-inset transition-colors"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenPlayground}
          disabled={!result}
          className="h-[38px] px-3.5 rounded-xl border border-line-strong bg-island text-[13px] font-semibold flex items-center gap-1.5 hover:bg-inset transition-colors disabled:opacity-40"
          title="Install and run this theme in WordPress Playground (in your browser)"
        >
          <Play className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span className="hidden sm:inline">Test in WordPress</span>
        </button>
        <button
          id="btn-export-zip"
          type="button"
          onClick={() => setStage('ship')}
          className="h-[38px] px-4 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent-ink transition-colors"
        >
          Ship theme
        </button>
      </div>
    </header>
  );
};
