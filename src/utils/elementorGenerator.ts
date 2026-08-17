import { ElementorWidgetDefinition, WordPressThemeFile, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from './converter';

/**
 * Generates full Elementor integration files including Theme Builder Locations,
 * Canvas & Fullwidth Templates, and custom Elementor Widget PHP classes.
 */
export function generateElementorIntegrationFiles(
  meta: WordPressThemeMeta,
  widgets?: ElementorWidgetDefinition[]
): WordPressThemeFile[] {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  const files: WordPressThemeFile[] = [];

  const defaultWidgets: ElementorWidgetDefinition[] = widgets && widgets.length > 0 ? widgets : [
    {
      id: 'widget-hero',
      name: 'theme_hero_section',
      title: `${meta.name} Hero Section`,
      icon: 'eicon-banner',
      category: `${prefix}-elements`,
      fields: [
        { name: 'heading', label: 'Main Headline', type: 'TEXT', default: 'Build High-Impact Digital Experiences' },
        { name: 'subheading', label: 'Subheading', type: 'TEXTAREA', default: 'Transform your web presence with our bespoke design system and high-performance framework.' },
        { name: 'button_text', label: 'Button Text', type: 'TEXT', default: 'Get Started Today' },
        { name: 'button_url', label: 'Button Link', type: 'URL', default: '#' },
      ],
    },
    {
      id: 'widget-features',
      name: 'theme_features_grid',
      title: `${meta.name} Feature Cards`,
      icon: 'eicon-posts-grid',
      category: `${prefix}-elements`,
      fields: [
        { name: 'section_title', label: 'Section Title', type: 'TEXT', default: 'Our Core Capabilities' },
        { name: 'feature_1_title', label: 'Feature 1 Title', type: 'TEXT', default: 'Rapid Performance' },
        { name: 'feature_1_desc', label: 'Feature 1 Description', type: 'TEXTAREA', default: 'Engineered for sub-second load times and flawless Google Core Web Vitals.' },
        { name: 'feature_2_title', label: 'Feature 2 Title', type: 'TEXT', default: 'Dynamic Templating' },
        { name: 'feature_2_desc', label: 'Feature 2 Description', type: 'TEXTAREA', default: 'Fully compatible with Elementor Theme Builder and standard WP hooks.' },
      ],
    },
  ];

  // 1. Elementor Theme Support & Locations Handler (inc/elementor-support.php)
  const elementorSupportPhp = `<?php
/**
 * Elementor Compatibility & Theme Builder Support
 *
 * @package ${meta.name}
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
 * Register Elementor Widget Category
 */
function ${prefix}_add_elementor_widget_categories($elements_manager) {
    $elements_manager->add_category(
        '${prefix}-elements',
        array(
            'title' => esc_html__('${meta.name} Widgets', '${meta.textDomain}'),
            'icon'  => 'fa fa-plug',
        )
    );
}
add_action('elementor/elements/categories_registered', '${prefix}_add_elementor_widget_categories');

/**
 * Register Custom Theme Elementor Widgets
 */
function ${prefix}_register_custom_elementor_widgets($widgets_manager) {
    require_once get_template_directory() . '/inc/elementor-widgets/class-elementor-hero-widget.php';
    require_once get_template_directory() . '/inc/elementor-widgets/class-elementor-features-widget.php';

    $widgets_manager->register(new \\${prefix}_Elementor_Hero_Widget());
    $widgets_manager->register(new \\${prefix}_Elementor_Features_Widget());
}
add_action('elementor/widgets/register', '${prefix}_register_custom_elementor_widgets');

/**
 * Helper to check if Elementor Theme Location is active
 */
function ${prefix}_is_elementor_location_active($location) {
    if (!function_exists('elementor_theme_do_location')) {
        return false;
    }
    return elementor_theme_do_location($location);
}
`;

  files.push({
    path: 'inc/elementor-support.php',
    name: 'elementor-support.php',
    folder: 'inc',
    content: elementorSupportPhp,
    language: 'php',
    purpose: 'Elementor Theme Builder locations, categories, and widget registration hooks',
    isCore: false,
  });

  // 2. Elementor Canvas Page Template (template-elementor-canvas.php)
  const canvasTemplatePhp = `<?php
/**
 * Template Name: Elementor Canvas (No Header, No Footer)
 * Template Post Type: post, page
 *
 * @package ${meta.name}
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
`;

  files.push({
    path: 'page-templates/template-elementor-canvas.php',
    name: 'template-elementor-canvas.php',
    folder: 'page-templates',
    content: canvasTemplatePhp,
    language: 'php',
    purpose: 'Blank full-screen Elementor Canvas template for landing pages',
    isCore: false,
  });

  // 3. Elementor Full Width Page Template (template-elementor-fullwidth.php)
  const fullwidthTemplatePhp = `<?php
/**
 * Template Name: Elementor Full Width
 * Template Post Type: post, page
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main elementor-fullwidth-container w-full overflow-hidden">
    <?php
    while (have_posts()) :
        the_post();
        the_content();
    endwhile;
    ?>
</main>

<?php
get_footer();
`;

  files.push({
    path: 'page-templates/template-elementor-fullwidth.php',
    name: 'template-elementor-fullwidth.php',
    folder: 'page-templates',
    content: fullwidthTemplatePhp,
    language: 'php',
    purpose: 'Elementor Full-Width Page Template retaining theme header & footer',
    isCore: false,
  });

  // 4. Custom Elementor Hero Widget Class (inc/elementor-widgets/class-elementor-hero-widget.php)
  const heroWidgetPhp = `<?php
/**
 * Custom Elementor Hero Widget
 *
 * @package ${meta.name}
 */

if (!defined('ABSPATH')) {
    exit;
}

use Elementor\\Widget_Base;
use Elementor\\Controls_Manager;

class ${prefix}_Elementor_Hero_Widget extends Widget_Base {

    public function get_name() {
        return '${prefix}_hero_section';
    }

    public function get_title() {
        return esc_html__('${meta.name} Hero Section', '${meta.textDomain}');
    }

    public function get_icon() {
        return 'eicon-banner';
    }

    public function get_categories() {
        return array('${prefix}-elements');
    }

    public function get_keywords() {
        return array('hero', 'banner', 'cta', '${prefix}');
    }

    protected function register_controls() {
        // Content Section
        $this->start_controls_section(
            'section_content',
            array(
                'label' => esc_html__('Hero Content', '${meta.textDomain}'),
                'tab'   => Controls_Manager::TAB_CONTENT,
            )
        );

        $this->add_control(
            'heading',
            array(
                'label'       => esc_html__('Main Headline', '${meta.textDomain}'),
                'type'        => Controls_Manager::TEXT,
                'default'     => esc_html__('Build High-Impact Digital Experiences', '${meta.textDomain}'),
                'placeholder' => esc_html__('Enter headline...', '${meta.textDomain}'),
                'label_block' => true,
            )
        );

        $this->add_control(
            'subheading',
            array(
                'label'       => esc_html__('Subheading Text', '${meta.textDomain}'),
                'type'        => Controls_Manager::TEXTAREA,
                'default'     => esc_html__('Transform your web presence with our bespoke design system and high-performance framework.', '${meta.textDomain}'),
                'rows'        => 3,
            )
        );

        $this->add_control(
            'button_text',
            array(
                'label'   => esc_html__('Button Label', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXT,
                'default' => esc_html__('Get Started Today', '${meta.textDomain}'),
            )
        );

        $this->add_control(
            'button_url',
            array(
                'label'         => esc_html__('Button Link', '${meta.textDomain}'),
                'type'          => Controls_Manager::URL,
                'placeholder'   => 'https://example.com',
                'show_external' => true,
                'default'       => array(
                    'url'         => '#',
                    'is_external' => false,
                    'nofollow'    => false,
                ),
            )
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'section_style',
            array(
                'label' => esc_html__('Typography & Colors', '${meta.textDomain}'),
                'tab'   => Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'heading_color',
            array(
                'label'     => esc_html__('Heading Color', '${meta.textDomain}'),
                'type'      => Controls_Manager::COLOR,
                'selectors' => array(
                    '{{WRAPPER}} .theme-hero-title' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        $target   = $settings['button_url']['is_external'] ? ' target="_blank"' : '';
        $nofollow = $settings['button_url']['nofollow'] ? ' rel="nofollow"' : '';
        ?>
        <section class="theme-elementor-hero py-20 px-6 max-w-6xl mx-auto text-center">
            <?php if (!empty($settings['heading'])) : ?>
                <h1 class="theme-hero-title text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
                    <?php echo esc_html($settings['heading']); ?>
                </h1>
            <?php endif; ?>

            <?php if (!empty($settings['subheading'])) : ?>
                <p class="theme-hero-subheading text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
                    <?php echo esc_html($settings['subheading']); ?>
                </p>
            <?php endif; ?>

            <?php if (!empty($settings['button_text'])) : ?>
                <div class="theme-hero-action">
                    <a href="<?php echo esc_url($settings['button_url']['url']); ?>"<?php echo $target . $nofollow; ?> class="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20">
                        <?php echo esc_html($settings['button_text']); ?> &rarr;
                    </a>
                </div>
            <?php endif; ?>
        </section>
        <?php
    }
}
`;

  files.push({
    path: 'inc/elementor-widgets/class-elementor-hero-widget.php',
    name: 'class-elementor-hero-widget.php',
    folder: 'inc/elementor-widgets',
    content: heroWidgetPhp,
    language: 'php',
    purpose: 'Native Elementor custom Hero widget class with controls and live rendering',
    isCore: false,
  });

  // 5. Custom Elementor Features Widget Class (inc/elementor-widgets/class-elementor-features-widget.php)
  const featuresWidgetPhp = `<?php
/**
 * Custom Elementor Features Grid Widget
 *
 * @package ${meta.name}
 */

if (!defined('ABSPATH')) {
    exit;
}

use Elementor\\Widget_Base;
use Elementor\\Controls_Manager;

class ${prefix}_Elementor_Features_Widget extends Widget_Base {

    public function get_name() {
        return '${prefix}_features_grid';
    }

    public function get_title() {
        return esc_html__('${meta.name} Features Grid', '${meta.textDomain}');
    }

    public function get_icon() {
        return 'eicon-posts-grid';
    }

    public function get_categories() {
        return array('${prefix}-elements');
    }

    protected function register_controls() {
        $this->start_controls_section(
            'section_content',
            array(
                'label' => esc_html__('Features Content', '${meta.textDomain}'),
                'tab'   => Controls_Manager::TAB_CONTENT,
            )
        );

        $this->add_control(
            'section_title',
            array(
                'label'   => esc_html__('Section Header', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXT,
                'default' => esc_html__('Our Key Capabilities', '${meta.textDomain}'),
            )
        );

        $this->add_control(
            'feature_1_title',
            array(
                'label'   => esc_html__('Card 1 Title', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXT,
                'default' => esc_html__('Lightning Fast Performance', '${meta.textDomain}'),
            )
        );

        $this->add_control(
            'feature_1_desc',
            array(
                'label'   => esc_html__('Card 1 Description', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXTAREA,
                'default' => esc_html__('Optimized assets with sub-second page loads and high PageSpeed ratings.', '${meta.textDomain}'),
            )
        );

        $this->add_control(
            'feature_2_title',
            array(
                'label'   => esc_html__('Card 2 Title', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXT,
                'default' => esc_html__('Full Site Customizer', '${meta.textDomain}'),
            )
        );

        $this->add_control(
            'feature_2_desc',
            array(
                'label'   => esc_html__('Card 2 Description', '${meta.textDomain}'),
                'type'    => Controls_Manager::TEXTAREA,
                'default' => esc_html__('Easily manage menus, logos, widgets, and dynamic tags directly inside WordPress.', '${meta.textDomain}'),
            )
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="theme-elementor-features py-12 max-w-6xl mx-auto px-4">
            <?php if (!empty($settings['section_title'])) : ?>
                <h2 class="text-3xl font-bold text-center mb-10 text-white"><?php echo esc_html($settings['section_title']); ?></h2>
            <?php endif; ?>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-lg">
                    <h3 class="text-xl font-bold text-amber-400 mb-2"><?php echo esc_html($settings['feature_1_title']); ?></h3>
                    <p class="text-zinc-400 text-sm leading-relaxed"><?php echo esc_html($settings['feature_1_desc']); ?></p>
                </div>
                <div class="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-lg">
                    <h3 class="text-xl font-bold text-amber-400 mb-2"><?php echo esc_html($settings['feature_2_title']); ?></h3>
                    <p class="text-zinc-400 text-sm leading-relaxed"><?php echo esc_html($settings['feature_2_desc']); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
}
`;

  files.push({
    path: 'inc/elementor-widgets/class-elementor-features-widget.php',
    name: 'class-elementor-features-widget.php',
    folder: 'inc/elementor-widgets',
    content: featuresWidgetPhp,
    language: 'php',
    purpose: 'Native Elementor Features Grid widget class with responsive controls',
    isCore: false,
  });

  return files;
}
