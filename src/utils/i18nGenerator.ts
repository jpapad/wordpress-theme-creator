import { WordPressThemeFile, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from './converter';

/**
 * Generates a valid GNU gettext Portable Object Template (.pot) file
 */
export function generatePotFile(
  meta: WordPressThemeMeta,
  themeFiles: WordPressThemeFile[]
): WordPressThemeFile {
  const textDomain = meta.textDomain || sanitizeSlug(meta.name);
  const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '+0000');

  // Extract translatable strings from PHP files using regex
  const stringsMap = new Map<string, string[]>();
  const i18nRegex = /(?:__|esc_html__|esc_attr__|_e|_ex|_n)\(\s*['"](.*?)['"]\s*,\s*['"](.*?)['"]\s*\)/g;

  themeFiles.forEach((file) => {
    if (file.language === 'php') {
      let match;
      while ((match = i18nRegex.exec(file.content)) !== null) {
        const text = match[1];
        const domain = match[2];
        if (text && domain === textDomain) {
          if (!stringsMap.has(text)) {
            stringsMap.set(text, []);
          }
          stringsMap.get(text)?.push(file.path);
        }
      }
    }
  });

  // Default fallback strings if none extracted
  if (stringsMap.size === 0) {
    stringsMap.set('Primary Menu', ['functions.php']);
    stringsMap.set('Sidebar', ['functions.php']);
    stringsMap.set('Previous', ['index.php', 'archive.php']);
    stringsMap.set('Next', ['index.php', 'archive.php']);
    stringsMap.set('Read More', ['template-parts/content.php']);
    stringsMap.set('No posts found', ['template-parts/content-none.php']);
    stringsMap.set('Search Results for: %s', ['search.php']);
    stringsMap.set('Page not found', ['404.php']);
  }

  let potContent = `# Copyright (C) 2026 ${meta.author}
# This file is distributed under the ${meta.license}.
msgid ""
msgstr ""
"Project-Id-Version: ${meta.name} ${meta.version}\\n"
"Report-Msgid-Bugs-To: ${meta.authorUri}\\n"
"POT-Creation-Date: ${now}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"PO-Revision-Date: 2026-YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"X-Generator: HTML to WordPress Theme Studio\\n"
"X-Domain: ${textDomain}\\n"

`;

  stringsMap.forEach((paths, text) => {
    const uniquePaths = Array.from(new Set(paths)).join(', ');
    potContent += `#: ${uniquePaths}
msgid "${text.replace(/"/g, '\\"')}"
msgstr ""

`;
  });

  return {
    path: `languages/${textDomain}.pot`,
    name: `${textDomain}.pot`,
    folder: 'languages',
    content: potContent,
    language: 'markdown',
    purpose: 'Standard GNU gettext POT localization file for WPML / Polylang / Loco Translate',
    isCore: false,
  };
}

/**
 * Generates Asset Optimizer and Enqueue helper for fast performance
 */
export function generateAssetOptimizerPhp(meta: WordPressThemeMeta): WordPressThemeFile {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);

  const phpContent = `<?php
/**
 * Asset Optimizer & Performance Enhancer
 *
 * @package ${meta.name}
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add Preconnect hints for Google Fonts and CDNs
 */
function ${prefix}_resource_hints($urls, $relation_type) {
    if ('preconnect' === $relation_type) {
        $urls[] = array(
            'href'        => 'https://fonts.googleapis.com',
            'crossorigin' => 'anonymous',
        );
        $urls[] = array(
            'href'        => 'https://fonts.gstatic.com',
            'crossorigin' => 'anonymous',
        );
    }
    return $urls;
}
add_filter('wp_resource_hints', '${prefix}_resource_hints', 10, 2);

/**
 * Add defer attribute to non-critical scripts
 */
function ${prefix}_defer_scripts($tag, $handle, $src) {
    // List handles to defer
    $defer_handles = array('${prefix}-main', '${prefix}-custom', '${prefix}-app');

    if (in_array($handle, $defer_handles, true) && false === strpos($tag, 'defer')) {
        return str_replace('<script ', '<script defer ', $tag);
    }
    return $tag;
}
add_filter('script_loader_tag', '${prefix}_defer_scripts', 10, 3);
`;

  return {
    path: 'inc/asset-optimizer.php',
    name: 'asset-optimizer.php',
    folder: 'inc',
    content: phpContent,
    language: 'php',
    purpose: 'Google fonts preconnect and script defer optimizations',
    isCore: false,
  };
}
