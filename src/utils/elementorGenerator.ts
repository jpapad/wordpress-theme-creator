import { ElementorWidgetDefinition, WordPressThemeFile, WordPressThemeMeta } from '../types';
import { commentSafe, phpStr, sanitizeSlug, toPhpPrefix } from './converter/php';
import { EditableField, EditableSection, renderElementor } from './converter/editable';
import { phpValue, raw } from './converter/acfFields';

const pascal = (slug: string) =>
  slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('_');

interface WidgetFile {
  className: string;
  path: string;
  content: string;
}

/** Elementor control for an editable field. Dynamic tags let Elementor Pro bind it to ACF. */
function controlFor(field: EditableField, td: string): string {
  const common = {
    label: raw(`esc_html__('${phpStr(field.label)}', '${td}')`),
    dynamic: { active: true },
  };
  let control: Record<string, unknown>;
  switch (field.type) {
    case 'text':
      control = { ...common, type: raw('Controls_Manager::TEXT'), default: field.defaultText, label_block: true };
      break;
    case 'html':
      control = { ...common, type: raw('Controls_Manager::TEXTAREA'), default: field.defaultText, rows: 4 };
      break;
    case 'url':
      control = { ...common, type: raw('Controls_Manager::URL'), default: { url: raw(field.defaultExpr) } };
      break;
    case 'image':
      control = { ...common, type: raw('Controls_Manager::MEDIA'), default: { url: raw(field.defaultExpr) } };
      break;
  }
  return `        $this->add_control('${field.name}', ${phpValue(control, '        ')});`;
}

function sectionWidget(section: EditableSection, meta: WordPressThemeMeta, prefix: string): WidgetFile {
  const td = phpStr(meta.textDomain);
  const className = `${prefix}_Section_${pascal(section.slug)}_Widget`;
  const fileSlug = sanitizeSlug(section.slug);
  const content = `<?php
/**
 * Elementor widget for the "${commentSafe(section.title)}" section of ${commentSafe(section.page)}.
 * Renders the original markup; every text, button and image is a control.
 *
 * @package ${commentSafe(meta.name)}
 */

if (!defined('ABSPATH')) {
    exit;
}

use Elementor\\Widget_Base;
use Elementor\\Controls_Manager;

class ${className} extends Widget_Base {

    public function get_name() {
        return '${prefix}_${section.slug}';
    }

    public function get_title() {
        return esc_html__('${phpStr(section.title)}', '${td}');
    }

    public function get_icon() {
        return 'eicon-section';
    }

    public function get_categories() {
        return array('${prefix}-elements');
    }

    public function get_keywords() {
        return array('${phpStr(section.slug.replace(/_/g, ' '))}', 'section', '${phpStr(meta.textDomain)}');
    }

    protected function register_controls() {
        $this->start_controls_section('content_section', array(
            'label' => esc_html__('Content', '${td}'),
            'tab'   => Controls_Manager::TAB_CONTENT,
        ));

${section.fields.map((f) => controlFor(f, td)).join('\n\n')}

        $this->end_controls_section();
    }

    protected function render() {
        $s = $this->get_settings_for_display();
        ?>
${renderElementor(section)}
        <?php
    }
}
`;
  return { className, path: `inc/elementor-widgets/class-section-${fileSlug}.php`, content };
}

const CUSTOM_CONTROL: Record<string, string> = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  WYSIWYG: 'WYSIWYG',
  MEDIA: 'MEDIA',
  URL: 'URL',
  SWITCHER: 'SWITCHER',
  SELECT: 'TEXT',
  COLOR: 'COLOR',
};

/** Widget defined by hand in Theme Settings › Elementor */
function customWidget(def: ElementorWidgetDefinition, meta: WordPressThemeMeta, prefix: string): WidgetFile {
  const td = phpStr(meta.textDomain);
  const slug = sanitizeSlug(def.name || def.title).replace(/-/g, '_') || 'custom';
  const className = `${prefix}_Custom_${pascal(slug)}_Widget`;
  const fields = def.fields.map((f) => ({ ...f, name: sanitizeSlug(f.name).replace(/-/g, '_') || 'field' }));
  const controls = fields
    .map((f) => {
      const type = CUSTOM_CONTROL[f.type] || 'TEXT';
      const defaultValue =
        type === 'MEDIA' || type === 'URL' ? { url: f.default || '' } : type === 'SWITCHER' ? (f.default ? 'yes' : '') : f.default || '';
      return `        $this->add_control('${f.name}', ${phpValue(
        { label: raw(`esc_html__('${phpStr(f.label)}', '${td}')`), type: raw(`Controls_Manager::${type}`), default: defaultValue, dynamic: { active: true } },
        '        '
      )});`;
    })
    .join('\n\n');
  const renderRows = fields
    .map((f) => {
      const type = CUSTOM_CONTROL[f.type] || 'TEXT';
      if (type === 'MEDIA') return `            <?php if (!empty($s['${f.name}']['url'])) : ?><img src="<?php echo esc_url($s['${f.name}']['url']); ?>" alt=""><?php endif; ?>`;
      if (type === 'URL') return `            <?php if (!empty($s['${f.name}']['url'])) : ?><a href="<?php echo esc_url($s['${f.name}']['url']); ?>"><?php echo esc_html($s['${f.name}']['url']); ?></a><?php endif; ?>`;
      if (type === 'WYSIWYG') return `            <div class="widget-field-${f.name}"><?php echo wp_kses_post($s['${f.name}']); ?></div>`;
      if (type === 'SWITCHER' || type === 'COLOR') return '';
      return `            <div class="widget-field-${f.name}"><?php echo esc_html($s['${f.name}']); ?></div>`;
    })
    .filter(Boolean)
    .join('\n');

  const content = `<?php
/**
 * Custom Elementor widget "${commentSafe(def.title)}" (defined in Theme Settings).
 *
 * @package ${commentSafe(meta.name)}
 */

if (!defined('ABSPATH')) {
    exit;
}

use Elementor\\Widget_Base;
use Elementor\\Controls_Manager;

class ${className} extends Widget_Base {

    public function get_name() {
        return '${prefix}_custom_${slug}';
    }

    public function get_title() {
        return esc_html__('${phpStr(def.title)}', '${td}');
    }

    public function get_icon() {
        return '${phpStr(def.icon || 'eicon-code')}';
    }

    public function get_categories() {
        return array('${prefix}-elements');
    }

    protected function register_controls() {
        $this->start_controls_section('content_section', array(
            'label' => esc_html__('Content', '${td}'),
            'tab'   => Controls_Manager::TAB_CONTENT,
        ));

${controls}

        $this->end_controls_section();
    }

    protected function render() {
        $s = $this->get_settings_for_display();
        ?>
        <div class="${prefix}-custom-widget ${prefix}-custom-widget--${slug}">
${renderRows}
        </div>
        <?php
    }
}
`;
  return { className, path: `inc/elementor-widgets/class-custom-${sanitizeSlug(slug)}.php`, content };
}

/**
 * Elementor integration: Theme Builder locations, page templates, and widgets generated from
 * the converted sections (plus custom widgets defined in Theme Settings).
 */
export function generateElementorIntegrationFiles(
  meta: WordPressThemeMeta,
  sections: EditableSection[] = [],
  customWidgets: ElementorWidgetDefinition[] = []
): WordPressThemeFile[] {
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
  const td = phpStr(meta.textDomain);
  const files: WordPressThemeFile[] = [];

  const widgets = [
    ...sections.map((s) => sectionWidget(s, meta, prefix)),
    ...customWidgets.filter((w) => w.fields?.length).map((w) => customWidget(w, meta, prefix)),
  ];

  const elementorSupportPhp = `<?php
/**
 * Elementor Compatibility & Theme Builder Support
 *
 * @package ${commentSafe(meta.name)}
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Elementor Pro Theme Builder locations (Header, Footer, Single, Archive, 404)
 *
 * @param \\ElementorPro\\Modules\\ThemeBuilder\\Classes\\Locations_Manager $elementor_theme_manager
 */
function ${prefix}_register_elementor_locations($elementor_theme_manager) {
    $elementor_theme_manager->register_all_core_location();
}
add_action('elementor/theme/register_locations', '${prefix}_register_elementor_locations');

/**
 * Widget category holding the theme's section widgets
 */
function ${prefix}_add_elementor_widget_categories($elements_manager) {
    $elements_manager->add_category(
        '${prefix}-elements',
        array(
            'title' => esc_html__('${phpStr(meta.name)} Sections', '${td}'),
            'icon'  => 'fa fa-plug',
        )
    );
}
add_action('elementor/elements/categories_registered', '${prefix}_add_elementor_widget_categories');
${
  widgets.length
    ? `
/**
 * Register the theme's Elementor widgets (one per converted section)
 */
function ${prefix}_register_custom_elementor_widgets($widgets_manager) {
${widgets.map((w) => `    require_once get_template_directory() . '/${w.path}';`).join('\n')}

${widgets.map((w) => `    $widgets_manager->register(new \\${w.className}());`).join('\n')}
}
add_action('elementor/widgets/register', '${prefix}_register_custom_elementor_widgets');
`
    : ''
}
/**
 * Helper to check if Elementor Theme Location is active
 */
function ${prefix}_is_elementor_location_active($location) {
    if (!function_exists('elementor_theme_do_location')) {
        return false;
    }
    return elementor_theme_do_location($location);
}

/**
 * True when the current page was built with Elementor: templates then show the Elementor
 * content instead of the converted static markup.
 */
function ${prefix}_is_built_with_elementor() {
    if (!did_action('elementor/loaded') || !class_exists('\\\\Elementor\\\\Plugin')) {
        return false;
    }
    $post_id = get_queried_object_id();
    if (!$post_id) {
        return false;
    }
    $document = \\Elementor\\Plugin::$instance->documents->get($post_id);
    return $document && $document->is_built_with_elementor();
}
`;

  files.push({
    path: 'inc/elementor-support.php',
    name: 'elementor-support.php',
    folder: 'inc',
    content: elementorSupportPhp,
    language: 'php',
    purpose: `Elementor Theme Builder locations, widget category and ${widgets.length} widget registrations`,
    isCore: false,
  });

  files.push({
    path: 'page-templates/template-elementor-canvas.php',
    name: 'template-elementor-canvas.php',
    folder: 'page-templates',
    content: `<?php
/**
 * Template Name: Elementor Canvas (No Header, No Footer)
 * Template Post Type: post, page
 *
 * @package ${commentSafe(meta.name)}
 */

if (!defined('ABSPATH')) {
    exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>
<body <?php body_class('elementor-template-canvas'); ?>>
<?php wp_body_open(); ?>

<main id="primary" class="site-main elementor-canvas-wrapper">
    <?php
    while (have_posts()) :
        the_post();
        the_content();
    endwhile;
    ?>
</main>

<?php wp_footer(); ?>
</body>
</html>
`,
    language: 'php',
    purpose: 'Blank full-screen Elementor Canvas template for landing pages',
    isCore: false,
  });

  files.push({
    path: 'page-templates/template-elementor-fullwidth.php',
    name: 'template-elementor-fullwidth.php',
    folder: 'page-templates',
    content: `<?php
/**
 * Template Name: Elementor Full Width
 * Template Post Type: post, page
 *
 * @package ${commentSafe(meta.name)}
 */

get_header();
?>

<main id="primary" class="site-main elementor-fullwidth-container">
    <?php
    while (have_posts()) :
        the_post();
        the_content();
    endwhile;
    ?>
</main>

<?php
get_footer();
`,
    language: 'php',
    purpose: 'Elementor Full-Width Page Template retaining theme header & footer',
    isCore: false,
  });

  for (const w of widgets) {
    files.push({
      path: w.path,
      name: w.path.split('/').pop()!,
      folder: 'inc/elementor-widgets',
      content: w.content,
      language: 'php',
      purpose: `Elementor widget ${w.className}`,
      isCore: false,
    });
  }

  return files;
}
