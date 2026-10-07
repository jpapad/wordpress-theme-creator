import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  FolderOpen, 
  Copy, 
  Check, 
  Search, 
  Edit3, 
  Save,
  Filter,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { WordPressThemeFile } from '../types';
import { EditorFontSize } from '../types';

interface ThemeFilesExplorerProps {
  files: WordPressThemeFile[];
  onUpdateFileContent: (path: string, content: string) => void;
  fontSize?: EditorFontSize;
}

export const ThemeFilesExplorer: React.FC<ThemeFilesExplorerProps> = ({
  files,
  onUpdateFileContent,
  fontSize = 'md',
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || 'functions.php');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'php' | 'css' | 'parts'>('all');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleSelectFile = (path: string) => {
    setSelectedFilePath(path);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (activeFile) {
      setEditedContent(activeFile.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeFile) {
      onUpdateFileContent(activeFile.path, editedContent);
      setIsEditing(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(isEditing ? editedContent : activeFile.content);
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

  // Group files by root vs folder & filter
  const filteredFiles = files.filter((f) => {
    const matchesSearch = 
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (fileFilter === 'php') return f.language === 'php';
    if (fileFilter === 'css') return f.language === 'css';
    if (fileFilter === 'parts') return f.folder === 'template-parts';
    return true;
  });

  // Group files by folder dynamically
  const folderGroups = React.useMemo(() => {
    const groups: { [key: string]: WordPressThemeFile[] } = {};
    filteredFiles.forEach((file) => {
      const folderKey = file.folder || 'Theme Root';
      if (!groups[folderKey]) {
        groups[folderKey] = [];
      }
      groups[folderKey].push(file);
    });
    return groups;
  }, [filteredFiles]);

  const getFileBadgeColor = (lang: string) => {
    switch (lang) {
      case 'php':
        return 'text-accent-ink bg-accent/10 border-accent/30';
      case 'css':
        return 'text-sky-700 bg-sky-500/10 border-sky-500/30';
      case 'javascript':
        return 'text-accent-ink bg-accent/10 border-accent/30';
      case 'json':
        return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30';
      case 'xml':
        return 'text-rose-700 bg-rose-500/10 border-rose-500/30';
      case 'pot':
        return 'text-cyan-700 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-ink-2 bg-inset border-line';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-inset text-ink overflow-hidden">
      {/* File Tree Explorer Column */}
      <div className="w-full md:w-64 bg-island border-r border-line flex flex-col shrink-0">
        {/* Search & Filter Header */}
        <div className="p-2.5 border-b border-line space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search WP files..."
              className="w-full bg-inset border border-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink-2 outline-none focus:border-accent/50 transition-colors shadow-inner"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFileFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                fileFilter === 'all'
                  ? 'bg-accent text-white font-bold'
                  : 'text-muted hover:text-ink bg-ink/[0.04]'
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setFileFilter('php')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                fileFilter === 'php'
                  ? 'bg-accent text-white font-bold'
                  : 'text-muted hover:text-ink bg-ink/[0.04]'
              }`}
            >
              PHP
            </button>
            <button
              onClick={() => setFileFilter('parts')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                fileFilter === 'parts'
                  ? 'bg-accent text-white font-bold'
                  : 'text-muted hover:text-ink bg-ink/[0.04]'
              }`}
            >
              Parts
            </button>
            <button
              onClick={() => setFileFilter('css')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                fileFilter === 'css'
                  ? 'bg-accent text-white font-bold'
                  : 'text-muted hover:text-ink bg-ink/[0.04]'
              }`}
            >
              CSS
            </button>
          </div>
        </div>

        {/* Directory Structure */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {(Object.entries(folderGroups) as [string, WordPressThemeFile[]][]).map(([folderName, folderFileList]) => (
            <div key={folderName}>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                {folderName === 'Theme Root' ? (
                  <FolderOpen className="w-3.5 h-3.5 text-accent-ink" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-accent-ink/80" />
                )}
                <span>{folderName} ({folderFileList.length})</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {folderFileList.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all duration-150 ${
                      file.path === selectedFilePath
                        ? 'bg-accent/10 text-accent-ink font-semibold border border-accent/30 shadow-sm'
                        : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${file.language === 'php' ? 'text-accent-ink' : 'text-muted'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase border font-mono ${getFileBadgeColor(file.language)}`}>
                      {file.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Viewer / Editor Area */}
      <div className="flex-1 flex flex-col bg-inset min-w-0">
        {/* File Header Bar */}
        <div className="bg-island border-b border-line px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
              <span>{activeFile?.path}</span>
            </div>
            <span className="text-ink-2 text-xs hidden sm:inline font-medium">&bull; {activeFile?.purpose}</span>
          </div>

          <div className="flex items-center gap-2">
            {activeFile?.encoding === 'dataurl' ? null : isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1 bg-accent hover:bg-accent text-white rounded-lg text-xs font-bold shadow-md shadow-accent/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3 py-1 bg-inset hover:bg-line text-ink-2 rounded-lg text-xs transition-all border border-line font-medium"
                title="Edit this WordPress file"
              >
                <Edit3 className="w-3.5 h-3.5 text-accent-ink" />
                <span>Edit File</span>
              </button>
            )}

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-inset hover:bg-line text-ink-2 rounded-lg text-xs transition-all border border-line font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 p-2.5 flex flex-col overflow-hidden">
          {activeFile?.encoding === 'dataurl' ? (
            <div className="w-full flex-1 bg-inset border border-line rounded-2xl flex items-center justify-center p-4">
              {activeFile.content.startsWith('data:image/') ? (
                <img src={activeFile.content} alt={activeFile.path} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs text-muted">Binary asset &middot; included in the ZIP export</span>
              )}
            </div>
          ) : isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={`w-full flex-1 bg-inset text-ink font-mono p-4 rounded-2xl border border-line focus:border-accent/50 outline-none resize-none selection:bg-accent/30 transition-colors shadow-inner ${getFontSizeClass()}`}
              spellCheck={false}
            />
          ) : (
            <div className="w-full flex-1 bg-inset border border-line rounded-2xl overflow-auto p-4 font-mono text-ink selection:bg-accent/30 shadow-inner">
              <pre className={`whitespace-pre ${getFontSizeClass()}`}>
                <code>{activeFile?.content}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
