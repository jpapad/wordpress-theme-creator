import { Engine } from 'php-parser';
import { WordPressThemeFile } from '../types';

export interface PhpLintError {
  path: string;
  message: string;
  line?: number;
}

const engine = new Engine({
  parser: { php8: true, suppressErrors: false, extractDoc: false },
  ast: { withPositions: false },
});

/**
 * Parses a PHP file and returns its syntax error, if any.
 */
export function lintPhp(path: string, code: string): PhpLintError | null {
  try {
    engine.parseCode(code, path);
    return null;
  } catch (err: any) {
    return { path, message: String(err?.message || err), line: err?.lineNumber };
  }
}

/**
 * Finds functions / classes declared in more than one theme file
 * (a fatal "Cannot redeclare" error at runtime).
 */
export function findDuplicateDeclarations(files: WordPressThemeFile[]): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const file of files) {
    if (file.language !== 'php') continue;
    // Top-level declarations only (column 0); skip those guarded by function_exists()
    const code = file.content.replace(/if\s*\(\s*!\s*function_exists\([^)]*\)\s*\)\s*:[\s\S]*?endif;/g, '');
    for (const m of code.matchAll(/^(?:final\s+|abstract\s+)?(function|class)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)) {
      const key = `${m[1]} ${m[2].toLowerCase()}`;
      const previous = seen.get(key);
      if (previous) duplicates.push(`${m[1]} ${m[2]}() in ${previous} and ${file.path}`);
      else seen.set(key, file.path);
    }
  }
  return duplicates;
}

/**
 * Finds require/include calls pointing at theme files that are not generated.
 */
export function findMissingIncludes(files: WordPressThemeFile[]): string[] {
  const paths = new Set(files.map((f) => f.path));
  const missing: string[] = [];
  for (const file of files) {
    if (file.language !== 'php') continue;
    for (const m of file.content.matchAll(/(?:require|include)(?:_once)?\s*\(?\s*get_(?:template|stylesheet)_directory\(\)\s*\.\s*'\/([^']+)'/g)) {
      if (!paths.has(m[1])) missing.push(`${file.path} → ${m[1]}`);
    }
  }
  return missing;
}
