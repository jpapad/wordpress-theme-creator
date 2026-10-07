import {
  ConversionOptions,
  ConversionResult,
  ConversionStats,
  PlaygroundBlueprint,
  SourceFile,
  VisualTagBinding,
  WordPressThemeFile,
  WordPressThemeMeta,
} from '../../types';
import { validateWordPressTheme, computeThemeScore } from '../validator';
import { generateElementorIntegrationFiles } from '../elementorGenerator';
import { generateCptAndTaxonomyFiles } from '../cptTaxonomyGenerator';
import { generateGutenbergBlockFiles } from '../gutenbergBlockGenerator';
import { generateDemoContentFiles } from '../demoContentGenerator';
import { generateAssetOptimizerPhp, generatePotFile } from '../i18nGenerator';
import { sanitizeSlug } from './php';
import { parseHtmlStructure, parseOptionsFrom, rewriteCssUrls, themeAssetPath, isExternalUrl } from './parser';
import { generateFunctionsPhp } from './functionsPhp';
import { generateHeaderPhp, generateFooterPhp } from './layout';
import {
  generateTemplatePartContent,
  generateTemplatePartContentNone,
  generateIndexPhp,
  generateSinglePhp,
  generatePagePhp,
  generateCustomPageTemplate,
  generateFrontPagePhp,
  generateArchivePhp,
  generateSidebarPhp,
  generate404Php,
} from './templates';
import {
  generateWooCommercePhp,
  generateWooCommerceArchiveProduct,
  generateWooCommerceSingleProduct,
} from './woocommerce';
import { generateHeroBlockPattern, generateFeaturesBlockPattern } from './patterns';
import { generateStyleCss, generateThemeJson } from './styles';
import { generateAcfJsonGroup } from './acf';
import { generateAcfFieldsFile } from './acfFields';
import { generatePlaygroundBlueprint } from './playground';

export * from './php';
export * from './parser';
export * from './functionsPhp';
export * from './layout';
export * from './templates';
export * from './woocommerce';
export * from './patterns';
export * from './styles';
export * from './acf';
export * from './playground';
export * from './editable';
export * from './acfFields';

/**
 * Main conversion coordinator: takes SourceFiles, Meta, and Options and produces full WP theme
 */
/**
 * Cleans single-line metadata so it cannot break the style.css header or PHP doc comments,
 * and forces a valid text domain slug.
 */
export function normalizeMeta(meta: WordPressThemeMeta): WordPressThemeMeta {
  const line = (v: string | undefined) => (v || '').replace(/\*\//g, '').replace(/[\r\n]+/g, ' ').trim();
  return {
    ...meta,
    name: line(meta.name) || 'Custom Theme',
    themeUri: line(meta.themeUri),
    author: line(meta.author),
    authorUri: line(meta.authorUri),
    description: line(meta.description),
    version: line(meta.version) || '1.0.0',
    license: line(meta.license),
    licenseUri: line(meta.licenseUri),
    requiresPHP: line(meta.requiresPHP),
    requiresWP: line(meta.requiresWP),
    textDomain: sanitizeSlug(meta.textDomain || meta.name),
    tags: (meta.tags || []).map((t) => sanitizeSlug(t)).filter(Boolean),
  };
}

/**
 * Forces registration slugs (menus, sidebars, post types, taxonomies) into valid WordPress keys.
 */
export function normalizeOptions(options: ConversionOptions): ConversionOptions {
  // Post type / taxonomy keys: lowercase, digits, dashes, underscores, max 20 / 32 chars
  const key = (v: string, max: number) => (v || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, max) || 'item';
  return {
    ...options,
    menuLocations: (options.menuLocations || []).map((m) => ({ ...m, slug: key(m.slug, 64) })),
    widgetAreas: (options.widgetAreas || []).map((w) => ({ ...w, slug: key(w.slug, 64) })),
    customPostTypes: (options.customPostTypes || []).map((c) => ({
      ...c,
      slug: key(c.slug, 20),
      supports: (c.supports || []).map((s) => key(s, 32)),
      icon: (c.icon || '').replace(/[^a-z0-9-]/gi, ''),
    })),
    customTaxonomies: options.customTaxonomies?.map((t) => ({
      ...t,
      slug: key(t.slug, 32),
      postTypes: t.postTypes.map((p) => key(p, 20)),
    })),
  };
}

export function convertHtmlToWordPressTheme(
  files: SourceFile[],
  rawMeta: WordPressThemeMeta,
  rawOptions: ConversionOptions
): ConversionResult {
  const startTime = performance.now();
  const meta = normalizeMeta(rawMeta);
  const options = normalizeOptions(rawOptions);

  const htmlFiles = files.filter(f => f.type === 'html');
  const mainHtmlFile = htmlFiles.find(f => f.isMain) || htmlFiles.find(f => f.name === 'index.html') || htmlFiles[0] || { content: '<html><body><main><h1>Hello World</h1></main></body></html>', name: 'index.html', path: 'index.html', type: 'html' as const };
  // Prefer a file literally named style.css as the main stylesheet, otherwise the first CSS file
  const mainCssFile = files.find(f => f.type === 'css' && f.name === 'style.css') || files.find(f => f.type === 'css');

  const rawHtml = mainHtmlFile.content;
  const parsed = parseHtmlStructure(rawHtml, parseOptionsFrom(options, meta.textDomain, mainHtmlFile.name, true));
  // Editable sections of every converted page (ACF field groups / Elementor widgets)
  const editableSections = [...parsed.sections];
  const rawCss = [
    rewriteCssUrls(mainCssFile?.content || 'body { font-family: sans-serif; }', 'root'),
    ...parsed.inlineStyles.map((css) => `/* Inline styles from ${mainHtmlFile.name} */\n${css}`),
  ].join('\n\n');

  // Inline <script> blocks become a real enqueued asset
  const assetFiles = files.filter((f) => f !== mainCssFile && f.type !== 'html');
  if (parsed.inlineScripts.length > 0) {
    assetFiles.push({
      id: 'inline-scripts',
      name: 'theme-inline.js',
      path: 'theme-inline.js',
      type: 'javascript',
      content: parsed.inlineScripts.join('\n\n;\n\n'),
    });
  }

  const themeFiles: WordPressThemeFile[] = [];

  // 1. style.css (Required)
  themeFiles.push({
    path: 'style.css',
    name: 'style.css',
    content: generateStyleCss(meta, rawCss, options),
    language: 'css',
    purpose: 'Primary stylesheet, theme metadata registration & custom UI tokens',
    isCore: true,
  });

  // 2. functions.php (Required)
  themeFiles.push({
    path: 'functions.php',
    name: 'functions.php',
    content: generateFunctionsPhp(meta, options, parsed, assetFiles),
    language: 'php',
    purpose: 'Theme initialization, hook declarations, enqueued scripts & styles, CPTs, and sidebars',
    isCore: true,
  });

  // 3. header.php
  themeFiles.push({
    path: 'header.php',
    name: 'header.php',
    content: generateHeaderPhp(meta, parsed, options),
    language: 'php',
    purpose: 'Document head, wp_head(), body open, site branding, and primary navigation',
    isCore: true,
  });

  // 4. footer.php
  themeFiles.push({
    path: 'footer.php',
    name: 'footer.php',
    content: generateFooterPhp(meta, parsed),
    language: 'php',
    purpose: 'Colophon, dynamic copyright, footer navigation, and wp_footer()',
    isCore: true,
  });

  // 5. index.php (Required)
  themeFiles.push({
    path: 'index.php',
    name: 'index.php',
    content: generateIndexPhp(meta),
    language: 'php',
    purpose: 'Fallback template hierarchy file with standard WordPress post loop',
    isCore: true,
  });

  // 5b. front-page.php: the actual landing page content of the main HTML file
  if (parsed.mainHtml) {
    themeFiles.push({
      path: 'front-page.php',
      name: 'front-page.php',
      content: generateFrontPagePhp(meta, parsed, options),
      language: 'php',
      purpose: `Site front page converted from ${mainHtmlFile.name} (hero, sections, CTAs)`,
      isCore: true,
    });
  }

  // 6. single.php
  const singleHtmlFile = htmlFiles.find(f => f.name === 'single.html' || f.name === 'single-post.html' || f.templateType === 'single');
  themeFiles.push({
    path: 'single.php',
    name: 'single.php',
    content: singleHtmlFile ? generateCustomPageTemplate(singleHtmlFile, meta, options, false) : generateSinglePhp(meta),
    language: 'php',
    purpose: 'Template for individual blog posts and full post details',
    isCore: true,
  });

  // 7. page.php
  themeFiles.push({
    path: 'page.php',
    name: 'page.php',
    content: generatePagePhp(meta),
    language: 'php',
    purpose: 'Template for standard WordPress static pages',
    isCore: true,
  });

  // 8. archive.php
  const archiveHtmlFile = htmlFiles.find(f => f.name === 'archive.html' || f.templateType === 'archive');
  themeFiles.push({
    path: 'archive.php',
    name: 'archive.php',
    content: archiveHtmlFile ? generateCustomPageTemplate(archiveHtmlFile, meta, options, false) : generateArchivePhp(meta),
    language: 'php',
    purpose: 'Template for category, tag, author, and date archives',
    isCore: true,
  });

  // 9. sidebar.php
  themeFiles.push({
    path: 'sidebar.php',
    name: 'sidebar.php',
    content: generateSidebarPhp(meta, options),
    language: 'php',
    purpose: 'Dynamic widget container template partial',
    isCore: true,
  });

  // 10. 404.php
  const notFoundHtmlFile = htmlFiles.find(f => f.name === '404.html' || f.templateType === '404');
  themeFiles.push({
    path: '404.php',
    name: '404.php',
    content: notFoundHtmlFile ? generateCustomPageTemplate(notFoundHtmlFile, meta, options, false) : generate404Php(meta),
    language: 'php',
    purpose: '404 Not Found error page template with search form',
    isCore: false,
  });

  // 11. Multi-Page Importer: Process all additional HTML files (e.g. about.html, contact.html, pricing.html)
  let customPagesCount = 0;
  htmlFiles.forEach((htmlFile) => {
    // Skip main index or special reserved files handled above
    if (htmlFile === mainHtmlFile || htmlFile.isMain || htmlFile.name === 'index.html' || htmlFile === singleHtmlFile || htmlFile === archiveHtmlFile || htmlFile === notFoundHtmlFile) {
      return;
    }

    const baseSlug = htmlFile.name.replace(/\.html?$/i, '');
    const cleanSlug = sanitizeSlug(baseSlug);
    const pageParsed = parseHtmlStructure(htmlFile.content, parseOptionsFrom(options, meta.textDomain, htmlFile.name));
    editableSections.push(...pageParsed.sections);

    // Create dedicated page template: page-{slug}.php
    themeFiles.push({
      path: `page-${cleanSlug}.php`,
      name: `page-${cleanSlug}.php`,
      content: generateCustomPageTemplate(htmlFile, meta, options, false, pageParsed),
      language: 'php',
      purpose: `Dedicated WordPress template for page "${baseSlug}"`,
      isCore: false,
    });

    // Also create custom selectable template in templates/
    themeFiles.push({
      path: `templates/template-${cleanSlug}.php`,
      name: `template-${cleanSlug}.php`,
      folder: 'templates',
      content: generateCustomPageTemplate(htmlFile, meta, options, true, pageParsed),
      language: 'php',
      purpose: `Custom Page Template selectable in WP Page Attributes`,
      isCore: false,
    });

    customPagesCount++;
  });

  // functions.php includes inc/acf-fields.php only when some page has editable sections
  const functionsFile = themeFiles.find((f) => f.path === 'functions.php')!;
  functionsFile.content = generateFunctionsPhp(meta, options, parsed, assetFiles, editableSections.length > 0);

  // 12. template-parts/content.php & content-none.php
  themeFiles.push({
    path: 'template-parts/content.php',
    name: 'content.php',
    folder: 'template-parts',
    content: generateTemplatePartContent(meta),
    language: 'php',
    purpose: 'Modular post card template partial for loops',
    isCore: false,
  });

  themeFiles.push({
    path: 'template-parts/content-none.php',
    name: 'content-none.php',
    folder: 'template-parts',
    content: generateTemplatePartContentNone(meta),
    language: 'php',
    purpose: 'Fallback partial displayed when query yields no results',
    isCore: false,
  });

  // 13. WooCommerce Ready Suite Files
  if (options.enableWooCommerce) {
    themeFiles.push({
      path: 'woocommerce.php',
      name: 'woocommerce.php',
      content: generateWooCommercePhp(meta),
      language: 'php',
      purpose: 'WooCommerce default container wrapper template',
      isCore: false,
    });

    themeFiles.push({
      path: 'woocommerce/archive-product.php',
      name: 'archive-product.php',
      folder: 'woocommerce',
      content: generateWooCommerceArchiveProduct(meta),
      language: 'php',
      purpose: 'WooCommerce main catalog / shop page template',
      isCore: false,
    });

    themeFiles.push({
      path: 'woocommerce/single-product.php',
      name: 'single-product.php',
      folder: 'woocommerce',
      content: generateWooCommerceSingleProduct(meta),
      language: 'php',
      purpose: 'WooCommerce single product detail template',
      isCore: false,
    });
  }

  // 14. Gutenberg Block Patterns (patterns/)
  let blockPatternsCount = 0;
  if (options.enableBlockPatterns) {
    themeFiles.push({
      path: 'patterns/hero-banner.php',
      name: 'hero-banner.php',
      folder: 'patterns',
      content: generateHeroBlockPattern(meta),
      language: 'php',
      purpose: 'Gutenberg Block Pattern: Full-width Hero section with CTA',
      isCore: false,
    });

    themeFiles.push({
      path: 'patterns/features-grid.php',
      name: 'features-grid.php',
      folder: 'patterns',
      content: generateFeaturesBlockPattern(meta),
      language: 'php',
      purpose: 'Gutenberg Block Pattern: 3-column service & feature grid',
      isCore: false,
    });

    blockPatternsCount = 2;
  }

  // 15. theme.json (FSE Design Tokens)
  if (options.generateThemeJson || options.themeType === 'hybrid' || options.themeType === 'block') {
    themeFiles.push({
      path: 'theme.json',
      name: 'theme.json',
      content: generateThemeJson(meta, rawCss),
      language: 'json',
      purpose: 'Gutenberg Full Site Editing configuration and design tokens',
      isCore: false,
    });
  }

  // 16. WordPress Playground Blueprint (blueprint.json)
  const blueprint = generatePlaygroundBlueprint(meta, options);
  themeFiles.push({
    path: 'blueprint.json',
    name: 'blueprint.json',
    content: JSON.stringify(blueprint, null, 2),
    language: 'json',
    purpose: 'WordPress Playground (WebAssembly/Wasm) instant test blueprint configuration',
    isCore: false,
  });

  // 17. Advanced Custom Fields: section fields (PHP) + fields defined in Theme Settings (Local JSON)
  if (options.enableACFHelper && editableSections.length > 0) {
    themeFiles.push(generateAcfFieldsFile(meta, editableSections, mainHtmlFile.name));
  }
  if ((options.enableACFHelper || options.enableAcfJsonExport) && (options.customFields?.length ?? 0) > 0) {
    themeFiles.push({
      path: 'acf-json/group_theme_fields.json',
      name: 'group_theme_fields.json',
      folder: 'acf-json',
      content: generateAcfJsonGroup(meta, options),
      language: 'json',
      purpose: 'ACF Local JSON definition group for automatic field synchronization',
      isCore: false,
    });
  }

  // 18. Add extra CSS, JS and binary assets to /assets/ folder
  assetFiles.forEach((f) => {
    if (f.type === 'image' || f.type === 'other') {
      const target = themeAssetPath(f.name);
      if (!target || !f.content.startsWith('data:')) return;
      themeFiles.push({
        path: target,
        name: f.name,
        folder: target.slice(0, target.lastIndexOf('/')),
        content: f.content,
        language: 'binary',
        encoding: 'dataurl',
        purpose: 'Static asset referenced by the converted templates',
        isCore: false,
      });
    } else if (f.type === 'javascript') {
      themeFiles.push({
        path: `assets/js/${f.name}`,
        name: f.name,
        folder: 'assets/js',
        content: f.content,
        language: 'javascript',
        purpose: 'Custom JavaScript interactive bundle',
        isCore: false,
      });
    } else if (f.type === 'css') {
      themeFiles.push({
        path: `assets/css/${f.name}`,
        name: f.name,
        folder: 'assets/css',
        content: rewriteCssUrls(f.content, 'assets/css'),
        language: 'css',
        purpose: 'Additional component or vendor stylesheet',
        isCore: false,
      });
    }
  });

  // 19. Elementor Pro Theme Builder & Custom Widgets
  if (options.enableElementor) {
    themeFiles.push(...generateElementorIntegrationFiles(meta, editableSections, options.customElementorWidgets));
  }

  // 20. Custom Post Types, Taxonomies & Custom Single/Archive Templates
  const cptTaxFiles = generateCptAndTaxonomyFiles(meta, options.customPostTypes, options.customTaxonomies);
  themeFiles.push(...cptTaxFiles);

  // 21. Native WordPress 6.x Gutenberg Blocks (blocks/*)
  const gutenbergFiles = generateGutenbergBlockFiles(meta, options.gutenbergBlocks);
  themeFiles.push(...gutenbergFiles);

  // 22. One-Click Demo Content (WXR XML 1.2) & OCDI Config
  const demoFiles = generateDemoContentFiles(meta, files);
  themeFiles.push(...demoFiles);

  // 23. Asset Optimizer & Performance Enhancer
  themeFiles.push(generateAssetOptimizerPhp(meta));

  // 24. i18n GNU gettext Localization Template (.pot)
  themeFiles.push(generatePotFile(meta, themeFiles));

  // 25. README.md
  themeFiles.push({
    path: 'README.md',
    name: 'README.md',
    content: `# ${meta.name} WordPress Theme

**Version:** ${meta.version}  
**Author:** ${meta.author}  
**License:** ${meta.license}  

## Description
${meta.description}

## Installation Guide
1. In your WordPress Admin Dashboard, navigate to **Appearance > Themes**.
2. Click **Add New Theme**, then click **Upload Theme**.
3. Choose the exported \`${sanitizeSlug(meta.name)}.zip\` file and click **Install Now**.
4. Click **Activate**.

## Theme Capabilities & Integrations
- **Elementor Pro Theme Builder:** Full compatibility with Header, Footer, Single, and Archive location overrides. Includes custom Elementor widgets in \`inc/elementor-widgets/\`.
- **WordPress 6.x Gutenberg Blocks & FSE:** Native \`block.json\` custom blocks and \`theme.json\` design tokens.
- **Custom Post Types & Taxonomies:** Pre-registered in \`inc/cpt-and-taxonomies.php\` with dedicated single and archive templates.
- **One-Click Demo Import (OCDI):** Demo content in \`demo-data/content.xml\` with auto-configured menus and static front page.
- **Localization (i18n):** Complete gettext POT file in \`languages/${meta.textDomain || sanitizeSlug(meta.name)}.pot\`.
- **Title Tag & Featured Images:** Handled automatically by WordPress core (\`add_theme_support('title-tag')\`).
- **Custom Logo & Menus:** Configurable in **Appearance > Customize** and **Appearance > Menus**.
${options.enableWooCommerce ? '- **WooCommerce Ready:** Includes full shop archives, product zoom lightbox, and mini-cart AJAX updates.\n' : ''}
${options.enableBlockPatterns ? '- **Block Patterns:** Built-in Gutenberg block patterns in **patterns/**.\n' : ''}
${customPagesCount > 0 ? `- **Multi-Page Templates:** Includes ${customPagesCount} custom page templates.\n` : ''}

## WordPress Playground Test
Drag & drop \`blueprint.json\` directly into [WordPress Playground](https://playground.wordpress.net/) for instant live browser testing.
`,
    language: 'markdown',
    purpose: 'Theme documentation and setup guide for end users',
    isCore: false,
  });

  const validations = validateWordPressTheme(themeFiles, meta);

  const stats: ConversionStats = {
    filesCreated: themeFiles.length,
    phpHooksInjected: 14 + (options.enableWooCommerce ? 3 : 0) + (options.enableBlockPatterns ? 2 : 0),
    templateTagsUsed: 24 + customPagesCount * 4,
    assetsEnqueued: 1 + parsed.googleFonts.length + parsed.cssLinks.filter(isExternalUrl).length + parsed.jsScripts.filter((s) => isExternalUrl(s.src)).length + assetFiles.filter(f => f.type === 'javascript' || f.type === 'css').length,
    themeScore: computeThemeScore(validations),
    generationTimeMs: Math.round(performance.now() - startTime),
    blockPatternsCount,
    customPagesCount,
  };

  const warnings: string[] = [];
  if (!parsed.hasNav) {
    warnings.push('No semantic <nav> element found in source HTML. A standard WordPress menu fallback was generated.');
  }

  return {
    files: themeFiles,
    meta,
    options,
    stats,
    validations,
    warnings,
    editableSections: editableSections.map((s) => ({
      slug: s.slug,
      title: s.title,
      page: s.page,
      fields: s.fields.map((f) => ({ name: f.name, label: f.label, type: f.type })),
      repeatedItems: s.repeatedItems,
    })),
    summary: `Successfully generated a complete ${options.themeType} WordPress theme with ${themeFiles.length} files (including ${customPagesCount} custom page templates, ${blockPatternsCount} Gutenberg patterns${options.enableWooCommerce ? ', full WooCommerce E-Commerce suite' : ''}, and Playground blueprint.json).`,
    blueprint,
  };
}

