import React from 'react';
import { 
  Columns, 
  Square, 
  Maximize2, 
  Minimize2, 
  Type, 
  Eye, 
  Code2, 
  Check, 
  FileCode2, 
  Zap, 
  HelpCircle,
  Keyboard,
  Sparkles
} from 'lucide-react';

export type WorkspaceLayout = 'split' | 'tabs' | 'source-only' | 'wp-only';
export type EditorFontSize = 'sm' | 'md' | 'lg';

interface WorkspaceControlsProps {
  layout: WorkspaceLayout;
  setLayout: (layout: WorkspaceLayout) => void;
  fontSize: EditorFontSize;
  setFontSize: (size: EditorFontSize) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  totalFiles: number;
  themeSlug: string;
  onQuickConvert: () => void;
  isConverting: boolean;
}

export const WorkspaceControls: React.FC<WorkspaceControlsProps> = ({
  layout,
  setLayout,
  fontSize,
  setFontSize,
  isFullscreen,
  setIsFullscreen,
  totalFiles,
  themeSlug,
  onQuickConvert,
  isConverting,
}) => {
  return (
    <div className="bg-[#0b0d14] border-b border-white/[0.06] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: View Mode Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider hidden sm:inline">
          View Mode:
        </span>
        <div className="flex items-center bg-[#07080c] p-0.5 rounded-xl border border-white/[0.08] shadow-inner">
          <button
            onClick={() => setLayout('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              layout === 'split'
                ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Split Screen: Source Markup on Left, WordPress Output on Right"
          >
            <Columns className="w-3.5 h-3.5 text-amber-400" />
            <span>Split View</span>
          </button>

          <button
            onClick={() => setLayout('tabs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              layout === 'tabs'
                ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Standard Tabbed View"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabs</span>
          </button>

          <button
            onClick={() => setLayout('source-only')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              layout === 'source-only'
                ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Focus on HTML/CSS Input Only"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Source</span>
          </button>

          <button
            onClick={() => setLayout('wp-only')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              layout === 'wp-only'
                ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Focus on Generated WordPress Files Only"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">WP Output</span>
          </button>
        </div>
      </div>

      {/* Right: Typography Size, Fullscreen & Status */}
      <div className="flex items-center gap-3">
        {/* Editor Font Sizer */}
        <div className="flex items-center gap-1.5 bg-[#07080c] px-2 py-1 rounded-xl border border-white/[0.08]">
          <Type className="w-3.5 h-3.5 text-zinc-400" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                fontSize === 'sm' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Small Font (12px)"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                fontSize === 'md' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Default Font (13.5px)"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                fontSize === 'lg' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Large Font (15.5px)"
            >
              A+
            </button>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all ${
            isFullscreen
              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-[#07080c] text-zinc-300 hover:text-white border-white/[0.08]'
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Editor to Fullscreen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>

        {/* Quick Sync Button */}
        <button
          onClick={onQuickConvert}
          disabled={isConverting}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          title="Re-convert files (Ctrl+S / Ctrl+Enter)"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{isConverting ? 'Syncing...' : 'Sync WP'}</span>
        </button>
      </div>
    </div>
  );
};
