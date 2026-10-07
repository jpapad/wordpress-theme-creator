import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  FileArchive, 
  Terminal, 
  Check, 
  Copy, 
  Layers, 
  HelpCircle, 
  FolderArchive,
  ArrowRight,
  Sparkles,
  Image,
  ExternalLink,
  ShieldCheck,
  Code
} from 'lucide-react';
import { ConversionResult, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from '../utils/converter';
import { exportWordPressChildThemeZip, generateThemeScreenshot, triggerBlobDownload } from '../utils/zipExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ConversionResult | null;
  meta: WordPressThemeMeta;
  onDownloadZip: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  result,
  meta,
  onDownloadZip,
}) => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isGeneratingChild, setIsGeneratingChild] = useState(false);

  const themeSlug = sanitizeSlug(meta.name || meta.textDomain || 'custom-theme');
  const childSlug = `${themeSlug}-child`;
  const cliCommand = `wp theme install ${themeSlug}.zip --activate`;

  // Render live preview of screenshot.png
  useEffect(() => {
    if (!isOpen) return;

    generateThemeScreenshot(meta, accentColor).then((blob) => {
      const url = URL.createObjectURL(blob);
      setScreenshotDataUrl(url);
    });

    return () => {
      if (screenshotDataUrl) {
        URL.revokeObjectURL(screenshotDataUrl);
      }
    };
  }, [isOpen, meta, accentColor]);

  if (!isOpen) return null;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownloadChildZip = async () => {
    if (!result) return;
    setIsGeneratingChild(true);
    try {
      const blob = await exportWordPressChildThemeZip(meta, result.files);
      triggerBlobDownload(blob, `${childSlug}.zip`);
    } catch (err) {
      console.error('Child theme generation failed:', err);
    } finally {
      setIsGeneratingChild(false);
    }
  };

  const handleDownloadScreenshotOnly = async () => {
    const blob = await generateThemeScreenshot(meta, accentColor);
    triggerBlobDownload(blob, 'screenshot.png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-island border border-line rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-inset">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl border border-emerald-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink font-display">Export WordPress Theme Packages</h2>
              <p className="text-xs text-muted">Ready for instant upload to WordPress 6.x &amp; WooCommerce</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink rounded-xl hover:bg-ink/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink-2">
          {/* Main Download Card */}
          <div className="p-5 bg-gradient-to-br from-island via-island to-inset border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-sm font-bold text-ink flex items-center gap-2 justify-center sm:justify-start font-mono">
                <FileArchive className="w-4 h-4 text-emerald-700" />
                <span>{themeSlug}.zip</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-sans font-bold border border-emerald-500/30">
                  Parent Theme
                </span>
              </div>
              <p className="text-xs text-muted">
                Includes all <strong>{result?.files.length || 0} files</strong> (PHP templates, ACF Local JSON sync, Gutenberg block patterns, WooCommerce templates, and 1200x900px screenshot.png).
              </p>
            </div>

            <button
              onClick={onDownloadZip}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-ink rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Theme ZIP</span>
            </button>
          </div>

          {/* Child Theme Generator Card */}
          <div className="p-5 bg-gradient-to-br from-island via-island to-inset border border-blue-500/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-sm font-bold text-ink flex items-center gap-2 justify-center sm:justify-start font-mono">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>{childSlug}.zip</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-700 font-sans font-bold border border-blue-500/30">
                  Child Theme
                </span>
              </div>
              <p className="text-xs text-muted">
                Companion Child Theme with clean parent CSS enqueueing. Allows safe customizations without losing modifications on parent updates.
              </p>
            </div>

            <button
              onClick={handleDownloadChildZip}
              disabled={isGeneratingChild}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-inset hover:bg-line text-blue-700 border border-blue-500/40 rounded-2xl text-xs font-bold transition-all shrink-0 hover:text-ink"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingChild ? 'Packaging...' : 'Download Child Theme (.ZIP)'}</span>
            </button>
          </div>

          {/* Theme Screenshot Generator Preview */}
          <div className="p-5 bg-inset border border-line rounded-3xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-accent-ink" />
                <h3 className="font-bold text-ink font-display">Generated Theme Screenshot (screenshot.png)</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted">Accent:</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <button
                  onClick={handleDownloadScreenshotOnly}
                  className="text-accent-ink hover:text-accent-ink text-[11px] font-semibold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download PNG (1200x900)</span>
                </button>
              </div>
            </div>

            {screenshotDataUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-line max-h-48 flex items-center justify-center bg-inset">
                <img
                  src={screenshotDataUrl}
                  alt="Theme Screenshot Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-[11px] text-faint">
              Automatically included inside the exported ZIP so WordPress Admin displays a rich preview card under <strong>Appearance &gt; Themes</strong>.
            </p>
          </div>

          {/* Installation Step-by-Step */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-2 uppercase tracking-wider">
              How to Install in WordPress (3 Simple Steps)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-inset border border-line rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span className="font-semibold text-ink">Open WP Admin</span>
                </div>
                <p className="text-muted text-[11px]">Navigate to <strong>Appearance &rarr; Themes</strong>.</p>
              </div>

              <div className="p-4 bg-inset border border-line rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="font-semibold text-ink">Upload Theme ZIP</span>
                </div>
                <p className="text-muted text-[11px]">Click <strong>Add New &rarr; Upload Theme</strong> and select <code>{themeSlug}.zip</code>.</p>
              </div>

              <div className="p-4 bg-inset border border-line rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span className="font-semibold text-ink">Activate &amp; Enjoy</span>
                </div>
                <p className="text-muted text-[11px]">Click <strong>Activate</strong>. Menus and widgets sync automatically.</p>
              </div>
            </div>
          </div>

          {/* WP-CLI Command */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-2 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent-ink" />
                <span>WP-CLI Quick Install</span>
              </span>
              <button
                onClick={handleCopyCli}
                className="text-xs text-accent-ink hover:text-accent-ink flex items-center gap-1 font-medium"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCli ? 'Copied' : 'Copy WP-CLI'}</span>
              </button>
            </div>

            <div className="p-3 bg-inset border border-line rounded-2xl font-mono text-xs text-accent-ink/90">
              <code>{cliCommand}</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line bg-inset flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-ink-2 hover:text-ink bg-inset hover:bg-line rounded-xl transition-colors border border-line"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
