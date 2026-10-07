import { WordPressThemeFile, WordPressThemeMeta } from '../../types';
import { EditableField, EditableSection } from './editable';
import { commentSafe, phpStr, sanitizeSlug, toPhpPrefix } from './php';

/** Serializes a JS value as a PHP array literal; strings starting with \0 are raw PHP expressions */
export function phpValue(value: unknown, indent = ''): string {
  const inner = indent + '    ';
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.startsWith('\0') ? value.slice(1) : `'${phpStr(value)}'`;
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array()';
    return `array(\n${value.map((v) => `${inner}${phpValue(v, inner)},`).join('\n')}\n${indent})`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  return `array(\n${entries.map(([k, v]) => `${inner}'${phpStr(k)}' => ${phpValue(v, inner)},`).join('\n')}\n${indent})`;
}

/** Marks a string as a raw PHP expression for phpValue() */
export const raw = (expr: string) => `\0${expr}`;

function acfField(field: EditableField, keyPrefix: string) {
  const base = { key: `field_${keyPrefix}_${field.name}`, label: field.label, name: field.name };
  switch (field.type) {
    case 'text':
      return { ...base, type: 'text', default_value: field.defaultText };
    case 'html':
      return { ...base, type: 'textarea', default_value: field.defaultText, new_lines: '', rows: 3, instructions: 'Basic HTML (links, bold) is allowed.' };
    case 'image':
      return { ...base, type: 'image', return_format: 'url', preview_size: 'medium', instructions: `Leave empty to keep the original image (${field.defaultText}).` };
    case 'url':
      // Text instead of ACF "url": anchors (#contact) and relative links must stay valid
      return { ...base, type: 'text', placeholder: field.defaultText, instructions: `Leave empty to keep the original link (${field.defaultText}).` };
  }
}

function groupFields(sections: EditableSection[], keyPrefix: string) {
  return sections.flatMap((section) => [
    { key: `field_${keyPrefix}_${section.slug}_tab`, label: section.title, name: '', type: 'tab', placement: 'top' },
    ...section.fields.map((f) => acfField(f, keyPrefix)),
  ]);
}

/**
 * inc/acf-fields.php: the field helper used by the templates plus local field groups
 * (front page + one group per converted page).
 */
export function generateAcfFieldsFile(meta: WordPressThemeMeta, sections: EditableSection[], mainPage: string): WordPressThemeFile {
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
  const td = phpStr(meta.textDomain);
  const byPage = new Map<string, EditableSection[]>();
  for (const s of sections) byPage.set(s.page, [...(byPage.get(s.page) || []), s]);

  const groups = [...byPage.entries()].map(([page, pageSections]) => {
    const isMain = page === mainPage;
    const pageSlug = sanitizeSlug(page.replace(/\.html?$/i, ''));
    const key = `${prefix}_${isMain ? 'front_page' : pageSlug.replace(/-/g, '_')}`;
    const group = {
      key: `group_${key}`,
      title: isMain ? 'Front page content' : `${pageSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} page content`,
      fields: groupFields(pageSections, key),
      location: raw('$locations'),
      menu_order: 0,
      position: 'acf_after_title',
      style: 'default',
      label_placement: 'top',
      active: true,
      description: `Editable content converted from ${page}`,
    };
    // Front page: page type rule. Other pages: their template, or the page whose slug matches.
    const locations = isMain
      ? `    $locations = array(array(array('param' => 'page_type', 'operator' => '==', 'value' => 'front_page')));`
      : `    $locations = array(array(array('param' => 'page_template', 'operator' => '==', 'value' => 'templates/template-${pageSlug}.php')));
    $page = get_page_by_path('${pageSlug}');
    if ($page) {
        $locations[] = array(array('param' => 'page', 'operator' => '==', 'value' => (string) $page->ID));
    }`;
    return `    // ${commentSafe(group.title)}
${locations}
    acf_add_local_field_group(${phpValue(group, '    ')});`;
  });

  const content = `<?php
/**
 * ACF integration: editable content for the converted pages.
 *
 * Every text, button and image of the original sections is an ACF field. Templates read them
 * through ${prefix}_field(), which falls back to the original content, so the site looks the
 * same until an editor changes a value (and keeps working when ACF is deactivated).
 *
 * @package ${commentSafe(meta.name)}
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Returns an ACF field of the current page, or $default when ACF is inactive or the field is empty.
 *
 * @param string $name    Field name.
 * @param mixed  $default Original content from the converted HTML.
 * @return mixed
 */
function ${prefix}_field($name, $default = '') {
    if (!function_exists('get_field')) {
        return $default;
    }
    $post_id = (is_front_page() && get_option('page_on_front')) ? (int) get_option('page_on_front') : get_queried_object_id();
    $value   = get_field($name, $post_id);
    if (is_array($value)) {
        // Image fields configured to return an array
        $value = isset($value['url']) ? $value['url'] : '';
    }
    return ($value === null || $value === '' || $value === false) ? $default : $value;
}

/**
 * Registers the field groups in code (no JSON sync needed).
 */
function ${prefix}_register_acf_field_groups() {
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

${groups.join('\n\n')}
}
add_action('acf/init', '${prefix}_register_acf_field_groups');

/**
 * Admin notice when ACF is missing (content still renders with the original values).
 */
function ${prefix}_acf_missing_notice() {
    if (function_exists('acf_add_local_field_group') || !current_user_can('install_plugins')) {
        return;
    }
    echo '<div class="notice notice-info is-dismissible"><p>' . esc_html__('Install Advanced Custom Fields to edit the theme sections from the page editor.', '${td}') . '</p></div>';
}
add_action('admin_notices', '${prefix}_acf_missing_notice');
`;

  return {
    path: 'inc/acf-fields.php',
    name: 'acf-fields.php',
    folder: 'inc',
    content,
    language: 'php',
    purpose: `ACF field groups (${sections.reduce((n, s) => n + s.fields.length, 0)} fields in ${sections.length} sections) and the ${prefix}_field() helper`,
    isCore: false,
  };
}
