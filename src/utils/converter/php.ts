import { WordPressThemeMeta } from '../../types';

/**
 * Sanitizes a string into a WordPress slug (theme folder, text domain, handles, block namespace).
 * Only lowercase letters, digits and single hyphens are kept.
 */
export function sanitizeSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'theme';
}

/**
 * Converts a string into a valid PHP identifier prefix (functions, classes, filters).
 * PHP identifiers cannot contain hyphens and cannot start with a digit.
 */
export function toPhpPrefix(str: string): string {
  const prefix = sanitizeSlug(str).replace(/-/g, '_');
  return /^[0-9]/.test(prefix) ? `theme_${prefix}` : prefix;
}

/**
 * Escapes a value for use inside a single-quoted PHP string literal.
 */
export function phpStr(value: unknown): string {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Makes a value safe to place inside a PHP / CSS block comment.
 */
export function commentSafe(value: unknown): string {
  return String(value ?? '').replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ');
}

/**
 * Returns the theme identifiers shared by all generators.
 * - slug: theme folder / handles / block namespace (hyphenated)
 * - prefix: PHP function/class prefix (underscored)
 * - textDomain: sanitized text domain
 */
export function themeIds(meta: WordPressThemeMeta) {
  const textDomain = sanitizeSlug(meta.textDomain || meta.name);
  return {
    slug: sanitizeSlug(meta.name || meta.textDomain),
    prefix: toPhpPrefix(meta.textDomain || meta.name),
    textDomain,
  };
}

/**
 * Returns a copy of meta whose values are safe to interpolate into generated PHP:
 * text domain is a valid slug and free text cannot break out of single-quoted strings.
 * Use for values that are placed inside '...' PHP literals.
 */
export function phpSafeMeta(meta: WordPressThemeMeta): WordPressThemeMeta {
  return {
    ...meta,
    name: phpStr(meta.name),
    author: phpStr(meta.author),
    description: phpStr(meta.description),
    textDomain: sanitizeSlug(meta.textDomain || meta.name),
  };
}
