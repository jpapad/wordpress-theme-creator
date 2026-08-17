import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Settings,
  Code,
  FileCheck2,
  FolderOpen,
  Wand2
} from 'lucide-react';
import { SourceFile, WordPressThemeMeta, ConversionOptions } from '../types';
import { QuickSnippetToolbar } from './QuickSnippetToolbar';
import { EditorFontSize } from './WorkspaceControls';

interface InputStudioProps {
  files: SourceFile[];
  setFiles: React.Dispatch<React.SetStateAction<SourceFile[]>>;
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  meta: WordPressThemeMeta;
  setMeta: React.Dispatch<React.SetStateAction<WordPressThemeMeta>>;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  onOpenConfig: () => void;
  fontSize?: EditorFontSize;
}

export const InputStudio: React.FC<InputStudioProps> = ({
  files,
  setFiles,
  activeFileId,
  setActiveFileId,
  meta,
  setMeta,
  options,
  setOptions,
  onOpenConfig,
  fontSize = 'md',
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!activeFile) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const prevContent = activeFile.content;
      const newContent = prevContent.substring(0, start) + snippet + prevContent.substring(end);
      handleContentChange(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 50);
    } else {
      handleContentChange(activeFile.content + '\n' + snippet);
    }
  };

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        
        let fileType: SourceFile['type'] = 'other';
        if (ext === 'html' || ext === 'htm') fileType = 'html';
        else if (ext === 'css') fileType = 'css';
        else if (ext === 'js') fileType = 'javascript';
        else if (ext === 'json') fileType = 'json';

        const newSourceFile: SourceFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          path: file.name,
          content,
          type: fileType,
          isMain: file.name === 'index.html' || (fileType === 'html' && !files.some(f => f.isMain)),
        };

        setFiles((prev) => {
          const exists = prev.some((f) => f.name === file.name);
          if (exists) {
            return prev.map((f) => (f.name === file.name ? newSourceFile : f));
          }
          return [...prev, newSourceFile];
        });

        setActiveFileId(newSourceFile.id);
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleAddNewFile = () => {
    const fileName = prompt('Enter new file name (e.g. custom.css, script.js, page.html):', 'template.html');
    if (!fileName) return;

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let fileType: SourceFile['type'] = 'other';
    if (ext === 'html' || ext === 'htm') fileType = 'html';
    else if (ext === 'css') fileType = 'css';
    else if (ext === 'js') fileType = 'javascript';

    const newFile: SourceFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: fileName,
      content: fileType === 'html' ? '<div class="custom-component">\n  <h2>Custom Block</h2>\n</div>' : '',
      type: fileType,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (files.length <= 1) {
      alert('You must keep at least one source file.');
      return;
    }
    if (confirm(`Remove ${name}?`)) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
  };

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-xs leading-5';
      case 'lg':
        return 'text-base leading-7';
      case 'md':
      default:
        return 'text-[13px] leading-6';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090d] text-zinc-100 overflow-hidden">
      {/* Top Banner / Theme Meta Quick Strip */}
      <div className="bg-[#0c0e15] border-b border-white/[0.06] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[#08090d] px-2.5 py-1 rounded-xl border border-white/[0.08]">
            <span className="text-zinc-400 font-semibold text-[11px]">Theme:</span>
            <input
              type="text"
              value={meta.name}
              onChange={(e) => setMeta({ ...meta, name: e.target.value })}
              className="bg-transparent text-xs text-white font-bold outline-none w-36 sm:w-44 focus:text-amber-300 transition-colors"
              placeholder="Theme Name"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#08090d] px-2.5 py-1 rounded-xl border border-white/[0.08]">
            <span className="text-zinc-400 font-semibold text-[11px]">Slug:</span>
            <input
              type="text"
              value={meta.textDomain}
              onChange={(e) => setMeta({ ...meta, textDomain: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
              className="bg-transparent text-xs text-amber-300 font-mono font-medium outline-none w-28 sm:w-36 transition-colors"
              placeholder="textdomain"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#08090d] px-2.5 py-1 rounded-xl border border-white/[0.08] hidden sm:flex">
            <span className="text-zinc-400 font-semibold text-[11px]">Author:</span>
            <input
              type="text"
              value={meta.author}
              onChange={(e) => setMeta({ ...meta, author: e.target.value })}
              className="bg-transparent text-xs text-zinc-200 outline-none w-28 transition-colors font-medium"
              placeholder="Author"
            />
          </div>
        </div>

        <button
          onClick={onOpenConfig}
          className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors font-semibold group"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          <span>Advanced Theme Architecture &rarr;</span>
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* File Tabs & Sidebar */}
        <div className="w-full md:w-56 bg-[#0b0d14] border-r border-white/[0.06] flex flex-col justify-between shrink-0">
          <div className="p-2.5">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Source Files ({files.length})</span>
              </span>
              <button
                onClick={handleAddNewFile}
                className="p-1 hover:bg-white/[0.06] text-zinc-400 hover:text-white rounded-lg transition-colors"
                title="Add New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* File List */}
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer group transition-all duration-150 ${
                    file.id === activeFileId
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold shadow-sm'
                      : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.type === 'html' ? (
                      <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : file.type === 'css' ? (
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : (
                      <Code className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                    {file.isMain && (
                      <span className="px-1 text-[9px] bg-amber-500/20 text-amber-300 rounded font-mono font-normal">
                        main
                      </span>
                    )}
                  </div>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id, file.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                      title="Delete File"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`p-3 m-2.5 border border-dashed rounded-2xl transition-all text-center cursor-pointer ${
              isDragging
                ? 'border-amber-400 bg-amber-500/15 scale-[0.99]'
                : 'border-white/10 hover:border-amber-500/40 bg-[#08090d]/90'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept=".html,.htm,.css,.js,.json"
              className="hidden"
            />
            <Upload className="w-4 h-4 mx-auto text-amber-400/80 mb-1" />
            <div className="text-xs font-semibold text-zinc-200">
              Drop HTML &amp; CSS
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              or click to browse
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="flex-1 flex flex-col bg-[#07080c] min-w-0">
          {/* Editor Header Bar */}
          <div className="bg-[#0c0e15] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/20"></span>
              <span className="font-semibold text-zinc-100">{activeFile?.name}</span>
              <span className="text-zinc-500 text-[11px]">
                ({(activeFile?.content.length || 0).toLocaleString()} chars)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-zinc-200 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-all border border-white/10 shadow-sm"
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Snippet Insert Bar */}
          <QuickSnippetToolbar onInsertSnippet={handleInsertSnippet} />

          {/* Textarea Code Input */}
          <div className="flex-1 p-2.5 flex flex-col">
            <textarea
              id="source-code-editor"
              ref={textareaRef}
              value={activeFile?.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`w-full flex-1 bg-[#090b11] text-zinc-100 font-mono p-4 rounded-2xl border border-white/[0.08] focus:border-amber-500/50 outline-none resize-none selection:bg-amber-500/30 transition-colors shadow-inner ${getFontSizeClass()}`}
              spellCheck={false}
              placeholder={`Paste your ${activeFile?.type.toUpperCase()} markup here...`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
