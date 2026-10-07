import { phpStr, sanitizeSlug } from './php';

/**
 * Editable content extracted from <section> elements of a source page.
 *
 * Each field's node is replaced by a marker in the converted markup; the markers are later
 * rendered as static HTML (original content), ACF lookups with the original as fallback,
 * or Elementor widget settings.
 */
export type EditableFieldType = 'text' | 'html' | 'url' | 'image';

export interface EditableField {
  /** Field name, unique within its page (e.g. hero_heading) */
  name: string;
  label: string;
  type: EditableFieldType;
  marker: string;
  /** PHP expression of the original value (string literal, home_url(...), theme asset URL...) */
  defaultExpr: string;
  /** Plain original value for UIs / Elementor defaults that must be literal */
  defaultText: string;
  /** Markup restored when the theme is exported without ACF */
  staticValue: string;
}

export interface EditableSection {
  /** Unique slug across the theme (page prefix added for secondary pages) */
  slug: string;
  title: string;
  /** Source file the section comes from */
  page: string;
  /** Section outerHTML with field markers (PHP for assets/links already inlined) */
  template: string;
  fields: EditableField[];
  /** Repeated items (cards, list entries) left static */
  repeatedItems: number;
  /** Source element while parsing (internal, removed once the template is captured) */
  element?: Element;
}

const MAX_FIELDS_PER_SECTION = 24;
const TEXT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, blockquote, figcaption';
const LABEL_CLASS = /(^|[\s_-])(badge|eyebrow|subtitle|tagline|kicker|overline|pill|label)([\s_-]|$)/i;
const BUTTON_CLASS = /(^|[\s_-])(btn|button|cta)([\s_-]|$)/i;
const BLOCK_TAGS = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'SECTION', 'ARTICLE', 'TABLE', 'FORM', 'IMG', 'VIDEO', 'IFRAME', 'BLOCKQUOTE', 'FIGURE']);
const INLINE_ICON_TAGS = new Set(['SVG', 'I']);

let markerSeed = 0;

/** Turns "Hero Section" / "hero-section" into "hero" */
function sectionSlugFor(el: Element, index: number): string {
  const raw = el.getAttribute('id') || Array.from(el.classList).find((c) => !/^(section|container|wrapper|row|inner)$|^(py|px|pt|pb|my|mx|bg|text)-/.test(c)) || '';
  // "hero-section" → hero, "section-header" stays section_header
  const slug = sanitizeSlug(raw.replace(/[-_]section$/i, ''))
    .replace(/-/g, '_')
    .replace(/^theme$/, '');
  return slug && /^[a-z]/.test(slug) ? slug : `section_${index + 1}`;
}

function titleFor(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Elements whose parent holds 3+ siblings with the same tag + class: cards, list items... */
function findRepeatedItems(section: Element): Set<Element> {
  const repeated = new Set<Element>();
  section.querySelectorAll('*').forEach((parent) => {
    const groups = new Map<string, Element[]>();
    for (const child of Array.from(parent.children)) {
      const key = `${child.tagName}.${child.className}`;
      groups.set(key, [...(groups.get(key) || []), child]);
    }
    for (const items of groups.values()) {
      if (items.length >= 3 && items.some((i) => i.querySelector(TEXT_SELECTOR) || i.textContent?.trim())) {
        items.forEach((i) => repeated.add(i));
      }
    }
  });
  return repeated;
}

function hasBlockChildren(el: Element): boolean {
  return Array.from(el.querySelectorAll('*')).some((c) => BLOCK_TAGS.has(c.tagName));
}

function hasOnlyText(el: Element): boolean {
  return el.children.length === 0;
}

/** PHP expression for a URL found in the source (asset, internal page, external, anchor) */
function urlExpr(url: string, assetPath: (u: string) => string | null, linkExpr: (u: string) => string | null): string {
  const value = url.trim();
  if (/^(https?:)?\/\//i.test(value) || /^(#|mailto:|tel:|data:)/i.test(value) || !value) return `'${phpStr(value)}'`;
  const asset = assetPath(value);
  if (asset) return `get_template_directory_uri() . '/${phpStr(asset)}'`;
  return linkExpr(value) || `'${phpStr(value)}'`;
}

export interface ExtractContext {
  /** Prefix added to section slugs (secondary pages), '' for the main page */
  pagePrefix: string;
  page: string;
  assetPath: (url: string) => string | null;
  /** PHP expression for internal links (home_url('/about/')), null when not internal */
  linkExpr: (url: string) => string | null;
  /** Token pattern of other PHP placeholders: text containing them is not made editable */
  tokenPattern: RegExp;
}

/**
 * Finds top-level <section> elements and replaces their editable nodes with markers.
 * Must run before URL rewriting so original attribute values are still available.
 */
export function extractEditableSections(body: Element, exclude: Element[], ctx: ExtractContext): EditableSection[] {
  // <section> plus div-based sections (div.section, div.hero-section, div.section-header), outermost only
  const SECTION_SELECTOR = 'section, div.section, div[class*="-section"], div[class*="section-"]';
  const candidates = Array.from(body.querySelectorAll(SECTION_SELECTOR)).filter(
    (s) => !s.parentElement?.closest(SECTION_SELECTOR) && !exclude.some((x) => x.contains(s)) && !s.closest('article')
  );
  const usedSlugs = new Set<string>();
  const sections: EditableSection[] = [];

  candidates.forEach((sectionEl, index) => {
    let base = sectionSlugFor(sectionEl, index);
    while (usedSlugs.has(base)) base = `${base}_${index + 1}`;
    usedSlugs.add(base);

    const repeated = findRepeatedItems(sectionEl);
    const inRepeated = (el: Element) => Array.from(repeated).some((r) => r.contains(el));
    const claimed: Element[] = [];
    const isClaimed = (el: Element) => claimed.some((c) => c.contains(el) || el.contains(c));
    const fields: EditableField[] = [];
    const counters: Record<string, number> = {};
    const nextName = (kind: string) => {
      counters[kind] = (counters[kind] || 0) + 1;
      return counters[kind] === 1 ? `${base}_${kind}` : `${base}_${kind}_${counters[kind]}`;
    };
    const addField = (field: Omit<EditableField, 'marker'>) => {
      const marker = `wpfld${(++markerSeed).toString(36)}x`;
      fields.push({ ...field, marker });
      return marker;
    };

    const walker = sectionEl.ownerDocument.createTreeWalker(sectionEl, 1 /* SHOW_ELEMENT */);
    for (let node = walker.nextNode() as Element | null; node && fields.length < MAX_FIELDS_PER_SECTION; node = walker.nextNode() as Element | null) {
      if (inRepeated(node) || isClaimed(node)) continue;
      const text = node.textContent?.trim() || '';

      // Buttons / CTAs: label + link
      if (node.tagName === 'A' && BUTTON_CLASS.test(node.getAttribute('class') || '')) {
        claimed.push(node);
        if (text && !ctx.tokenPattern.test(text) && Array.from(node.children).every((c) => INLINE_ICON_TAGS.has(c.tagName.toUpperCase()))) {
          // Replace only the text, keep icons
          const textNode = Array.from(node.childNodes).find((n) => n.nodeType === 3 && n.textContent?.trim());
          if (textNode) {
            const name = nextName('button');
            textNode.textContent = textNode.textContent!.replace(textNode.textContent!.trim(), addField({
              name,
              label: `Button ${counters.button} label`,
              type: 'text',
              defaultExpr: `'${phpStr(textNode.textContent!.trim())}'`,
              defaultText: textNode.textContent!.trim(),
              staticValue: textNode.textContent!.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;'),
            }));
            const href = node.getAttribute('href') || '#';
            const expr = urlExpr(href, ctx.assetPath, ctx.linkExpr);
            node.setAttribute('href', addField({
              name: `${name}_url`,
              label: `Button ${counters.button} link`,
              type: 'url',
              defaultExpr: expr,
              defaultText: href,
              staticValue: expr.startsWith("'") ? href : `<?php echo esc_url(${expr}); ?>`,
            }));
          }
        }
        continue;
      }

      // Images
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src');
        if (!src || src.startsWith('data:')) continue;
        claimed.push(node);
        const expr = urlExpr(src, ctx.assetPath, ctx.linkExpr);
        const name = nextName('image');
        node.setAttribute('src', addField({
          name,
          label: node.getAttribute('alt') ? `Image: ${node.getAttribute('alt')}` : `Image ${counters.image}`,
          type: 'image',
          defaultExpr: expr,
          defaultText: src,
          staticValue: expr.startsWith("'") ? src : `<?php echo esc_url(${expr}); ?>`,
        }));
        // An editable src must not be overridden by the original srcset
        node.removeAttribute('srcset');
        continue;
      }

      // Text blocks: headings, paragraphs, quotes, badges / eyebrows
      const isTextBlock = node.matches(TEXT_SELECTOR) || (LABEL_CLASS.test(node.getAttribute('class') || '') && !hasBlockChildren(node));
      if (!isTextBlock || !text || hasBlockChildren(node) || ctx.tokenPattern.test(node.innerHTML)) continue;
      claimed.push(node);
      const plain = hasOnlyText(node);
      const kind = /^H[1-6]$/.test(node.tagName) ? 'heading' : node.matches(TEXT_SELECTOR) ? 'text' : 'label';
      const name = nextName(kind);
      const original = node.innerHTML.trim();
      node.innerHTML = addField({
        name,
        label: `${kind === 'heading' ? 'Heading' : kind === 'label' ? 'Label' : 'Text'}${counters[kind] > 1 ? ` ${counters[kind]}` : ''}`,
        type: plain ? 'text' : 'html',
        defaultExpr: `'${phpStr(plain ? text : original)}'`,
        defaultText: plain ? text : original,
        staticValue: original,
      });
    }

    if (fields.length === 0) return;
    sections.push({
      slug: ctx.pagePrefix ? `${ctx.pagePrefix}_${base}` : base,
      title: titleFor(base),
      page: ctx.page,
      template: '',
      fields,
      repeatedItems: repeated.size,
      // Template is captured by the caller once URL tokens have been restored
      element: sectionEl,
    });
  });

  return sections;
}

/** Original content: used when ACF is off */
export function renderStatic(html: string, sections: EditableSection[]): string {
  let out = html;
  for (const f of sections.flatMap((s) => s.fields)) out = out.split(f.marker).join(f.staticValue);
  return out;
}

/** ACF lookups through the theme helper, falling back to the original content */
export function renderAcf(html: string, sections: EditableSection[], prefix: string): string {
  let out = html;
  for (const f of sections.flatMap((s) => s.fields)) {
    const call = `${prefix}_field('${f.name}', ${f.defaultExpr})`;
    const php =
      f.type === 'text'
        ? `<?php echo esc_html(${call}); ?>`
        : f.type === 'html'
          ? `<?php echo wp_kses_post(${call}); ?>`
          : `<?php echo esc_url(${call}); ?>`;
    out = out.split(f.marker).join(php);
  }
  return out;
}

/** Elementor widget settings ($s = $this->get_settings_for_display()) */
export function renderElementor(section: EditableSection): string {
  let out = section.template;
  for (const f of section.fields) {
    const php =
      f.type === 'text'
        ? `<?php echo esc_html($s['${f.name}']); ?>`
        : f.type === 'html'
          ? `<?php echo wp_kses_post($s['${f.name}']); ?>`
          : `<?php echo esc_url($s['${f.name}']['url'] ?? ''); ?>`;
    out = out.split(f.marker).join(php);
  }
  return out;
}

export const FIELD_MARKER_PATTERN = /wpfld[0-9a-z]+x/;
