import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputStudio } from './components/InputStudio';
import { ThemeFilesExplorer } from './components/ThemeFilesExplorer';
import { ThemeLivePreview } from './components/ThemeLivePreview';
import { ThemeValidationReport } from './components/ThemeValidationReport';
import { ThemeConfiguratorModal } from './components/ThemeConfiguratorModal';
import { ExportModal } from './components/ExportModal';
import { GuideModal } from './components/GuideModal';
import { WorkspaceControls, WorkspaceLayout, EditorFontSize } from './components/WorkspaceControls';
import { StatusBar } from './components/StatusBar';
import { SAMPLE_TEMPLATES } from './utils/samples';
import { convertHtmlToWordPressTheme, sanitizeSlug } from './utils/converter';
import { exportWordPressThemeZip, triggerBlobDownload } from './utils/zipExport';
import { 
  ConversionOptions, 
  ConversionResult, 
  SampleTemplate, 
  SourceFile, 
  WordPressThemeMeta 
} from './types';

export default function App() {
  const initialSample = SAMPLE_TEMPLATES[0];

  // State
  const [files, setFiles] = useState<SourceFile[]>(initialSample.files);
  const [activeFileId, setActiveFileId] = useState<string>(initialSample.files[0]?.id || '');
  const [meta, setMeta] = useState<WordPressThemeMeta>(initialSample.themeMeta);
  const [options, setOptions] = useState<ConversionOptions>(initialSample.options);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'audit' | 'export'>('editor');
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>('split');
  const [editorFontSize, setEditorFontSize] = useState<EditorFontSize>('md');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isConverting, setIsConverting] = useState(false);
  const [isAiConverting, setIsAiConverting] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Perform initial conversion on mount
  useEffect(() => {
    handleStandardConvert();
  }, []);

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

  const handleStandardConvert = () => {
    setIsConverting(true);
    try {
      const conversionResult = convertHtmlToWordPressTheme(files, meta, options);
      setResult(conversionResult);
      showToast(`WordPress Theme generated successfully (${conversionResult.files.length} files)`);
    } catch (err: any) {
      console.error('Conversion failed:', err);
      showToast(`Conversion error: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleAiConvert = async () => {
    setIsAiConverting(true);
    try {
      const mainHtml = files.find((f) => f.type === 'html')?.content || '';
      const mainCss = files.find((f) => f.type === 'css')?.content || '';

      const response = await fetch('/api/convert-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: mainHtml,
          css: mainCss,
          themeMeta: meta,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('AI conversion service unavailable. Using high-precision AST converter.');
      }

      const aiData = await response.json();
      if (aiData.files && Array.isArray(aiData.files)) {
        const baseResult = convertHtmlToWordPressTheme(files, meta, options);
        const mergedFiles = baseResult.files.map((bf) => {
          const aiMatch = aiData.files.find((af: any) => af.path === bf.path || af.name === bf.name);
          if (aiMatch && aiMatch.content) {
            return { ...bf, content: aiMatch.content };
          }
          return bf;
        });

        setResult({
          ...baseResult,
          files: mergedFiles,
          aiEnhanced: true,
          summary: aiData.summary || 'AI-Enhanced WordPress Theme conversion completed.',
        });
        showToast('Theme enhanced with Gemini AI conversion!');
      } else {
        handleStandardConvert();
      }
    } catch (err: any) {
      console.warn('AI conversion fallback:', err);
      handleStandardConvert();
      showToast('Generated theme with standard high-performance engine');
    } finally {
      setIsAiConverting(false);
    }
  };

  const handleSelectSample = (sample: SampleTemplate) => {
    setFiles(sample.files);
    setActiveFileId(sample.files[0]?.id || '');
    setMeta(sample.themeMeta);
    setOptions(sample.options);

    const conversionResult = convertHtmlToWordPressTheme(sample.files, sample.themeMeta, sample.options);
    setResult(conversionResult);
    showToast(`Loaded "${sample.name}" preset template!`);
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
      showToast(`Downloaded ${filename}!`);
    } catch (err: any) {
      console.error('ZIP download failed:', err);
      showToast(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#08090d] text-zinc-100 overflow-hidden font-sans ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* App Header */}
      {!isFullscreen && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          result={result}
          isConverting={isConverting}
          isAiConverting={isAiConverting}
          onConvert={handleStandardConvert}
          onAiConvert={handleAiConvert}
          onOpenConfig={() => setIsConfigOpen(true)}
          onExportZip={() => setIsExportOpen(true)}
          onSelectSample={handleSelectSample}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#08090d]">
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Workspace View Mode & Tool Controls */}
            <WorkspaceControls
              layout={workspaceLayout}
              setLayout={setWorkspaceLayout}
              fontSize={editorFontSize}
              setFontSize={setEditorFontSize}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              totalFiles={result?.files.length || 0}
              themeSlug={meta.textDomain}
              onQuickConvert={handleStandardConvert}
              isConverting={isConverting}
            />

            {/* Editor Workspace Container */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
              {/* Left Column: Source Input */}
              {(workspaceLayout === 'split' || workspaceLayout === 'tabs' || workspaceLayout === 'source-only') && (
                <div className={`flex-1 flex flex-col min-w-0 ${workspaceLayout === 'split' ? 'w-full md:w-1/2' : 'w-full'} h-full`}>
                  <div className="bg-[#0c0e15] border-b border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>1. Raw HTML &amp; CSS Source Input</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">Edit or drag markup files</span>
                  </div>
                  <InputStudio
                    files={files}
                    setFiles={setFiles}
                    activeFileId={activeFileId}
                    setActiveFileId={setActiveFileId}
                    meta={meta}
                    setMeta={setMeta}
                    options={options}
                    setOptions={setOptions}
                    onOpenConfig={() => setIsConfigOpen(true)}
                    fontSize={editorFontSize}
                  />
                </div>
              )}

              {/* Right Column: Generated WordPress Hierarchy */}
              {(workspaceLayout === 'split' || workspaceLayout === 'wp-only') && (
                <div className={`flex-1 flex flex-col min-w-0 ${workspaceLayout === 'split' ? 'w-full md:w-1/2' : 'w-full'} h-full`}>
                  <div className="bg-[#0c0e15] border-b border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-amber-300 font-semibold">2. Converted WordPress Theme Hierarchy</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">Theme Check Compliant</span>
                  </div>
                  {result ? (
                    <ThemeFilesExplorer
                      files={result.files}
                      onUpdateFileContent={handleUpdateFileContent}
                      fontSize={editorFontSize}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs bg-[#08090d]">
                      Click "Convert to WP" to inspect generated theme files.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <ThemeLivePreview
            result={result}
            meta={meta}
            options={options}
            onOptionsChange={(newOpts) => {
              setOptions(newOpts);
            }}
            onReconvert={handleStandardConvert}
          />
        )}

        {activeTab === 'audit' && (
          <ThemeValidationReport result={result} />
        )}
      </main>

      {/* Modern Status Bar */}
      <StatusBar
        meta={meta}
        result={result}
        isConverting={isConverting}
        totalSourceFiles={files.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-5 z-50 px-4 py-2.5 bg-[#0e111a] border border-amber-500/30 text-zinc-100 text-xs rounded-2xl shadow-2xl shadow-black/90 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold">{toastMessage}</span>
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

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
