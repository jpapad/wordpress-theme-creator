import { ValidationItem, WordPressThemeFile, WordPressThemeMeta } from '../types';
import { lintPhp, findDuplicateDeclarations, findMissingIncludes, PhpLintError } from './phpLint';

/**
 * Validates generated WordPress theme files against WordPress.org guidelines
 */
export function validateWordPressTheme(
  files: WordPressThemeFile[],
  meta: WordPressThemeMeta
): ValidationItem[] {
  const items: ValidationItem[] = [];

  const styleCss = files.find((f) => f.path === 'style.css')?.content || '';
  const functionsPhp = files.find((f) => f.path === 'functions.php')?.content || '';
  const headerPhp = files.find((f) => f.path === 'header.php')?.content || '';
  const footerPhp = files.find((f) => f.path === 'footer.php')?.content || '';
  const indexPhp = files.find((f) => f.path === 'index.php')?.content || '';
  const singlePhp = files.find((f) => f.path === 'single.php')?.content || '';

  // 1. Check style.css header comments
  if (styleCss.includes('Theme Name:') && styleCss.includes('Author:') && styleCss.includes('Text Domain:')) {
    items.push({
      id: 'core-style-headers',
      title: 'Theme Headers in style.css',
      category: 'core',
      status: 'pass',
      description: 'style.css contains required WordPress header comment block (Theme Name, Author, Text Domain, Version, License).',
    });
  } else {
    items.push({
      id: 'core-style-headers',
      title: 'Theme Headers in style.css',
      category: 'core',
      status: 'error',
      description: 'style.css is missing required WordPress header tags.',
      recommendation: 'Ensure Theme Name, Author, and Text Domain are defined in the header comment block.',
    });
  }

  // 2. Check wp_head() in header.php
  if (headerPhp.includes('wp_head()')) {
    items.push({
      id: 'hooks-wp-head',
      title: 'wp_head() Hook Present',
      category: 'hooks',
      status: 'pass',
      description: 'wp_head() is correctly placed immediately before </head> in header.php.',
    });
  } else {
    items.push({
      id: 'hooks-wp-head',
      title: 'wp_head() Hook Missing',
      category: 'hooks',
      status: 'error',
      description: 'wp_head() is required for WordPress plugins and scripts to work in the header.',
      recommendation: 'Add <?php wp_head(); ?> before </head> in header.php.',
    });
  }

  // 3. Check wp_footer() in footer.php
  if (footerPhp.includes('wp_footer()')) {
    items.push({
      id: 'hooks-wp-footer',
      title: 'wp_footer() Hook Present',
      category: 'hooks',
      status: 'pass',
      description: 'wp_footer() is correctly placed before </body> in footer.php.',
    });
  } else {
    items.push({
      id: 'hooks-wp-footer',
      title: 'wp_footer() Hook Missing',
      category: 'hooks',
      status: 'error',
      description: 'wp_footer() is required for admin bar and enqueued JavaScript.',
      recommendation: 'Add <?php wp_footer(); ?> before </body> in footer.php.',
    });
  }

  // 4. Check body_class() in header.php
  if (headerPhp.includes('body_class()')) {
    items.push({
      id: 'standards-body-class',
      title: 'body_class() Implemented',
      category: 'standards',
      status: 'pass',
      description: '<body <?php body_class(); ?>> allows WordPress and plugins to apply contextual CSS classes.',
    });
  } else {
    items.push({
      id: 'standards-body-class',
      title: 'body_class() Missing',
      category: 'standards',
      status: 'warning',
      description: 'body_class() is strongly recommended for standard WordPress page styling.',
      recommendation: 'Replace <body> with <body <?php body_class(); ?>> in header.php.',
    });
  }

  // 5. Check wp_body_open() in header.php
  if (headerPhp.includes('wp_body_open()')) {
    items.push({
      id: 'standards-body-open',
      title: 'wp_body_open() Implemented',
      category: 'standards',
      status: 'pass',
      description: 'wp_body_open() hook is present right after the <body> tag opening.',
    });
  } else {
    items.push({
      id: 'standards-body-open',
      title: 'wp_body_open() Missing',
      category: 'standards',
      status: 'warning',
      description: 'Modern WordPress standards recommend wp_body_open() immediately after <body>.',
    });
  }

  // 6. Check post_class() in index / loop
  const contentPhp = files.find((f) => f.path.includes('content.php'))?.content || '';
  if (contentPhp.includes('post_class(') || indexPhp.includes('post_class(')) {
    items.push({
      id: 'standards-post-class',
      title: 'post_class() Implemented',
      category: 'standards',
      status: 'pass',
      description: 'Post articles use post_class() for dynamic post IDs, sticky classes, and categories.',
    });
  } else {
    items.push({
      id: 'standards-post-class',
      title: 'post_class() Recommended',
      category: 'standards',
      status: 'warning',
      description: 'Post templates should use <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>.',
    });
  }

  // 7. Check wp_enqueue_scripts in functions.php
  if (functionsPhp.includes('wp_enqueue_scripts') && functionsPhp.includes('wp_enqueue_style')) {
    items.push({
      id: 'assets-enqueue-scripts',
      title: 'Standard Asset Enqueuing',
      category: 'assets',
      status: 'pass',
      description: 'Stylesheets and scripts are properly enqueued via wp_enqueue_scripts hook instead of hardcoded link/script tags.',
    });
  } else {
    items.push({
      id: 'assets-enqueue-scripts',
      title: 'Asset Enqueuing Issue',
      category: 'assets',
      status: 'error',
      description: 'functions.php should register and enqueue theme stylesheets using wp_enqueue_scripts.',
    });
  }

  // 8. Check text domain & internationalization
  if (functionsPhp.includes('load_theme_textdomain') && functionsPhp.includes(meta.textDomain)) {
    items.push({
      id: 'standards-textdomain',
      title: 'Translation Ready (i18n)',
      category: 'standards',
      status: 'pass',
      description: `Theme loads text domain '${meta.textDomain}' with load_theme_textdomain() and uses esc_html__() wrappers.`,
    });
  } else {
    items.push({
      id: 'standards-textdomain',
      title: 'Translation Setup Missing',
      category: 'standards',
      status: 'warning',
      description: 'load_theme_textdomain() is recommended for internationalization.',
    });
  }

  // 9. Check Security: Direct Access Prevention
  if (functionsPhp.includes("defined('ABSPATH')")) {
    items.push({
      id: 'security-direct-access',
      title: 'Direct Script Access Protection',
      category: 'security',
      status: 'pass',
      description: "Direct execution guard `if (!defined('ABSPATH')) exit;` prevents unauthorized PHP file execution.",
    });
  } else {
    items.push({
      id: 'security-direct-access',
      title: 'Direct Access Guard Missing',
      category: 'security',
      status: 'warning',
      description: 'Consider adding `if (!defined("ABSPATH")) exit;` at the top of PHP files.',
    });
  }

  // 10. Check Navigation & Fallbacks
  if (headerPhp.includes('wp_nav_menu') || functionsPhp.includes('register_nav_menus')) {
    items.push({
      id: 'core-nav-menus',
      title: 'Dynamic Nav Menus Registered',
      category: 'core',
      status: 'pass',
      description: 'Theme registers navigation menus with register_nav_menus() and invokes them in header.php.',
    });
  }

  // 11. Check WooCommerce Theme Support
  if (functionsPhp.includes("add_theme_support('woocommerce')")) {
    const hasWooTemplate = files.some(f => f.path.startsWith('woocommerce'));
    items.push({
      id: 'woocommerce-integration',
      title: 'WooCommerce E-Commerce Support',
      category: 'woocommerce',
      status: hasWooTemplate ? 'pass' : 'warning',
      description: hasWooTemplate 
        ? 'Full WooCommerce support configured with archive/single product templates and gallery zoom.'
        : 'WooCommerce theme support declared in functions.php.',
    });
  }

  // 12. Check Gutenberg Block Patterns
  const patternFiles = files.filter(f => f.path.startsWith('patterns/'));
  if (patternFiles.length > 0) {
    items.push({
      id: 'blocks-patterns',
      title: `${patternFiles.length} Gutenberg Block Patterns Ready`,
      category: 'blocks',
      status: 'pass',
      description: `Discovered ${patternFiles.length} block pattern template(s) in patterns/ folder for full site editing.`,
    });
  }

  // 13. Check theme.json
  const themeJson = files.find(f => f.path === 'theme.json');
  if (themeJson) {
    items.push({
      id: 'blocks-theme-json',
      title: 'FSE theme.json Design Tokens',
      category: 'blocks',
      status: 'pass',
      description: 'theme.json schema v3 configuration provides fluid typography and color tokens for the WordPress block editor.',
    });
  }

  // 14. Real PHP syntax check of every generated PHP file
  const phpFiles = files.filter((f) => f.language === 'php');
  const syntaxErrors = phpFiles.map((f) => lintPhp(f.path, f.content)).filter((e): e is PhpLintError => !!e);
  items.push({
    id: 'security-php-syntax',
    title: syntaxErrors.length ? `PHP Syntax Errors (${syntaxErrors.length})` : `PHP Syntax Valid (${phpFiles.length} files)`,
    category: 'standards',
    status: syntaxErrors.length ? 'error' : 'pass',
    description: syntaxErrors.length
      ? 'These files would cause a fatal error (white screen) when WordPress loads them.'
      : 'Every generated PHP file was parsed successfully by a PHP 8 parser.',
    codeSnippet: syntaxErrors.length ? syntaxErrors.map((e) => `${e.path}: ${e.message}`).join('\n') : undefined,
    recommendation: syntaxErrors.length ? 'Fix the reported lines in the file explorer, or adjust the source HTML / theme settings and convert again.' : undefined,
  });

  // 15. Duplicate function / class declarations ("Cannot redeclare" fatal error)
  const duplicates = findDuplicateDeclarations(files);
  if (duplicates.length) {
    items.push({
      id: 'core-duplicate-declarations',
      title: `Duplicate PHP Declarations (${duplicates.length})`,
      category: 'core',
      status: 'error',
      description: 'The same function or class is declared more than once, which is a fatal error in PHP.',
      codeSnippet: duplicates.join('\n'),
      recommendation: 'Rename one of the declarations or wrap it in function_exists().',
    });
  }

  // 16. require/include targets exist
  const missingIncludes = findMissingIncludes(files);
  if (missingIncludes.length) {
    items.push({
      id: 'core-missing-includes',
      title: `Missing Included Files (${missingIncludes.length})`,
      category: 'core',
      status: 'error',
      description: 'A required file is not part of the theme; require_once would trigger a fatal error.',
      codeSnippet: missingIncludes.join('\n'),
    });
  }

  // 17. JSON files are valid
  const badJson = files
    .filter((f) => f.path.endsWith('.json'))
    .filter((f) => {
      try {
        JSON.parse(f.content);
        return false;
      } catch {
        return true;
      }
    });
  if (badJson.length) {
    items.push({
      id: 'standards-json',
      title: `Invalid JSON (${badJson.length})`,
      category: 'standards',
      status: 'error',
      description: 'These JSON files cannot be parsed by WordPress.',
      codeSnippet: badJson.map((f) => f.path).join('\n'),
    });
  }

  return items;
}

/**
 * Theme score derived from the validation results (errors weigh more than warnings).
 */
export function computeThemeScore(items: ValidationItem[]): number {
  const errors = items.filter((i) => i.status === 'error').length;
  const warnings = items.filter((i) => i.status === 'warning').length;
  return Math.max(0, 100 - errors * 15 - warnings * 4);
}
