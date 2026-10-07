import React from 'react';
import { Archive, Download, Play, SlidersHorizontal } from 'lucide-react';
import { ConversionResult, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from '../utils/converter';

interface ShipStageProps {
  result: ConversionResult | null;
  meta: WordPressThemeMeta;
  onDownloadZip: () => void;
  onOpenExportOptions: () => void;
  onOpenPlayground: () => void;
}

/**
 * Ship stage: download the theme package or run it in WordPress Playground.
 */
export const ShipStage: React.FC<ShipStageProps> = ({ result, meta, onDownloadZip, onOpenExportOptions, onOpenPlayground }) => {
  const slug = sanitizeSlug(meta.name || meta.textDomain || 'custom-theme');
  const errors = result?.validations.filter((v) => v.status === 'error').length ?? 0;
  const binaryCount = result?.files.filter((f) => f.encoding === 'dataurl').length ?? 0;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <section className="island p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-[28px] font-bold leading-tight">Download your theme</h1>
            <p className="text-muted leading-relaxed">Upload the ZIP in Appearance › Themes › Add New Theme › Upload.</p>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-inset">
            <div className="w-11 h-11 rounded-xl bg-island flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5 text-accent-ink" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[13px] font-medium truncate">{slug}.zip</div>
              <div className="text-xs text-muted">
                {result ? `${result.files.length} files${binaryCount ? ` · ${binaryCount} assets` : ''} · score ${result.stats.themeScore}` : 'Convert first'}
              </div>
            </div>
          </div>

          {errors > 0 && (
            <p className="p-3.5 rounded-xl bg-err-soft text-err text-[13px] leading-relaxed">
              The audit found {errors} error{errors > 1 ? 's' : ''}. The theme may not activate until they are fixed.
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={!result}
              className="h-12 rounded-xl bg-accent text-white font-semibold flex items-center justify-center gap-2 hover:bg-accent-ink transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" strokeWidth={2.4} />
              Download ZIP
            </button>
            <button
              type="button"
              onClick={onOpenExportOptions}
              disabled={!result}
              className="h-12 rounded-xl border border-line-strong bg-island font-semibold flex items-center justify-center gap-2 hover:bg-inset transition-colors disabled:opacity-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Child theme &amp; more options
            </button>
          </div>
        </section>

        <section className="p-7 flex flex-col gap-5 rounded-[22px] bg-ink text-white">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-[28px] font-bold leading-tight">Test in WordPress</h2>
            <p className="text-[#C3C9D9] leading-relaxed">
              Boots a real WordPress with PHP 8.2 in your browser and activates this theme. Nothing is uploaded to a server.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-[#D7DAE1] text-[14px]">
            <li>· Login: admin / password</li>
            <li>· WooCommerce is installed when the theme needs it</li>
            <li>· Re-open after changes to test the latest build</li>
          </ul>
          <button
            type="button"
            onClick={onOpenPlayground}
            disabled={!result}
            className="mt-auto h-12 rounded-xl bg-white text-ink font-semibold flex items-center justify-center gap-2 hover:bg-line transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" strokeWidth={2.4} />
            Launch Playground
          </button>
        </section>
      </div>
    </div>
  );
};
