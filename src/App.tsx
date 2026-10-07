import React, { useState, useEffect, useRef } from 'react';
import { Code2, Eye, FolderTree } from 'lucide-react';
import { Header, Stage } from './components/Header';
import { SourcesPanel, SourceEditor } from './components/InputStudio';
import { Inspector } from './components/Inspector';
import { AiDock } from './components/AiDock';
import { ShipStage } from './components/ShipStage';
import { ThemeFilesExplorer } from './components/ThemeFilesExplorer';
import { ThemeLivePreview } from './components/ThemeLivePreview';
import { ThemeValidationReport } from './components/ThemeValidationReport';
import { ThemeConfiguratorModal } from './components/ThemeConfiguratorModal';
import { ExportModal } from './components/ExportModal';
import { GuideModal } from './components/GuideModal';
import { PlaygroundModal } from './components/PlaygroundModal';
import { SAMPLE_TEMPLATES } from './utils/samples';
import { convertHtmlToWordPressTheme, sanitizeSlug } from './utils/converter';
import { exportWordPressThemeZip, triggerBlobDownload } from './utils/zipExport';
import { validateWordPressTheme, computeThemeScore } from './utils/validator';
import { loadWorkspace, saveWorkspace } from './utils/workspaceStorage';
import {
  ConversionOptions,
  ConversionResult,
  SampleTemplate,
  SourceFile,
  WordPressThemeFile,
  WordPressThemeMeta,
} from './types';

type BuildView = 'preview' | 'source' | 'files';

const BUILD_VIEWS: { id: BuildView; label: string; Icon: typeof Eye }[] = [
  { id: 'preview', label: 'Preview', Icon: Eye },
  { id: 'source', label: 'Source', Icon: Code2 },
  { id: 'files', label: 'Theme files', Icon: FolderTree },
];

export default function App() {
  const initialSample = SAMPLE_TEMPLATES[0];
  // Restore the last workspace (autosaved in localStorage), otherwise start from the first sample
  const [saved] = useState(() => loadWorkspace());

  // State
  const [files, setFiles] = useState<SourceFile[]>(saved?.files ?? initialSample.files);
  const [activeFileId, setActiveFileId] = useState<string>(saved?.activeFileId ?? initialSample.files[0]?.id ?? '');
  const [meta, setMeta] = useState<WordPressThemeMeta>(saved?.meta ?? initialSample.themeMeta);
  const [options, setOptions] = useState<ConversionOptions>(saved?.options ?? initialSample.options);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const [stage, setStage] = useState<Stage>('build');
  const [buildView, setBuildView] = useState<BuildView>('preview');

  const [isConverting, setIsConverting] = useState(false);
  const [isAiConverting, setIsAiConverting] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Perform initial conversion on mount
  useEffect(() => {
    handleStandardConvert();
    if (saved) showToast('Restored your last workspace');
  }, []);

  // Autosave the workspace (debounced)
  const quotaWarned = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      const outcome = saveWorkspace({ files, activeFileId, meta, options });
      if (outcome === 'without-binaries' && !quotaWarned.current) {
        quotaWarned.current = true;
        showToast('Autosave: images are too large for browser storage and will not be restored after reload');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [files, activeFileId, meta, options]);

  // Keyboard shortcut listener (Ctrl+S / Cmd+S to convert/sync)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleStandardConvert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, meta, options]);

  const handleStandardConvert = () => convertWith(options);

  const convertWith = (opts: ConversionOptions) => {
    setIsConverting(true);
    try {
      const conversionResult = convertHtmlToWordPressTheme(files, meta, opts);
      setResult(conversionResult);
      showToast(`Theme generated (${conversionResult.files.length} files)`);
    } catch (err: any) {
      console.error('Conversion failed:', err);
      showToast(`Conversion error: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleOptionsChange = (newOpts: ConversionOptions) => {
    // Convert with the new options right away (state updates are async)
    setOptions(newOpts);
    convertWith(newOpts);
  };

  const handleAiConvert = async (instruction = '') => {
    setIsAiConverting(true);
    try {
      const mainHtml = files.find((f) => f.type === 'html' && f.isMain) || files.find((f) => f.type === 'html');
      // Send every text source file (HTML pages, stylesheets, scripts); images stay local
      const sourceFiles = files
        .filter((f) => ['html', 'css', 'javascript'].includes(f.type) && !f.content.startsWith('data:'))
        .map((f) => ({ name: f.name, type: f.type, isMain: f === mainHtml, content: f.content }));

      const response = await fetch('/api/convert-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: sourceFiles,
          themeMeta: meta,
          options,
          instruction,
        }),
      });

      const aiData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(aiData.error || `AI service responded with HTTP ${response.status}`);
      }
      if (!Array.isArray(aiData.files) || aiData.files.length === 0) {
        throw new Error('AI response did not contain any theme files');
      }

      const baseResult = convertHtmlToWordPressTheme(files, meta, options);
      const aiFiles: any[] = aiData.files.filter((af: any) => typeof af?.path === 'string' && typeof af?.content === 'string');
      const mergedFiles: WordPressThemeFile[] = baseResult.files.map((bf) => {
        const aiMatch = aiFiles.find((af) => af.path === bf.path);
        return aiMatch && bf.encoding !== 'dataurl' ? { ...bf, content: aiMatch.content } : bf;
      });
      // Keep extra files the AI created (e.g. template-parts it split out)
      for (const af of aiFiles) {
        if (mergedFiles.some((f) => f.path === af.path)) continue;
        const ext = af.path.split('.').pop();
        mergedFiles.push({
          path: af.path,
          name: af.path.split('/').pop() || af.path,
          folder: af.path.includes('/') ? af.path.slice(0, af.path.lastIndexOf('/')) : undefined,
          content: af.content,
          language: ext === 'php' ? 'php' : ext === 'css' ? 'css' : ext === 'js' ? 'javascript' : ext === 'json' ? 'json' : 'markdown',
          purpose: af.purpose || 'Generated by Gemini AI',
          isCore: false,
        });
      }

      // Re-validate: AI output gets the same PHP syntax checks as the rule-based engine
      const validations = validateWordPressTheme(mergedFiles, baseResult.meta);
      setResult({
        ...baseResult,
        files: mergedFiles,
        validations,
        stats: { ...baseResult.stats, filesCreated: mergedFiles.length, themeScore: computeThemeScore(validations) },
        aiEnhanced: true,
        summary: aiData.summary || 'AI-Enhanced WordPress Theme conversion completed.',
      });
      const syntaxError = validations.find((v) => v.id === 'security-php-syntax' && v.status === 'error');
      showToast(syntaxError ? 'AI theme generated, but the audit found PHP syntax errors. Check Audit.' : 'Theme refined with Gemini');
    } catch (err: any) {
      console.warn('AI conversion fallback:', err);
      handleStandardConvert();
      showToast(`AI unavailable (${err.message}). Used the standard engine instead.`);
    } finally {
      setIsAiConverting(false);
    }
  };

  const handleSelectSample = (sample: SampleTemplate) => {
    setFiles(sample.files);
    setActiveFileId(sample.files[0]?.id || '');
    setMeta(sample.themeMeta);
    setOptions(sample.options);
    setIsPlaygroundOpen(false);

    const conversionResult = convertHtmlToWordPressTheme(sample.files, sample.themeMeta, sample.options);
    setResult(conversionResult);
    showToast(`Loaded "${sample.name}"`);
  };

  const handleUpdateFileContent = (path: string, newContent: string) => {
    if (!result) return;
    setResult({
      ...result,
      files: result.files.map((f) => (f.path === path ? { ...f, content: newContent } : f)),
    });
    showToast(`Updated ${path}`);
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    try {
      const blob = await exportWordPressThemeZip(result.files, meta);
      const filename = `${sanitizeSlug(meta.name || 'custom-theme')}.zip`;
      triggerBlobDownload(blob, filename);
      showToast(`Downloaded ${filename}`);
    } catch (err: any) {
      console.error('ZIP download failed:', err);
      showToast(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col gap-4 p-3 sm:p-4 bg-canvas text-ink font-sans overflow-hidden">
      <Header
        stage={stage}
        setStage={setStage}
        themeName={meta.name}
        result={result}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenPlayground={() => setIsPlaygroundOpen(true)}
        onSelectSample={handleSelectSample}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {stage === 'build' && (
        <>
          {/* Islands: stack on small screens and scroll as a page, three columns on desktop */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible grid gap-4 grid-cols-1 auto-rows-max lg:auto-rows-auto lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_300px]">
            <SourcesPanel
              files={files}
              setFiles={setFiles}
              activeFileId={activeFileId}
              setActiveFileId={setActiveFileId}
              outputFileCount={result?.files.length ?? 0}
              onOpenSource={() => setBuildView('source')}
              onOpenOutput={() => setBuildView('files')}
            />

            <section aria-label="Workspace" className="island flex flex-col gap-3 p-3.5 min-h-[560px] lg:min-h-0 min-w-0 overflow-hidden">
              <div role="tablist" aria-label="Workspace view" className="flex flex-wrap gap-1.5">
                {BUILD_VIEWS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    id={`view-${id}`}
                    role="tab"
                    type="button"
                    aria-selected={buildView === id}
                    onClick={() => setBuildView(id)}
                    className={`h-8 px-3 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors ${
                      buildView === id ? 'bg-ink text-white' : 'border border-line-strong bg-island text-ink-2 hover:bg-inset'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden">
                {buildView === 'preview' && (
                  <ThemeLivePreview
                    result={result}
                    meta={meta}
                    options={options}
                    onOptionsChange={handleOptionsChange}
                    onReconvert={() => {}}
                  />
                )}
                {buildView === 'source' && (
                  <SourceEditor files={files} setFiles={setFiles} activeFileId={activeFileId} setActiveFileId={setActiveFileId} />
                )}
                {buildView === 'files' &&
                  (result ? (
                    <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-line overflow-hidden">
                      <ThemeFilesExplorer files={result.files} onUpdateFileContent={handleUpdateFileContent} />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted">Convert to inspect the generated theme files.</div>
                  ))}
              </div>
            </section>

            <Inspector
              meta={meta}
              setMeta={setMeta}
              options={options}
              onOptionsChange={handleOptionsChange}
              result={result}
              isConverting={isConverting}
              onConvert={handleStandardConvert}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>

          <AiDock isBusy={isAiConverting} onSubmit={handleAiConvert} />
        </>
      )}

      {stage === 'audit' && <ThemeValidationReport result={result} />}

      {stage === 'ship' && (
        <ShipStage
          result={result}
          meta={meta}
          onDownloadZip={handleDownloadZip}
          onOpenExportOptions={() => setIsExportOpen(true)}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div role="status" className="fixed bottom-[176px] sm:bottom-6 right-5 z-50 max-w-[calc(100vw-40px)] px-4 py-2.5 bg-ink text-white text-[13px] font-medium rounded-xl shadow-dock flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <ThemeConfiguratorModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        meta={meta}
        setMeta={setMeta}
        options={options}
        setOptions={setOptions}
        onSaveAndConvert={handleStandardConvert}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        result={result}
        meta={meta}
        onDownloadZip={handleDownloadZip}
      />

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <PlaygroundModal isOpen={isPlaygroundOpen} onClose={() => setIsPlaygroundOpen(false)} result={result} meta={meta} />
    </div>
  );
}
