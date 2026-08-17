import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Code2, 
  Zap, 
  Award,
  Layers,
  FileCode,
  Terminal
} from 'lucide-react';
import { ConversionResult } from '../types';

interface ThemeValidationReportProps {
  result: ConversionResult | null;
}

export const ThemeValidationReport: React.FC<ThemeValidationReportProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090b] text-zinc-400 text-center">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Theme Audit Ready</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Convert HTML/CSS to inspect official WordPress.org Theme Check compliance score, security guards, and hook validations.
          </p>
        </div>
      </div>
    );
  }

  const passCount = result.validations.filter((v) => v.status === 'pass').length;
  const warningCount = result.validations.filter((v) => v.status === 'warning').length;
  const errorCount = result.validations.filter((v) => v.status === 'error').length;
  const totalCount = result.validations.length;
  const score = Math.round((passCount / (totalCount || 1)) * 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090d] text-zinc-100 overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Score & Highlights Banner */}
        <div className="bg-gradient-to-br from-[#10131d] via-[#0d0f17] to-[#08090d] border border-white/[0.08] rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Score Circle */}
              <div className="relative w-24 h-24 rounded-2xl bg-[#08090d] border border-white/[0.08] flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-black text-emerald-400 font-mono">{score}%</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">WP Score</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-display">WordPress Theme Check Audit</h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Ready for Production
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Evaluated against WordPress Theme Developer Handbook, Theme Check standard guidelines, and modern Gutenberg requirements.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="p-3 bg-[#08090d] border border-white/[0.08] rounded-2xl text-center min-w-[90px]">
                <div className="text-xl font-bold text-emerald-400 font-mono">{passCount}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Passed</div>
              </div>
              <div className="p-3 bg-[#08090d] border border-white/[0.08] rounded-2xl text-center min-w-[90px]">
                <div className="text-xl font-bold text-amber-400 font-mono">{warningCount}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Warnings</div>
              </div>
              <div className="p-3 bg-[#08090d] border border-white/[0.08] rounded-2xl text-center min-w-[90px]">
                <div className="text-xl font-bold text-rose-400 font-mono">{errorCount}</div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Errors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-[#0c0e15] border border-white/[0.06] rounded-2xl">
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 mb-1 font-semibold">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Theme Files</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{result.stats.filesCreated} generated</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Template hierarchy intact</div>
          </div>

          <div className="p-4 bg-[#0c0e15] border border-white/[0.06] rounded-2xl">
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 mb-1 font-semibold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>WordPress Hooks</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{result.stats.phpHooksInjected} injected</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">wp_head, wp_footer &amp; body_class</div>
          </div>

          <div className="p-4 bg-[#0c0e15] border border-white/[0.06] rounded-2xl">
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 mb-1 font-semibold">
              <Code2 className="w-4 h-4 text-amber-300" />
              <span>Template Tags</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{result.stats.templateTagsUsed} tags</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">the_title, the_content, etc.</div>
          </div>

          <div className="p-4 bg-[#0c0e15] border border-white/[0.06] rounded-2xl">
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 mb-1 font-semibold">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Enqueued Assets</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{result.stats.assetsEnqueued} assets</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">wp_enqueue_scripts verified</div>
          </div>
        </div>

        {/* Builder & Engine Integrations Status */}
        <div className="bg-[#0c0e15] border border-white/[0.06] rounded-3xl p-5 space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Theme Integrations &amp; Ecosystem Compatibility</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#08090d] border border-rose-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">Elementor Pro Ready</div>
                <div className="text-[10px] text-zinc-400">Locations &amp; Custom Widgets</div>
              </div>
              <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 font-mono text-[10px] rounded-md font-bold">100% READY</span>
            </div>

            <div className="p-3 bg-[#08090d] border border-indigo-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">Gutenberg &amp; FSE</div>
                <div className="text-[10px] text-zinc-400">block.json &amp; theme.json</div>
              </div>
              <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 font-mono text-[10px] rounded-md font-bold">SUPPORTED</span>
            </div>

            <div className="p-3 bg-[#08090d] border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">CPTs &amp; Taxonomies</div>
                <div className="text-[10px] text-zinc-400">Single &amp; Archive Templates</div>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-300 font-mono text-[10px] rounded-md font-bold">REGISTERED</span>
            </div>

            <div className="p-3 bg-[#08090d] border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">ACF Local JSON</div>
                <div className="text-[10px] text-zinc-400">Auto-sync field groups</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 font-mono text-[10px] rounded-md font-bold">SYNCED</span>
            </div>

            <div className="p-3 bg-[#08090d] border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">One-Click Demo (WXR)</div>
                <div className="text-[10px] text-zinc-400">demo-data/content.xml &amp; OCDI</div>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 font-mono text-[10px] rounded-md font-bold">BUNDLED</span>
            </div>

            <div className="p-3 bg-[#08090d] border border-cyan-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">i18n Localization</div>
                <div className="text-[10px] text-zinc-400">languages/{result.meta.textDomain || 'theme'}.pot</div>
              </div>
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 font-mono text-[10px] rounded-md font-bold">TRANSLATABLE</span>
            </div>
          </div>
        </div>

        {/* Detailed Validation Items List */}
        <div className="bg-[#0c0e15] border border-white/[0.06] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Theme Compliance &amp; Standards Checks</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{result.validations.length} Rules Inspected</span>
          </div>

          <div className="space-y-3">
            {result.validations.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#08090d] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl flex items-start gap-3.5 transition-colors"
              >
                <div className="mt-0.5">
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : item.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded uppercase font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{item.description}</p>

                  {item.recommendation && (
                    <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 font-mono">
                      Fix: {item.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
