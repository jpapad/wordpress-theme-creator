import { ConversionOptions, SourceFile, WordPressThemeMeta } from '../types';

const STORAGE_KEY = 'wp-theme-studio:workspace:v1';

export interface Workspace {
  files: SourceFile[];
  activeFileId: string;
  meta: WordPressThemeMeta;
  options: ConversionOptions;
}

/**
 * Loads the autosaved workspace, or null when there is none / it is unreadable.
 */
export function loadWorkspace(): Workspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Workspace;
    if (!Array.isArray(data.files) || data.files.length === 0 || !data.meta || !data.options) return null;
    // Binary files dropped by a quota-limited save cannot be restored
    data.files = data.files.filter((f) => f.type !== 'image' || f.content);
    return data;
  } catch {
    return null;
  }
}

/**
 * Saves the workspace. Falls back to saving without binary assets (images, fonts)
 * when the browser storage quota (~5 MB) is exceeded.
 */
export function saveWorkspace(workspace: Workspace): 'saved' | 'without-binaries' | 'failed' {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return 'saved';
  } catch {
    try {
      const textOnly = {
        ...workspace,
        files: workspace.files.filter((f) => !f.content.startsWith('data:')),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
      return 'without-binaries';
    } catch {
      return 'failed';
    }
  }
}

export function clearWorkspace() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
