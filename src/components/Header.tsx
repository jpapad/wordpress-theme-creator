import React from 'react';
import { 
  Sparkles, 
  Settings2, 
  Eye, 
  Code2, 
  CheckCircle2, 
  BookOpen, 
  Layers,
  FileArchive,
  Wand2,
  ChevronDown
} from 'lucide-react';
import { ConversionResult, SampleTemplate } from '../types';
import { SAMPLE_TEMPLATES } from '../utils/samples';

interface HeaderProps {
  activeTab: 'editor' | 'preview' | 'audit' | 'export';
  setActiveTab: (tab: 'editor' | 'preview' | 'audit' | 'export') => void;
  result: ConversionResult | null;
  isConverting: boolean;
  isAiConverting: boolean;
  onConvert: () => void;
  onAiConvert: () => void;
  onOpenConfig: () => void;
  onExportZip: () => void;
  onSelectSample: (sample: SampleTemplate) => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  result,
  isConverting,
  isAiConverting,
  onConvert,
  onAiConvert,
  onOpenConfig,
  onExportZip,
  onSelectSample,
  onOpenGuide,
}) => {
  return (
    <header className="bg-[#0b0d14]/90 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-40 px-4 lg:px-6 py-2.5 text-zinc-100 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={onOpenGuide} title="WordPress Theme Studio">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <span className="text-base font-extrabold text-black font-serif-luxury">W</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0d14]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
                  <span>HTML</span>
                  <span className="text-amber-400 text-xs">&rarr;</span>
                  <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">WordPress</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-md">
                  Studio v2.4
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal truncate max-w-[280px] sm:max-w-none">
                Transform static markup into standard WordPress themes with hooks &amp; loops
              </p>
            </div>
          </div>

          {/* Mobile Settings Icon */}
          <div className="md:hidden">
            <button
              onClick={onOpenConfig}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs border border-white/10"
              title="Theme Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Viewport Navigation Tabs */}
        <div className="flex items-center bg-[#07080c] p-1 rounded-xl border border-white/[0.08] shadow-inner">
          <button
            id="tab-editor"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'editor'
                ? 'bg-zinc-800/90 text-amber-300 shadow-md border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code &amp; Templates</span>
          </button>

          <button
            id="tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'preview'
                ? 'bg-zinc-800/90 text-amber-300 shadow-md border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live WP Simulator</span>
            {result && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse"></span>
            )}
          </button>

          <button
            id="tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'audit'
                ? 'bg-zinc-800/90 text-amber-300 shadow-md border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Theme Audit</span>
            {result && (
              <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] rounded-md font-mono font-bold">
                100%
              </span>
            )}
          </button>
        </div>

        {/* Action Controls & Triggers */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Preset Templates Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-white/[0.08] rounded-xl transition-all shadow-sm">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute right-0 mt-2 w-64 p-2 bg-[#10121a] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                Load Preset HTML Theme
              </div>
              <div className="space-y-1 mt-1">
                {SAMPLE_TEMPLATES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.06] text-xs transition-colors group/item"
                  >
                    <div className="font-semibold text-zinc-200 group-hover/item:text-amber-400 flex items-center justify-between">
                      <span>{sample.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-md font-mono uppercase font-normal">{sample.options.themeType}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {sample.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Config Settings Trigger */}
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-white/[0.08] rounded-xl transition-all shadow-sm"
            title="Configure Theme Headers, CPTs, Sidebars & Menus"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Guide / Docs Trigger */}
          <button
            onClick={onOpenGuide}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-all border border-transparent hover:border-white/10"
            title="Theme Architecture & Hierarchy Guide"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Standard Convert Button */}
          <button
            id="btn-convert"
            onClick={onConvert}
            disabled={isConverting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 active:scale-95 rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>{isConverting ? 'Building...' : 'Convert to WP'}</span>
          </button>

          {/* AI Deep Parser */}
          <button
            id="btn-ai-convert"
            onClick={onAiConvert}
            disabled={isAiConverting || isConverting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all disabled:opacity-50"
            title="Deep AI conversion with Gemini for custom template hierarchy & ACF fields"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">{isAiConverting ? 'AI Parsing...' : 'AI Refine'}</span>
          </button>

          {/* Export ZIP */}
          <button
            id="btn-export-zip"
            onClick={onExportZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl transition-all shadow-sm hover:shadow-emerald-500/10"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>Export ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};

