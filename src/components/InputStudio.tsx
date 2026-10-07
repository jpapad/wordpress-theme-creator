import React, { useRef, useState } from 'react';
import { Plus, Trash2, Copy, Check, FolderUp, Upload } from 'lucide-react';
import { EditorFontSize, SourceFile } from '../types';
import { QuickSnippetToolbar } from './QuickSnippetToolbar';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'];
const BINARY_EXTENSIONS = ['woff', 'woff2', 'ttf', 'otf', 'eot', 'mp4', 'webm', 'ogg', 'mp3', 'wav', 'pdf'];
const TEXT_EXTENSIONS = ['html', 'htm', 'css', 'js', 'json'];
const ACCEPTED_EXTENSIONS = [...TEXT_EXTENSIONS, ...IMAGE_EXTENSIONS, ...BINARY_EXTENSIONS];

function fileTypeFor(ext: string): SourceFile['type'] {
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js') return 'javascript';
  if (ext === 'json') return 'json';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'other';
}

/** Short label shown on a file card thumbnail */
function thumbLabel(file: SourceFile): string {
  switch (file.type) {
    case 'html':
      return '<html>';
    case 'css':
      return '{ css }';
    case 'javascript':
      return 'js';
    case 'json':
      return '{ }';
    default:
      return file.name.split('.').pop() || 'file';
  }
}

interface SourceFilesProps {
  files: SourceFile[];
  setFiles: React.Dispatch<React.SetStateAction<SourceFile[]>>;
  activeFileId: string;
  setActiveFileId: (id: string) => void;
}

interface SourcesPanelProps extends SourceFilesProps {
  outputFileCount: number;
  onOpenSource: () => void;
  onOpenOutput: () => void;
}

/**
 * Left island: source files as cards, uploads (files or a whole site folder).
 */
export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  files,
  setFiles,
  activeFileId,
  setActiveFileId,
  outputFileCount,
  onOpenSource,
  onOpenOutput,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      // Folder uploads may contain unrelated files (.DS_Store, .md, node_modules...)
      if (!ACCEPTED_EXTENSIONS.includes(ext)) return;
      const fileType = fileTypeFor(ext);
      const isBinary = fileType === 'image' || BINARY_EXTENSIONS.includes(ext);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const newSourceFile: SourceFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          // Keep the folder structure when a whole directory is uploaded
          path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
          content,
          type: fileType,
          isMain: file.name === 'index.html' || (fileType === 'html' && !files.some((f) => f.isMain)),
        };

        setFiles((prev) =>
          prev.some((f) => f.name === file.name)
            ? prev.map((f) => (f.name === file.name ? newSourceFile : f))
            : [...prev, newSourceFile]
        );
        setActiveFileId(newSourceFile.id);
      };
      if (isBinary) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  const handleAddNewFile = () => {
    const fileName = prompt('New file name (e.g. custom.css, script.js, page.html):', 'template.html');
    if (!fileName) return;
    const fileType = fileTypeFor(fileName.split('.').pop()?.toLowerCase() || '');
    const newFile: SourceFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: fileName,
      content: fileType === 'html' ? '<div class="custom-component">\n  <h2>Custom Block</h2>\n</div>' : '',
      type: fileType,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    onOpenSource();
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (files.length <= 1) {
      alert('You must keep at least one source file.');
      return;
    }
    if (confirm(`Remove ${name}?`)) {
      const remaining = files.filter((f) => f.id !== id);
      setFiles(remaining);
      if (activeFileId === id && remaining.length > 0) setActiveFileId(remaining[0].id);
    }
  };

  return (
    <aside
      aria-label="Sources"
      className="island flex flex-col gap-3.5 p-4 min-h-0 overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-base">Sources</h2>
        <button
          type="button"
          onClick={handleAddNewFile}
          aria-label="New file"
          className="w-[34px] h-[34px] rounded-[10px] border border-line-strong bg-island text-ink flex items-center justify-center hover:bg-inset transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
        <ul className="grid grid-cols-2 gap-2">
          {files.map((file) => {
            const active = file.id === activeFileId;
            const isImage = file.type === 'image' && file.content.startsWith('data:image/');
            return (
              <li key={file.id} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFileId(file.id);
                    onOpenSource();
                  }}
                  className={`w-full flex flex-col gap-2 p-2.5 rounded-[14px] bg-inset text-left transition-shadow ${
                    active ? 'outline-2 outline-accent' : 'hover:outline-1 hover:outline-line-strong'
                  }`}
                >
                  {isImage ? (
                    <img src={file.content} alt="" className="block h-[52px] w-full self-stretch rounded-lg object-cover bg-line" />
                  ) : (
                    <span className="h-[52px] w-full self-stretch rounded-lg bg-island flex items-center justify-center font-mono text-[11px] text-muted">
                      {thumbLabel(file)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold truncate">{file.name}</span>
                    {file.isMain && <span className="text-[10px] font-semibold text-accent-ink">main</span>}
                  </span>
                </button>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    aria-label={`Remove ${file.name}`}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-island/90 text-muted hover:text-err flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`min-h-11 rounded-[14px] border-[1.5px] border-dashed text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
            isDragging ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line-strong text-muted hover:border-faint'
          }`}
        >
          <Upload className="w-4 h-4" />
          Drop or add files
        </button>
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="min-h-11 rounded-[14px] bg-inset text-[13px] font-semibold text-ink-2 flex items-center justify-center gap-2 hover:bg-line transition-colors"
        >
          <FolderUp className="w-4 h-4" />
          Upload site folder
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
          accept={ACCEPTED_EXTENSIONS.map((e) => '.' + e).join(',')}
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
          className="hidden"
          {...({ webkitdirectory: '', directory: '' } as any)}
        />
      </div>

      <div className="flex flex-col gap-1 pt-3.5 border-t border-canvas">
        <span className="text-xs text-muted">Output</span>
        <span className="font-display text-[26px] font-bold leading-tight">{outputFileCount} files</span>
        <button type="button" onClick={onOpenOutput} className="self-start text-[13px] font-semibold text-accent-ink hover:underline">
          Open file tree →
        </button>
      </div>
    </aside>
  );
};

interface SourceEditorProps extends SourceFilesProps {
  fontSize?: EditorFontSize;
}

/**
 * Center island "Source" view: editor for the active source file (or a preview for binaries).
 */
export const SourceEditor: React.FC<SourceEditorProps> = ({ files, setFiles, activeFileId, fontSize = 'md' }) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const isBinaryFile = !!activeFile?.content.startsWith('data:');

  const handleContentChange = (newContent: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFile?.id ? { ...f, content: newContent } : f)));
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!activeFile) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      handleContentChange(activeFile.content + '\n' + snippet);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    handleContentChange(activeFile.content.substring(0, start) + snippet + activeFile.content.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClass = fontSize === 'sm' ? 'text-xs leading-5' : fontSize === 'lg' ? 'text-base leading-7' : 'text-[13px] leading-6';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[13px] font-medium truncate">{activeFile?.path || activeFile?.name}</span>
          <span className="text-[11px] text-faint shrink-0">
            {isBinaryFile
              ? `${Math.round(((activeFile?.content.length || 0) * 3) / 4 / 1024).toLocaleString()} KB`
              : `${(activeFile?.content.length || 0).toLocaleString()} chars`}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="h-8 px-3 rounded-[10px] border border-line-strong bg-island text-xs font-semibold flex items-center gap-1.5 hover:bg-inset transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {isBinaryFile ? (
        <div className="flex-1 rounded-2xl border border-line bg-inset flex flex-col items-center justify-center gap-3 p-6 text-center">
          {activeFile?.type === 'image' && (
            <img
              src={activeFile.content}
              alt={activeFile.name}
              className="max-w-full max-h-[50vh] object-contain rounded-xl border border-line bg-[repeating-conic-gradient(#E3E5EA_0%_25%,#F4F5F8_0%_50%)] bg-[length:16px_16px]"
            />
          )}
          <p className="text-xs text-muted max-w-sm">
            Exported as <code className="text-accent-ink">assets/…/{activeFile?.name}</code>. References in HTML and CSS are
            rewritten to <code className="text-accent-ink">get_template_directory_uri()</code>.
          </p>
        </div>
      ) : (
        <>
          <QuickSnippetToolbar onInsertSnippet={handleInsertSnippet} />
          <textarea
            id="source-code-editor"
            ref={textareaRef}
            value={activeFile?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            aria-label={`Source of ${activeFile?.name}`}
            className={`flex-1 min-h-[320px] w-full mt-2 bg-inset text-ink font-mono p-4 rounded-2xl border border-line focus:border-accent/60 outline-none resize-none ${sizeClass}`}
            spellCheck={false}
            placeholder={`Paste your ${activeFile?.type.toUpperCase()} markup here...`}
          />
        </>
      )}
    </div>
  );
};
