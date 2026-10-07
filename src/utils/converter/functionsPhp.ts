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
import { sanitizeSlug, toPhpPrefix, phpStr, commentSafe } from './php';
import { ParsedHtmlStructure, isExternalUrl } from './parser';

/**
 * Generates functions.php content with all requested hooks, WooCommerce, CPTs, and block patterns
 */
export function generateFunctionsPhp(
  meta: WordPressThemeMeta,
  options: ConversionOptions,
  parsed: ParsedHtmlStructure,
  otherFiles: SourceFile[],
  /** Any converted page has ACF section fields (inc/acf-fields.php is generated) */
  hasEditableSections = parsed.sections.length > 0
): string {
  const prefix = toPhpPrefix(meta.textDomain || meta.name);

  const version = meta.version || '1.0.0';

  const menuEntries = options.menuLocations.map(
    (m) => `        '${m.slug}' => esc_html__('${phpStr(m.name)}', '${meta.textDomain}'),`
  ).join('\n');

  const sidebarEntries = options.widgetAreas.map((s) => `
    register_sidebar(array(
        'name'          => esc_html__('${phpStr(s.name)}', '${meta.textDomain}'),
        'id'            => '${s.slug}',
        'description'   => esc_html__('${phpStr(s.description)}', '${meta.textDomain}'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="widget-title">',
        'after_title'   => '</h4>',
    ));`).join('\n');

  // Enqueue scripts & styles
  const googleFontEnqueues = parsed.googleFonts.map((url, i) =>
    `    wp_enqueue_style('${prefix}-font-${i + 1}', '${phpStr(url)}', array(), null);`
  ).join('\n');

  // External (CDN) stylesheets & scripts referenced in the source HTML
  const cdnCssEnqueues = parsed.cssLinks
    .filter(isExternalUrl)
    .map((url, i) => `    wp_enqueue_style('${prefix}-vendor-${i + 1}', '${phpStr(url)}', array(), null);`)
    .join('\n');

  const cdnScripts = parsed.jsScripts.filter((s) => isExternalUrl(s.src));
  const cdnHandles = cdnScripts.map((_, i) => `'${prefix}-vendor-js-${i + 1}'`);
  const cdnJsEnqueues = cdnScripts
    .map((s, i) => `    wp_enqueue_script('${prefix}-vendor-js-${i + 1}', '${phpStr(s.src)}', array(), null, ${s.inHead ? 'false' : 'true'});`)
    .join('\n');

  // Local assets (the caller excludes the stylesheet already merged into style.css)
  const cssEnqueues = otherFiles
    .filter((f) => f.type === 'css')
    .map((f) => `    wp_enqueue_style('${prefix}-${sanitizeSlug(f.name)}', get_template_directory_uri() . '/assets/css/${phpStr(f.name)}', array('${prefix}-style'), '${version}');`)
    .join('\n');

  const jsEnqueues = otherFiles
    .filter((f) => f.type === 'javascript')
    .map((f) => {
      const deps = [...cdnHandles];
      if (/\bjQuery\b|\$\(/.test(f.content)) deps.unshift("'jquery'");
      return `    wp_enqueue_script('${prefix}-${sanitizeSlug(f.name)}', get_template_directory_uri() . '/assets/js/${phpStr(f.name)}', array(${deps.join(', ')}), '${version}', true);`;
    })
    .join('\n');

  return `<?php
/**
 * ${commentSafe(meta.name)} functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package ${commentSafe(meta.name)}
 * @since ${version}
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

if (!function_exists('${prefix}_setup')) :
    /**
     * Sets up theme defaults and registers support for various WordPress features.
     */
    function ${prefix}_setup() {
        // Make theme available for translation.
        load_theme_textdomain('${meta.textDomain}', get_template_directory() . '/languages');

        // Add default posts and comments RSS feed links to head.
        add_theme_support('automatic-feed-links');

        // Let WordPress manage the document title.
        ${options.enableTitleTag ? "add_theme_support('title-tag');" : ''}

        // Enable support for Post Thumbnails on posts and pages.
        ${options.enablePostThumbnails ? "add_theme_support('post-thumbnails');" : ''}
        set_post_thumbnail_size(1200, 630, true);

        // Custom logo support
        ${options.enableCustomLogo ? `add_theme_support('custom-logo', array(
            'height'      => 250,
            'width'       => 250,
            'flex-width'  => true,
            'flex-height' => true,
        ));` : ''}

        // Register Navigation Menus
        register_nav_menus(array(
${menuEntries}
        ));

        // Switch default core markup for search form, comment form, and comments to output valid HTML5.
        ${options.enableHTML5 ? `add_theme_support('html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script',
        ));` : ''}

        // Add support for responsive embedded content.
        ${options.enableResponsiveEmbeds ? "add_theme_support('responsive-embeds');" : ''}

        // Add support for full and wide align images.
        ${options.enableAlignWide ? "add_theme_support('align-wide');" : ''}

        // Add support for editor styles.
        add_theme_support('editor-styles');
        add_editor_style('style.css');

        ${options.enableWooCommerce ? `// WooCommerce E-Commerce Support
        add_theme_support('woocommerce');
        add_theme_support('wc-product-gallery-zoom');
        add_theme_support('wc-product-gallery-lightbox');
        add_theme_support('wc-product-gallery-slider');` : ''}
    }
endif;
add_action('after_setup_theme', '${prefix}_setup');

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 */
function ${prefix}_content_width() {
    $GLOBALS['content_width'] = apply_filters('${prefix}_content_width', 1200);
}
add_action('after_setup_theme', '${prefix}_content_width', 0);

/**
 * Register widget area.
 */
function ${prefix}_widgets_init() {
${sidebarEntries || `    register_sidebar(array(
        'name'          => esc_html__('Sidebar', '${meta.textDomain}'),
        'id'            => 'main-sidebar',
        'description'   => esc_html__('Add widgets here.', '${meta.textDomain}'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));`}
}
add_action('widgets_init', '${prefix}_widgets_init');

/**
 * Enqueue scripts and styles.
 */
function ${prefix}_scripts() {
${googleFontEnqueues}
${cdnCssEnqueues}
    // Main stylesheet
    wp_enqueue_style('${prefix}-style', get_stylesheet_uri(), array(), '${version}');

${cssEnqueues}
${cdnJsEnqueues}
${jsEnqueues}

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}
add_action('wp_enqueue_scripts', '${prefix}_scripts');

// Custom Post Types & Taxonomies are registered in inc/cpt-and-taxonomies.php

${options.enableBlockPatterns ? `/**
 * Register Block Pattern Categories.
 */
function ${prefix}_register_block_pattern_categories() {
    if (function_exists('register_block_pattern_category')) {
        register_block_pattern_category('${prefix}_sections', array(
            'label' => esc_html__('${phpStr(meta.name)} Layouts', '${meta.textDomain}'),
        ));
        register_block_pattern_category('${prefix}_features', array(
            'label' => esc_html__('Features & Services', '${meta.textDomain}'),
        ));
        register_block_pattern_category('${prefix}_testimonials', array(
            'label' => esc_html__('Client Testimonials', '${meta.textDomain}'),
        ));
    }
}
add_action('init', '${prefix}_register_block_pattern_categories');` : ''}

${options.enableWooCommerce ? `/**
 * WooCommerce Custom Mini-Cart Count Fragment Update
 */
function ${prefix}_woocommerce_cart_fragments($fragments) {
    if (class_exists('WooCommerce')) {
        ob_start();
        ?>
        <span class="cart-count-badge">
            <?php echo WC()->cart ? esc_html(WC()->cart->get_cart_contents_count()) : '0'; ?>
        </span>
        <?php
        $fragments['span.cart-count-badge'] = ob_get_clean();
    }
    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', '${prefix}_woocommerce_cart_fragments');` : ''}

/**
 * Custom excerpt length.
 */
function ${prefix}_custom_excerpt_length($length) {
    return 24;
}
add_filter('excerpt_length', '${prefix}_custom_excerpt_length', 999);

/**
 * Custom excerpt more string.
 */
function ${prefix}_excerpt_more($more) {
    return ' &hellip;';
}
add_filter('excerpt_more', '${prefix}_excerpt_more');

/**
 * Modular Theme Integrations
 */
${options.enableElementor ? "require_once get_template_directory() . '/inc/elementor-support.php';\n" : ''}${options.enableACFHelper && hasEditableSections ? "require_once get_template_directory() . '/inc/acf-fields.php';\n" : ''}require_once get_template_directory() . '/inc/cpt-and-taxonomies.php';
require_once get_template_directory() . '/inc/gutenberg-blocks.php';
require_once get_template_directory() . '/inc/ocdi-config.php';
require_once get_template_directory() . '/inc/asset-optimizer.php';
`;
}
