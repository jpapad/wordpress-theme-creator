import React from 'react';
import { 
  Terminal, 
  Layers, 
  CheckCircle, 
  Keyboard, 
  FileCode, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { WordPressThemeMeta, ConversionResult } from '../types';

interface StatusBarProps {
  meta: WordPressThemeMeta;
  result: ConversionResult | null;
  isConverting: boolean;
  totalSourceFiles: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  meta,
  result,
  isConverting,
  totalSourceFiles,
}) => {
  return (
    <footer className="bg-[#07080c] border-t border-white/[0.06] px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400 select-none z-30">
      {/* Left: Theme Slug & Version info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-zinc-200">{meta.name || 'Untitled Theme'}</span>
          <span className="text-zinc-500 font-mono">({meta.textDomain || 'textdomain'})</span>
        </div>

        <span className="text-zinc-700 hidden sm:inline">&bull;</span>

        <div className="hidden sm:flex items-center gap-1 text-zinc-400">
          <span>Target:</span>
          <span className="text-amber-300 font-medium font-mono">WordPress 6.x</span>
        </div>

        <span className="text-zinc-700 hidden md:inline">&bull;</span>

        <div className="hidden md:flex items-center gap-1 text-zinc-400">
          <Layers className="w-3 h-3 text-amber-400" />
          <span>Source Files: <strong className="text-zinc-200 font-mono">{totalSourceFiles}</strong></span>
        </div>
      </div>

      {/* Center/Right: Shortcuts & Engine Status */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-zinc-500">
          <span className="flex items-center gap-1 font-mono text-[10px] bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10 text-zinc-300">
            <Keyboard className="w-3 h-3 text-amber-400" />
            <span>Ctrl + S</span>
          </span>
          <span>Convert / Sync</span>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{result.files.length} Theme Files Generated</span>
            </span>
          </div>
        )}

        {isConverting && (
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>Converting AST...</span>
          </div>
        )}
      </div>
    </footer>
  );
};
