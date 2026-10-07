import { ConversionOptions, VisualTagBinding } from '../../types';
import { phpStr, sanitizeSlug, toPhpPrefix } from './php';
import { EditableSection, extractEditableSections, renderAcf, renderStatic } from './editable';

/**
 * Result of parsing a source HTML page. All *Html fields are PHP-ready template markup:
 * static asset paths, internal links, navigation, logo, copyright and visual bindings
 * have already been converted to WordPress template tags.
 */
export interface ParsedHtmlStructure {
  headerHtml: string;
  footerHtml: string;
  /** Body content without header, footer and scripts (used for front-page.php / page templates) */
  mainHtml: string;
  googleFonts: string[];
  cssLinks: string[];
  jsScripts: { src: string; inHead: boolean }[];
  /** Contents of inline <style> blocks */
  inlineStyles: string[];
  /** Contents of inline <script> blocks (without src, excluding JSON / templates) */
  inlineScripts: string[];
  hasNav: boolean;
  /** Sections with editable fields (only when ParseOptions.editable is set) */
  sections: EditableSection[];
}

export interface ParseOptions {
  textDomain?: string;
  bindings?: VisualTagBinding[];
  menuLocation?: string;
  enableWooCommerce?: boolean;
  /**
   * Extract editable fields from <section> elements. With acfPrefix the page markup reads
   * them through `<prefix>_field()` (ACF), otherwise the original content stays static.
   */
  editable?: {
    page: string;
    /** Prefix for section slugs of secondary pages ('' for the main page) */
    pagePrefix: string;
    acfPrefix?: string;
  };
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp)$/i;
const FONT_EXT = /\.(woff2?|ttf|otf|eot)$/i;
const MEDIA_EXT = /\.(mp4|webm|ogg|mp3|wav|pdf)$/i;

export function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url.trim());
}

function isSpecialUrl(url: string): boolean {
  return /^(data:|blob:|mailto:|tel:|javascript:|#|\?|<\?php)/i.test(url.trim()) || url.trim() === '';
}

function stripQuery(url: string): string {
  return url.split(/[?#]/)[0];
}

function basename(url: string): string {
  const clean = stripQuery(url).replace(/\\/g, '/');
  return clean.substring(clean.lastIndexOf('/') + 1);
}

/**
 * Theme-relative folder for a static asset, based on its extension.
 */
export function themeAssetPath(url: string): string | null {
  const name = basename(url);
  if (!name) return null;
  if (IMAGE_EXT.test(name)) return `assets/images/${name}`;
  if (FONT_EXT.test(name)) return `assets/fonts/${name}`;
  if (MEDIA_EXT.test(name)) return `assets/media/${name}`;
  return null;
}

/**
 * Rewrites relative url(...) references inside CSS to the theme asset folders.
 * @param cssLocation 'root' for style.css, 'assets/css' for enqueued stylesheets
 */
export function rewriteCssUrls(css: string, cssLocation: 'root' | 'assets/css' = 'root'): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
    if (isExternalUrl(url) || isSpecialUrl(url)) return match;
    const target = themeAssetPath(url);
    if (!target) return match;
    const rel = cssLocation === 'root' ? target : `../${target.replace(/^assets\//, '')}`;
    return `url(${quote}${rel}${quote})`;
  });
}

/**
 * Collects PHP snippets behind plain alphanumeric tokens so they survive DOM serialization.
 */
class PhpTokens {
  private snippets: string[] = [];
  private id = Math.random().toString(36).slice(2, 8);

  /** Matches any token of this store (non-global, safe for .test) */
  get pattern(): RegExp {
    return new RegExp(`wptok${this.id}x\\d+x`);
  }

  add(php: string): string {
    this.snippets.push(php);
    return `wptok${this.id}x${this.snippets.length - 1}x`;
  }

  restore(html: string): string {
    const re = new RegExp(`wptok${this.id}x(\\d+)x`, 'g');
    // Repeat in case snippets contain tokens themselves (e.g. nav fallback markup)
    let out = html;
    for (let i = 0; i < 3 && re.test(out); i++) {
      out = out.replace(re, (_, n) => this.snippets[Number(n)]);
    }
    return out;
  }
}

function themeUriPhp(path: string): string {
  return `<?php echo esc_url(get_template_directory_uri() . '/${phpStr(path)}'); ?>`;
}

/**
 * PHP expression for an internal link: root-relative paths and .html pages become home_url().
 */
function internalLinkExpr(url: string): string | null {
  const clean = stripQuery(url);
  const hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
  const withHash = (expr: string) => (hash ? `${expr} . '${phpStr(hash)}'` : expr);
  // Root-relative links (/about) must respect WordPress installs in a subdirectory
  if (clean.startsWith('/') && !clean.startsWith('//') && !/\.[a-z0-9]+$/i.test(clean)) {
    return withHash(`home_url('${phpStr(clean)}')`);
  }
  const name = basename(clean);
  if (!/\.html?$/i.test(name)) return null;
  const slug = name.replace(/\.html?$/i, '');
  const path = slug === 'index' || slug === 'home' ? '/' : `/${sanitizeSlug(slug)}/`;
  return withHash(`home_url('${path}')`);
}

function internalLinkPhp(url: string): string | null {
  const expr = internalLinkExpr(url);
  return expr ? `<?php echo esc_url(${expr}); ?>` : null;
}

/**
 * Converts relative asset URLs and internal .html links within an element tree.
 */
function rewriteUrls(root: Element, tokens: PhpTokens) {
  const urlAttrs = ['src', 'href', 'poster', 'data-src', 'data-bg', 'data-background'];
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of urlAttrs) {
      const value = el.getAttribute(attr);
      if (!value || isExternalUrl(value) || isSpecialUrl(value)) continue;
      // Stylesheets / scripts are enqueued separately
      if (el.tagName === 'LINK' || el.tagName === 'SCRIPT') continue;
      const asset = themeAssetPath(value);
      if (asset) {
        el.setAttribute(attr, tokens.add(themeUriPhp(asset)));
        continue;
      }
      if (attr === 'href') {
        const link = internalLinkPhp(value);
        if (link) el.setAttribute(attr, tokens.add(link));
      }
    }

    const srcset = el.getAttribute('srcset');
    if (srcset) {
      const rewritten = srcset
        .split(',')
        .map((part) => {
          const [url, descriptor] = part.trim().split(/\s+/, 2);
          if (!url || isExternalUrl(url) || isSpecialUrl(url)) return part.trim();
          const asset = themeAssetPath(url);
          return asset ? `${tokens.add(themeUriPhp(asset))}${descriptor ? ' ' + descriptor : ''}` : part.trim();
        })
        .join(', ');
      el.setAttribute('srcset', rewritten);
    }

    const style = el.getAttribute('style');
    if (style && /url\(/i.test(style)) {
      el.setAttribute(
        'style',
        style.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
          if (isExternalUrl(url) || isSpecialUrl(url)) return match;
          const asset = themeAssetPath(url);
          return asset ? `url(${quote}${tokens.add(themeUriPhp(asset))}${quote})` : match;
        })
      );
    }
  });
}

function bindingPhp(binding: VisualTagBinding): string {
  switch (binding.tagType) {
    case 'the_title':
      return `<?php the_title(); ?>`;
    case 'the_content':
      return `<?php the_content(); ?>`;
    case 'the_excerpt':
      return `<?php the_excerpt(); ?>`;
    case 'the_post_thumbnail':
      return `<?php the_post_thumbnail('large'); ?>`;
    case 'the_permalink':
      return `<?php the_permalink(); ?>`;
    case 'the_author':
      return `<?php the_author_posts_link(); ?>`;
    case 'the_date':
      return `<?php echo esc_html(get_the_date()); ?>`;
    case 'bloginfo_name':
      return `<?php bloginfo('name'); ?>`;
    case 'bloginfo_description':
      return `<?php bloginfo('description'); ?>`;
    case 'wp_nav_menu':
      return `<?php wp_nav_menu(array('theme_location' => '${phpStr(binding.menuLocationSlug || 'primary-menu')}')); ?>`;
    case 'dynamic_sidebar':
      return `<?php dynamic_sidebar('${phpStr(binding.widgetAreaSlug || 'main-sidebar')}'); ?>`;
    case 'custom_field': {
      // ACF when active (formats values), raw post meta otherwise
      const key = phpStr(binding.customFieldName || 'custom_field');
      return `<?php echo esc_html(function_exists('get_field') ? (string) get_field('${key}') : get_post_meta(get_the_ID(), '${key}', true)); ?>`;
    }
    case 'shortcode':
      return `<?php echo do_shortcode('${phpStr(binding.customSnippet || '[custom_shortcode]')}'); ?>`;
    case 'woocommerce_price':
      return `<?php global $product; if (is_a($product, 'WC_Product')) { echo wp_kses_post($product->get_price_html()); } ?>`;
    case 'woocommerce_add_to_cart':
      return `<?php woocommerce_template_loop_add_to_cart(); ?>`;
    default:
      return binding.customSnippet || '';
  }
}

function textNodes(root: Node): Text[] {
  const doc = root.ownerDocument || (root as Document);
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    const parent = n.parentElement;
    if (!parent || !['SCRIPT', 'STYLE'].includes(parent.tagName)) nodes.push(n as Text);
    n = walker.nextNode();
  }
  return nodes;
}

/**
 * Applies visual tag bindings to every matching text occurrence inside the tree.
 */
function applyBindingsToTree(root: Node, bindings: VisualTagBinding[], tokens: PhpTokens) {
  for (const binding of bindings) {
    const needle = binding.originalText?.trim();
    if (!needle) continue;
    const token = tokens.add(bindingPhp(binding));
    for (const node of textNodes(root)) {
      const text = node.textContent || '';
      if (text.includes(needle)) node.textContent = text.split(needle).join(token);
    }
  }
}

/**
 * Applies visual tag bindings to an HTML string (all occurrences).
 */
export function applyVisualBindings(html: string, bindings?: VisualTagBinding[]): string {
  if (!bindings || bindings.length === 0) return html;
  const tokens = new PhpTokens();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  applyBindingsToTree(doc.documentElement, bindings, tokens);
  const out = /<html[\s>]/i.test(html) ? doc.documentElement.outerHTML : doc.body.innerHTML;
  return tokens.restore(out);
}

/**
 * Picks the first element matching one of the selectors, skipping matches nested in
 * content (e.g. an <header> inside an <article> card).
 */
function pickLayoutElement(doc: Document, selectors: string[]): Element | null {
  for (const selector of selectors) {
    for (const el of Array.from(doc.querySelectorAll(selector))) {
      if (!el.parentElement?.closest('article, .card, .post, .entry, section main, aside')) return el;
    }
  }
  return null;
}

const HEADER_SELECTORS = ['body > header', '#masthead', '.site-header', 'header', '#header', '.header'];
const FOOTER_SELECTORS = ['body > footer', '#colophon', '.site-footer', 'footer', '#footer', '.footer'];
const NAV_SELECTORS = ['nav', '.main-navigation', '.navbar-nav', '.main-menu', '.navigation', '.nav-menu', '.menu'];
const LOGO_SELECTORS = ['.site-branding a', 'a.logo', '.logo a', 'a.navbar-brand', 'a.brand', 'a[class*="logo"]', '.site-title a', 'a.site-title'];

function convertNavigation(header: Element, opts: ParseOptions, tokens: PhpTokens) {
  const location = phpStr(opts.menuLocation || 'primary-menu');

  const logo = LOGO_SELECTORS.map((s) => header.querySelector(s)).find(Boolean);
  const nav = NAV_SELECTORS.map((s) => header.querySelector(s)).find((el) => el && el.querySelector('a'));

  const logoInNav = !!(logo && nav && nav.contains(logo));
  if (logo) {
    const cls = phpStr(logo.getAttribute('class') || 'site-title');
    logo.replaceWith(
      header.ownerDocument.createTextNode(
        tokens.add(`<?php if (has_custom_logo()) : the_custom_logo(); else : ?>
  <a href="<?php echo esc_url(home_url('/')); ?>" class="${cls}" rel="home"><?php bloginfo('name'); ?></a>
<?php endif; ?>`)
      )
    );
  }

  if (nav) {
    // If the nav also wraps the logo / toggles, only replace its menu list
    const list = nav.querySelector('ul');
    const replaceListOnly = !!list && (logoInNav || nav.querySelectorAll(':scope > *').length > 1);
    const target = replaceListOnly && list ? list : nav;
    const fallback = target.outerHTML;
    const php = `<?php
if (has_nav_menu('${location}')) :
  wp_nav_menu(array(
    'theme_location' => '${location}',
    'menu_id'        => '${phpStr((target === nav ? list : target)?.getAttribute('id') || location)}',
    'container'      => ${target === nav ? `'nav'` : 'false'},
    'container_class'=> '${phpStr(nav.getAttribute('class') || 'main-navigation')}',
    'menu_class'     => '${phpStr((target === nav ? list : target)?.getAttribute('class') || 'nav-menu')}',
    'fallback_cb'    => false,
  ));
else :
?>
  ${fallback}
<?php endif; ?>`;

    let cart = '';
    if (opts.enableWooCommerce && !header.querySelector('.cart-count-badge')) {
      cart = `
<?php if (class_exists('WooCommerce')) : ?>
  <div class="header-cart-wrap">
    <a href="<?php echo esc_url(wc_get_cart_url()); ?>" class="header-cart-link" title="<?php esc_attr_e('View shopping cart', '${phpStr(opts.textDomain || '')}'); ?>">
      <span class="cart-icon" aria-hidden="true">&#128722;</span>
      <span class="cart-count-badge"><?php echo WC()->cart ? esc_html(WC()->cart->get_cart_contents_count()) : '0'; ?></span>
    </a>
  </div>
<?php endif; ?>`;
    }

    target.replaceWith(header.ownerDocument.createTextNode(tokens.add(php + cart)));
  }
}

/**
 * Replaces static copyright years with a dynamic year, keeping the original wording.
 * "© 2024 Acme" → "© <?php year ?> Acme", "© 2019–2024" → "© 2019–<?php year ?>".
 */
function convertCopyright(root: Node, tokens: PhpTokens) {
  const year = tokens.add(`<?php echo esc_html(wp_date('Y')); ?>`);
  for (const node of textNodes(root)) {
    const text = node.textContent || '';
    if (!/©|\(c\)/i.test(text)) continue;
    node.textContent = text.replace(
      /(©|\(c\))(\s*)(?:(\d{4})(\s*[-–—]\s*))?(\d{4})?/i,
      (_m, sym, space, start, dash, end) => {
        if (!end) return `${sym}${space}${year} `;
        return start ? `${sym}${space}${start}${dash}${year}` : `${sym}${space}${year}`;
      }
    );
  }
}

/**
 * Parses a source HTML page into WordPress-ready template fragments.
 */
export function parseHtmlStructure(html: string, opts: ParseOptions = {}): ParsedHtmlStructure {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tokens = new PhpTokens();

  const googleFonts: string[] = [];
  const cssLinks: string[] = [];
  doc.querySelectorAll('link[rel~="stylesheet"], link[href*="fonts.googleapis.com"]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href) return;
    if (/fonts\.(googleapis|gstatic)\.com/.test(href)) {
      if (link.getAttribute('rel')?.includes('stylesheet')) googleFonts.push(href);
    } else {
      cssLinks.push(href);
    }
  });

  const jsScripts: { src: string; inHead: boolean }[] = [];
  const inlineScripts: string[] = [];
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src');
    const type = (s.getAttribute('type') || '').toLowerCase();
    if (src) {
      jsScripts.push({ src, inHead: !!s.closest('head') });
    } else if (!type || type === 'text/javascript' || type === 'module') {
      const code = s.textContent?.trim();
      if (code) inlineScripts.push(code);
    }
  });

  const inlineStyles: string[] = [];
  doc.querySelectorAll('style').forEach((s) => {
    const css = s.textContent?.trim();
    if (css) inlineStyles.push(rewriteCssUrls(css, 'root'));
  });

  const hasNav = !!doc.querySelector('nav, .menu, .navbar, .main-menu');

  // Remove non-content nodes before extracting fragments
  doc.body?.querySelectorAll('script, style, link, noscript').forEach((el) => el.remove());

  const headerEl = pickLayoutElement(doc, HEADER_SELECTORS);
  const footerEl = pickLayoutElement(doc, FOOTER_SELECTORS);

  let sections: EditableSection[] = [];
  if (doc.body) {
    if (opts.bindings?.length) applyBindingsToTree(doc.body, opts.bindings, tokens);
    // Before URL rewriting, so fields keep their original src/href as defaults
    if (opts.editable) {
      sections = extractEditableSections(doc.body, [headerEl, footerEl].filter(Boolean) as Element[], {
        page: opts.editable.page,
        pagePrefix: opts.editable.pagePrefix,
        assetPath: themeAssetPath,
        linkExpr: internalLinkExpr,
        tokenPattern: tokens.pattern,
      });
    }
    rewriteUrls(doc.body, tokens);
  }

  if (headerEl) convertNavigation(headerEl, opts, tokens);
  if (footerEl) convertCopyright(footerEl, tokens);

  const headerHtml = headerEl ? tokens.restore(headerEl.outerHTML) : '';
  const footerHtml = footerEl ? tokens.restore(footerEl.outerHTML) : '';
  headerEl?.remove();
  footerEl?.remove();

  for (const section of sections) {
    section.template = tokens.restore(section.element!.outerHTML);
    delete section.element;
  }

  const bodyHtml = doc.body ? tokens.restore(doc.body.innerHTML.trim()) : '';
  const mainHtml = opts.editable?.acfPrefix ? renderAcf(bodyHtml, sections, opts.editable.acfPrefix) : renderStatic(bodyHtml, sections);

  return {
    headerHtml,
    footerHtml,
    mainHtml,
    googleFonts,
    cssLinks,
    jsScripts,
    inlineStyles,
    inlineScripts,
    hasNav,
    sections,
  };
}

/**
 * @param page source file name; pass it to extract editable sections (ACF / Elementor)
 * @param isMainPage the main page's section slugs are not prefixed
 */
export function parseOptionsFrom(options: ConversionOptions, textDomain: string, page?: string, isMainPage = false): ParseOptions {
  const editable = page && (options.enableACFHelper || options.enableElementor);
  return {
    textDomain,
    bindings: options.visualBindings,
    menuLocation: options.menuLocations[0]?.slug || 'primary-menu',
    enableWooCommerce: options.enableWooCommerce,
    editable: editable
      ? {
          page,
          pagePrefix: isMainPage ? '' : sanitizeSlug(page.replace(/\.html?$/i, '')).replace(/-/g, '_'),
          acfPrefix: options.enableACFHelper ? toPhpPrefix(textDomain) : undefined,
        }
      : undefined,
  };
}
