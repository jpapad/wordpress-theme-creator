import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertTriangle, PlayCircle } from 'lucide-react';
import { ConversionResult, WordPressThemeMeta } from '../types';
import { exportWordPressThemeZip } from '../utils/zipExport';
import { sanitizeSlug } from '../utils/converter';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ConversionResult | null;
  meta: WordPressThemeMeta;
}

/**
 * Boots a real WordPress (PHP compiled to WebAssembly) in an iframe and installs
 * the generated theme ZIP into it, entirely in the browser.
 */
export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({ isOpen, onClose, result, meta }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'booting' | 'ready' | 'error'>('booting');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !result || !iframeRef.current) return;
    let cancelled = false;
    setStatus('booting');
    setError('');

    (async () => {
      try {
        const slug = sanitizeSlug(meta.name || meta.textDomain || 'custom-theme');
        const zip = await exportWordPressThemeZip(result.files, meta);
        const contents = new Uint8Array(await zip.arrayBuffer());
        const { startPlaygroundWeb } = await import('@wp-playground/client');

        const steps: any[] = [{ step: 'login', username: 'admin', password: 'password' }];
        if (result.options.enableWooCommerce) {
          steps.push({
            step: 'installPlugin',
            pluginData: { resource: 'wordpress.org/plugins', slug: 'woocommerce' },
            options: { activate: true },
          });
        }
        steps.push({
          step: 'installTheme',
          themeData: { resource: 'literal', name: `${slug}.zip`, contents },
          options: { activate: true },
        });

        await startPlaygroundWeb({
          iframe: iframeRef.current!,
          remoteUrl: 'https://playground.wordpress.net/remote.html',
          blueprint: {
            landingPage: '/',
            preferredVersions: { php: '8.2', wp: 'latest' },
            steps,
          } as any,
        });
        if (!cancelled) setStatus('ready');
      } catch (err: any) {
        console.error('Playground failed:', err);
        if (!cancelled) {
          setStatus('error');
          setError(err?.message || String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, result, meta]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full h-full max-w-7xl bg-island border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line text-xs">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <PlayCircle className="w-4 h-4 text-emerald-700" />
            <span>WordPress Playground &middot; {meta.name}</span>
            {status === 'booting' && (
              <span className="flex items-center gap-1.5 text-muted font-normal">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Booting WordPress &amp; installing theme…
              </span>
            )}
            {status === 'ready' && <span className="text-emerald-700 font-normal">Running &middot; admin / password</span>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-ink/[0.06]" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-2 px-4 py-3 bg-rose-500/10 border-b border-rose-500/30 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
            <div>
              <div className="font-semibold">Playground could not start or the theme failed to install.</div>
              <div className="font-mono mt-1 break-all text-rose-700">{error}</div>
            </div>
          </div>
        )}

        <iframe ref={iframeRef} title="WordPress Playground" className="flex-1 w-full bg-white" />
      </div>
    </div>
  );
};
