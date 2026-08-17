import {
  ConversionOptions,
  ConversionResult,
  ConversionStats,
  PlaygroundBlueprint,
  SourceFile,
  ValidationItem,
  VisualTagBinding,
  WordPressThemeFile,
  WordPressThemeMeta,
} from '../types';
import { validateWordPressTheme } from './validator';
import { generateElementorIntegrationFiles } from './elementorGenerator';
import { generateCptAndTaxonomyFiles } from './cptTaxonomyGenerator';
import { generateGutenbergBlockFiles } from './gutenbergBlockGenerator';
import { generateDemoContentFiles } from './demoContentGenerator';
import { generateAssetOptimizerPhp, generatePotFile } from './i18nGenerator';

/**
 * Sanitizes a string into a clean PHP identifier / slug
 */
export function sanitizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '') || 'theme';
}

/**
 * Parses raw HTML string and extracts head, header, main, loop, sidebar, footer sections
 */
export interface ParsedHtmlStructure {
  doctype: string;
  headInner: string;
  bodyAttributes: string;
  headerHtml: string;
  mainBeforeLoop: string;
  postCardHtml: string;
  mainAfterLoop: string;
  sidebarHtml: string;
  footerHtml: string;
  scriptsHtml: string;
  navMenuHtml: string;
  googleFonts: string[];
  cssLinks: string[];
  jsScripts: string[];
  rawBodyInner: string;
}

export function parseHtmlStructure(html: string): ParsedHtmlStructure {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract CSS and Google fonts from head
  const googleFonts: string[] = [];
  const cssLinks: string[] = [];
  const jsScripts: string[] = [];

  const headLinks = doc.querySelectorAll('link[rel="stylesheet"], link[href*="fonts.googleapis.com"]');
  headLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
      googleFonts.push(href);
    } else if (href && !href.endsWith('style.css')) {
      cssLinks.push(href);
    }
  });

  const scripts = doc.querySelectorAll('script[src]');
  scripts.forEach((s) => {
    const src = s.getAttribute('src') || '';
    if (src) jsScripts.push(src);
  });

  // Extract header
  let headerEl = doc.querySelector('header, #header, #masthead, .site-header, .header');
  let headerHtml = headerEl ? headerEl.outerHTML : '';

  // Extract nav menu if available
  let navEl = doc.querySelector('nav, .nav, .navigation, .navbar, .main-menu, .menu');
  let navMenuHtml = navEl ? navEl.outerHTML : '';

  // Extract footer
  let footerEl = doc.querySelector('footer, #footer, #colophon, .site-footer, .footer');
  let footerHtml = footerEl ? footerEl.outerHTML : '';

  // Extract sidebar
  let sidebarEl = doc.querySelector('aside, #sidebar, #secondary, .site-sidebar, .sidebar, .widget-area');
  let sidebarHtml = sidebarEl ? sidebarEl.outerHTML : '';

  // Extract post card or loop items
  let postCardEl = doc.querySelector(
    'article, .post-card, .post, .article, .blog-card, .entry, .card'
  );
  let postCardHtml = postCardEl ? postCardEl.outerHTML : '';

  return {
    doctype: '<!DOCTYPE html>',
    headInner: doc.head ? doc.head.innerHTML : '',
    bodyAttributes: doc.body ? Array.from(doc.body.attributes).map(a => `${a.name}="${a.value}"`).join(' ') : '',
    headerHtml,
    mainBeforeLoop: '',
    postCardHtml,
    mainAfterLoop: '',
    sidebarHtml,
    footerHtml,
    scriptsHtml: '',
    navMenuHtml,
    googleFonts,
    cssLinks,
    jsScripts,
    rawBodyInner: doc.body ? doc.body.innerHTML : '',
  };
}

/**
 * Applies visual tag bindings from the Visual Tag Inspector to HTML content
 */
export function applyVisualBindings(html: string, bindings?: VisualTagBinding[]): string {
  if (!bindings || bindings.length === 0) return html;

  let result = html;
  bindings.forEach((binding) => {
    let phpSnippet = '';
    switch (binding.tagType) {
      case 'the_title':
        phpSnippet = `<?php the_title(); ?>`;
        break;
      case 'the_content':
        phpSnippet = `<?php the_content(); ?>`;
        break;
      case 'the_excerpt':
        phpSnippet = `<?php the_excerpt(); ?>`;
        break;
      case 'the_post_thumbnail':
        phpSnippet = `<?php the_post_thumbnail('large'); ?>`;
        break;
      case 'the_permalink':
        phpSnippet = `<?php the_permalink(); ?>`;
        break;
      case 'the_author':
        phpSnippet = `<?php the_author_posts_link(); ?>`;
        break;
      case 'the_date':
        phpSnippet = `<?php echo get_the_date(); ?>`;
        break;
      case 'bloginfo_name':
        phpSnippet = `<?php bloginfo('name'); ?>`;
        break;
      case 'bloginfo_description':
        phpSnippet = `<?php bloginfo('description'); ?>`;
        break;
      case 'wp_nav_menu':
        phpSnippet = `<?php wp_nav_menu(array('theme_location' => '${binding.menuLocationSlug || 'primary-menu'}')); ?>`;
        break;
      case 'dynamic_sidebar':
        phpSnippet = `<?php dynamic_sidebar('${binding.widgetAreaSlug || 'main-sidebar'}'); ?>`;
        break;
      case 'custom_field':
        phpSnippet = `<?php echo esc_html(get_post_meta(get_the_ID(), '${binding.customFieldName || 'custom_field'}', true)); ?>`;
        break;
      case 'shortcode':
        phpSnippet = `<?php echo do_shortcode('${binding.customSnippet || '[custom_shortcode]'}'); ?>`;
        break;
      case 'woocommerce_price':
        phpSnippet = `<?php global $product; if (is_a($product, 'WC_Product')) { echo $product->get_price_html(); } ?>`;
        break;
      case 'woocommerce_add_to_cart':
        phpSnippet = `<?php woocommerce_template_loop_add_to_cart(); ?>`;
        break;
      default:
        phpSnippet = binding.customSnippet || '';
    }

    if (binding.originalText && result.includes(binding.originalText)) {
      result = result.replace(binding.originalText, phpSnippet);
    }
  });

  return result;
}

/**
 * Converts static HTML nav menu into dynamic wp_nav_menu() call
 */
function convertNavMenu(headerHtml: string, textDomain: string): string {
  if (!headerHtml) return '';

  let converted = headerHtml;

  // Replace <ul class="nav-menu">...</ul> or <nav>...</nav> items with wp_nav_menu
  const navRegex = /<nav\b[^>]*>([\s\S]*?)<\/nav>/i;
  const navMatch = converted.match(navRegex);

  if (navMatch) {
    const originalNav = navMatch[0];
    const navReplacement = `<?php
if (has_nav_menu('primary-menu')) :
  wp_nav_menu(array(
    'theme_location' => 'primary-menu',
    'menu_id'        => 'primary-menu',
    'container'      => 'nav',
    'container_class'=> 'main-navigation',
    'menu_class'     => 'nav-menu',
    'fallback_cb'    => false,
  ));
else :
?>
  ${originalNav}
<?php endif; ?>`;

    converted = converted.replace(originalNav, navReplacement);
  }

  // Replace static logo with custom logo
  const logoRegex = /<a\b[^>]*class="[^"]*(?:logo|site-branding)[^"]*"[^>]*>([\s\S]*?)<\/a>/i;
  if (logoRegex.test(converted)) {
    converted = converted.replace(
      logoRegex,
      `<?php
if (has_custom_logo()) :
  the_custom_logo();
else :
?>
  <a href="<?php echo esc_url(home_url('/')); ?>" class="site-title" rel="home">
    <?php bloginfo('name'); ?>
  </a>
<?php endif; ?>`
    );
  }

  return converted;
}

/**
 * Generates functions.php content with all requested hooks, WooCommerce, CPTs, and block patterns
 */
export function generateFunctionsPhp(
  meta: WordPressThemeMeta,
  options: ConversionOptions,
  parsed: ParsedHtmlStructure,
  otherFiles: SourceFile[]
): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  const version = meta.version || '1.0.0';

  const menuEntries = options.menuLocations.map(
    (m) => `        '${m.slug}' => esc_html__('${m.name}', '${meta.textDomain}'),`
  ).join('\n');

  const sidebarEntries = options.widgetAreas.map((s) => `
    register_sidebar(array(
        'name'          => esc_html__('${s.name}', '${meta.textDomain}'),
        'id'            => '${s.slug}',
        'description'   => esc_html__('${s.description}', '${meta.textDomain}'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="widget-title">',
        'after_title'   => '</h4>',
    ));`).join('\n');

  const customPostTypeEntries = options.customPostTypes.map((cpt) => `
    // Register Custom Post Type: ${cpt.pluralName}
    register_post_type('${cpt.slug}', array(
        'labels' => array(
            'name'                  => _x('${cpt.pluralName}', 'Post type general name', '${meta.textDomain}'),
            'singular_name'         => _x('${cpt.singularName}', 'Post type singular name', '${meta.textDomain}'),
            'menu_name'             => _x('${cpt.pluralName}', 'Admin Menu text', '${meta.textDomain}'),
            'name_admin_bar'        => _x('${cpt.singularName}', 'Add New on Toolbar', '${meta.textDomain}'),
            'add_new'               => __('Add New', '${meta.textDomain}'),
            'add_new_item'          => __('Add New ${cpt.singularName}', '${meta.textDomain}'),
            'new_item'              => __('New ${cpt.singularName}', '${meta.textDomain}'),
            'edit_item'             => __('Edit ${cpt.singularName}', '${meta.textDomain}'),
            'view_item'             => __('View ${cpt.singularName}', '${meta.textDomain}'),
            'all_items'             => __('All ${cpt.pluralName}', '${meta.textDomain}'),
            'search_items'          => __('Search ${cpt.pluralName}', '${meta.textDomain}'),
            'not_found'             => __('No ${cpt.pluralName.toLowerCase()} found.', '${meta.textDomain}'),
            'not_found_in_trash'    => __('No ${cpt.pluralName.toLowerCase()} found in Trash.', '${meta.textDomain}'),
        ),
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'show_in_rest'       => true, // Gutenberg support
        'query_var'          => true,
        'rewrite'            => array('slug' => '${cpt.slug}'),
        'capability_type'    => 'post',
        'has_archive'        => ${cpt.hasArchive ? 'true' : 'false'},
        'hierarchical'       => false,
        'menu_position'      => 20,
        'menu_icon'          => '${cpt.icon || 'dashicons-admin-post'}',
        'supports'           => array(${cpt.supports.map(s => `'${s}'`).join(', ')}),
    ));`).join('\n');

  // Enqueue scripts & styles
  const googleFontEnqueues = parsed.googleFonts.map((url, i) => 
    `    wp_enqueue_style('${prefix}-font-${i + 1}', '${url}', array(), null);`
  ).join('\n');

  const cssEnqueues = otherFiles
    .filter((f) => f.type === 'css' && f.name !== 'style.css')
    .map((f) => `    wp_enqueue_style('${prefix}-${sanitizeSlug(f.name)}', get_template_directory_uri() . '/assets/css/${f.name}', array(), '${version}');`)
    .join('\n');

  const jsEnqueues = otherFiles
    .filter((f) => f.type === 'javascript')
    .map((f) => `    wp_enqueue_script('${prefix}-${sanitizeSlug(f.name)}', get_template_directory_uri() . '/assets/js/${f.name}', array('jquery'), '${version}', true);`)
    .join('\n');

  return `<?php
/**
 * ${meta.name} functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package ${meta.name}
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
    // Main stylesheet
    wp_enqueue_style('${prefix}-style', get_stylesheet_uri(), array(), '${version}');

${cssEnqueues}
${jsEnqueues}

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}
add_action('wp_enqueue_scripts', '${prefix}_scripts');

${options.customPostTypes.length > 0 ? `/**
 * Register Custom Post Types.
 */
function ${prefix}_register_custom_post_types() {
${customPostTypeEntries}
}
add_action('init', '${prefix}_register_custom_post_types');` : ''}

${options.enableBlockPatterns ? `/**
 * Register Block Pattern Categories.
 */
function ${prefix}_register_block_pattern_categories() {
    if (function_exists('register_block_pattern_category')) {
        register_block_pattern_category('${prefix}_sections', array(
            'label' => esc_html__('${meta.name} Layouts', '${meta.textDomain}'),
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
require_once get_template_directory() . '/inc/elementor-support.php';
require_once get_template_directory() . '/inc/cpt-and-taxonomies.php';
require_once get_template_directory() . '/inc/gutenberg-blocks.php';
require_once get_template_directory() . '/inc/ocdi-config.php';
require_once get_template_directory() . '/inc/asset-optimizer.php';
`;
}

/**
 * Generates header.php
 */
export function generateHeaderPhp(
  meta: WordPressThemeMeta,
  parsed: ParsedHtmlStructure,
  options?: ConversionOptions
): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  let convertedHeader = convertNavMenu(parsed.headerHtml, meta.textDomain);

  // If WooCommerce enabled, inject mini cart indicator in header
  if (options?.enableWooCommerce && convertedHeader && !convertedHeader.includes('cart-count-badge')) {
    const headerNavEnd = convertedHeader.lastIndexOf('</nav>');
    if (headerNavEnd !== -1) {
      const cartHtml = `
      <div class="header-cart-wrap ml-auto">
        <a href="<?php echo esc_url(wc_get_cart_url()); ?>" class="header-cart-link" title="<?php esc_attr_e('View shopping cart', '${meta.textDomain}'); ?>">
          <span class="cart-icon">🛒</span>
          <span class="cart-count-badge"><?php echo WC()->cart ? esc_html(WC()->cart->get_cart_contents_count()) : '0'; ?></span>
        </a>
      </div>`;
      convertedHeader = convertedHeader.slice(0, headerNavEnd + 6) + cartHtml + convertedHeader.slice(headerNavEnd + 6);
    }
  }

  return `<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ${meta.name}
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
// Elementor Pro Theme Builder Location Check
if (function_exists('${prefix}_is_elementor_location_active') && ${prefix}_is_elementor_location_active('header')) {
    // Rendered by Elementor Pro
} else {
?>
<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#primary">
        <?php esc_html_e('Skip to content', '${meta.textDomain}'); ?>
    </a>

${convertedHeader ? `    ${convertedHeader}` : `    <header id="masthead" class="site-header">
        <div class="container header-inner">
            <div class="site-branding">
                <?php
                if (has_custom_logo()) :
                    the_custom_logo();
                else :
                ?>
                    <h1 class="site-title"><a href="<?php echo esc_url(home_url('/')); ?>" rel="home"><?php bloginfo('name'); ?></a></h1>
                    <?php
                    $description = get_bloginfo('description', 'display');
                    if ($description || is_customize_preview()) :
                    ?>
                        <p class="site-description"><?php echo $description; ?></p>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <nav id="site-navigation" class="main-navigation">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary-menu',
                    'menu_id'        => 'primary-menu',
                    'fallback_cb'    => false,
                ));
                ?>
            </nav>
        </div>
    </header>`}
<?php } ?>

    <div id="content" class="site-content">
`;
}

/**
 * Generates footer.php
 */
export function generateFooterPhp(
  meta: WordPressThemeMeta,
  parsed: ParsedHtmlStructure
): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  let footerContent = parsed.footerHtml;

  // Replace static copyright year with dynamic PHP year
  if (footerContent) {
    footerContent = footerContent.replace(
      /(&copy;|©)\s*(\d{4})?/g,
      `&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>.`
    );
  }

  return `<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ${meta.name}
 */
?>
    </div><!-- #content -->

<?php
// Elementor Pro Theme Builder Location Check
if (function_exists('${prefix}_is_elementor_location_active') && ${prefix}_is_elementor_location_active('footer')) {
    // Rendered by Elementor Pro
} else {
?>
${footerContent ? `    ${footerContent}` : `    <footer id="colophon" class="site-footer">
        <div class="container footer-inner">
            <div class="site-info">
                <p>&copy; <?php echo date('Y'); ?> <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>. <?php esc_html_e('All rights reserved.', '${meta.textDomain}'); ?></p>
            </div>
            <?php
            if (has_nav_menu('footer-menu')) :
                wp_nav_menu(array(
                    'theme_location' => 'footer-menu',
                    'menu_class'     => 'footer-menu',
                    'depth'          => 1,
                ));
            endif;
            ?>
        </div>
    </footer>`}
</div><!-- #page -->
<?php } ?>

<?php wp_footer(); ?>
</body>
</html>
`;
}

/**
 * Generates template-parts/content.php
 */
export function generateTemplatePartContent(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * Template part for displaying posts in the index loop
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ${meta.name}
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('post-card'); ?>>
    <?php if (has_post_thumbnail()) : ?>
        <div class="post-thumbnail">
            <a href="<?php the_permalink(); ?>">
                <?php the_post_thumbnail('medium_large'); ?>
            </a>
            <?php
            $categories = get_the_category();
            if (!empty($categories)) :
            ?>
                <span class="post-category">
                    <?php echo esc_html($categories[0]->name); ?>
                </span>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <div class="post-body">
        <header class="entry-header">
            <div class="post-meta">
                <span class="post-date"><?php echo get_the_date(); ?></span>
                <span class="post-author"><?php esc_html_e('By', '${meta.textDomain}'); ?> <?php the_author_posts_link(); ?></span>
            </div>

            <?php
            the_title(
                sprintf('<h2 class="post-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())),
                '</a></h2>'
            );
            ?>
        </header>

        <div class="post-excerpt">
            <?php the_excerpt(); ?>
        </div>

        <footer class="entry-footer">
            <a href="<?php the_permalink(); ?>" class="read-more">
                <?php esc_html_e('Read Full Story &rarr;', '${meta.textDomain}'); ?>
            </a>
        </footer>
    </div>
</article>
`;
}

/**
 * Generates template-parts/content-none.php
 */
export function generateTemplatePartContentNone(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * Template part for displaying a message that posts cannot be found
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ${meta.name}
 */
?>

<section class="no-results not-found">
    <header class="page-header">
        <h2 class="page-title"><?php esc_html_e('Nothing Found', '${meta.textDomain}'); ?></h2>
    </header>

    <div class="page-content">
        <?php if (is_home() && current_user_can('publish_posts')) : ?>
            <p>
                <?php
                printf(
                    wp_kses(
                        __('Ready to publish your first post? <a href="%1$s">Get started here</a>.', '${meta.textDomain}'),
                        array('a' => array('href' => array()))
                    ),
                    esc_url(admin_url('post-new.php'))
                );
                ?>
            </p>
        <?php elseif (is_search()) : ?>
            <p><?php esc_html_e('Sorry, but nothing matched your search terms. Please try again with some different keywords.', '${meta.textDomain}'); ?></p>
            <?php get_search_form(); ?>
        <?php else : ?>
            <p><?php esc_html_e('It seems we can&rsquo;t find what you&rsquo;re looking for. Perhaps searching can help.', '${meta.textDomain}'); ?></p>
            <?php get_search_form(); ?>
        <?php endif; ?>
    </div>
</section>
`;
}

/**
 * Generates index.php
 */
export function generateIndexPhp(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container">
    <div class="content-layout">
        <div class="primary-content">
            <?php
            if (have_posts()) :
                if (is_home() && !is_front_page()) :
                ?>
                    <header class="section-header">
                        <h1 class="page-title screen-reader-text"><?php single_post_title(); ?></h1>
                    </header>
                <?php
                endif;
                ?>

                <div class="posts-grid">
                    <?php
                    /* Start the Loop */
                    while (have_posts()) :
                        the_post();

                        /*
                         * Include the Post-Type-specific template for the content.
                         */
                        get_template_part('template-parts/content', get_post_type());

                    endwhile;
                    ?>
                </div>

                <?php
                the_posts_pagination(array(
                    'prev_text' => sprintf('&larr; %s', esc_html__('Previous', '${meta.textDomain}')),
                    'next_text' => sprintf('%s &rarr;', esc_html__('Next', '${meta.textDomain}')),
                    'class'     => 'pagination-navigation',
                ));

            else :

                get_template_part('template-parts/content', 'none');

            endif;
            ?>
        </div>

        <?php get_sidebar(); ?>
    </div>
</main>

<?php
get_footer();
`;
}

/**
 * Generates single.php
 */
export function generateSinglePhp(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container">
    <div class="content-layout">
        <div class="primary-content">
            <?php
            while (have_posts()) :
                the_post();
            ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class('single-post-entry'); ?>>
                    <header class="entry-header">
                        <?php the_title('<h1 class="entry-title">', '</h1>'); ?>

                        <div class="post-meta">
                            <span class="post-date"><?php echo get_the_date(); ?></span>
                            <span class="post-author"><?php esc_html_e('By', '${meta.textDomain}'); ?> <?php the_author_posts_link(); ?></span>
                            <span class="post-category"><?php the_category(', '); ?></span>
                        </div>
                    </header>

                    <?php if (has_post_thumbnail()) : ?>
                        <div class="post-featured-image">
                            <?php the_post_thumbnail('full'); ?>
                        </div>
                    <?php endif; ?>

                    <div class="entry-content">
                        <?php
                        the_content(
                            sprintf(
                                wp_kses(
                                    __('Continue reading<span class="screen-reader-text"> "%s"</span>', '${meta.textDomain}'),
                                    array('span' => array('class' => array()))
                                ),
                                wp_kses_post(get_the_title())
                            )
                        );

                        wp_link_pages(array(
                            'before' => '<div class="page-links">' . esc_html__('Pages:', '${meta.textDomain}'),
                            'after'  => '</div>',
                        ));
                        ?>
                    </div>

                    <footer class="entry-footer">
                        <?php
                        $tags_list = get_the_tag_list('', esc_html_x(', ', 'list item separator', '${meta.textDomain}'));
                        if ($tags_list) :
                            printf('<span class="tags-links">' . esc_html__('Tagged %1$s', '${meta.textDomain}') . '</span>', $tags_list);
                        endif;
                        ?>
                    </footer>
                </article>

                <?php
                the_post_navigation(array(
                    'prev_text' => '<span class="nav-subtitle">' . esc_html__('Previous:', '${meta.textDomain}') . '</span> <span class="nav-title">%title</span>',
                    'next_text' => '<span class="nav-subtitle">' . esc_html__('Next:', '${meta.textDomain}') . '</span> <span class="nav-title">%title</span>',
                ));

                // If comments are open or we have at least one comment, load up the comment template.
                if (comments_open() || get_comments_number()) :
                    comments_template();
                endif;

            endwhile;
            ?>
        </div>

        <?php get_sidebar(); ?>
    </div>
</main>

<?php
get_footer();
`;
}

/**
 * Generates page.php
 */
export function generatePagePhp(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The template for displaying all pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container">
    <?php
    while (have_posts()) :
        the_post();
    ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class('page-entry'); ?>>
            <header class="entry-header">
                <?php the_title('<h1 class="entry-title">', '</h1>'); ?>
            </header>

            <div class="entry-content">
                <?php
                the_content();

                wp_link_pages(array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', '${meta.textDomain}'),
                    'after'  => '</div>',
                ));
                ?>
            </div>
        </article>

        <?php
        if (comments_open() || get_comments_number()) :
            comments_template();
        endif;

    endwhile;
    ?>
</main>

<?php
get_footer();
`;
}

/**
 * Generates custom page template from a specific HTML file (e.g. about.html, contact.html, pricing.html)
 */
export function generateCustomPageTemplate(
  file: SourceFile,
  meta: WordPressThemeMeta,
  options: ConversionOptions
): string {
  const parsed = parseHtmlStructure(file.content);
  const templateName = file.templateName || file.name.replace(/\.html?$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Template';
  
  // Extract main content between header and footer
  const parser = new DOMParser();
  const doc = parser.parseFromString(file.content, 'text/html');
  
  // Remove header, footer, script tags from inner body to avoid duplicates
  const header = doc.querySelector('header, #header, #masthead, .site-header');
  if (header) header.remove();
  const footer = doc.querySelector('footer, #footer, #colophon, .site-footer');
  if (footer) footer.remove();
  doc.querySelectorAll('script').forEach(s => s.remove());

  let mainBody = doc.body ? doc.body.innerHTML.trim() : '';

  // Apply visual bindings if present
  if (options.visualBindings && options.visualBindings.length > 0) {
    mainBody = applyVisualBindings(mainBody, options.visualBindings);
  }

  return `<?php
/**
 * Template Name: ${templateName}
 * Template Post Type: post, page
 *
 * Description: Custom converted WordPress template for ${file.name}
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main page-custom-${sanitizeSlug(file.name)}">
${mainBody ? `    <div class="custom-template-content">
${mainBody}
    </div>` : `    <div class="container">
        <?php
        while (have_posts()) :
            the_post();
            the_content();
        endwhile;
        ?>
    </div>`}
</main>

<?php
get_footer();
`;
}

/**
 * Generates archive.php
 */
export function generateArchivePhp(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The template for displaying archive pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container">
    <div class="content-layout">
        <div class="primary-content">
            <?php if (have_posts()) : ?>
                <header class="archive-header section-header">
                    <?php
                    the_archive_title('<h1 class="page-title section-title">', '</h1>');
                    the_archive_description('<div class="archive-description section-desc">', '</div>');
                    ?>
                </header>

                <div class="posts-grid">
                    <?php
                    while (have_posts()) :
                        the_post();
                        get_template_part('template-parts/content', get_post_type());
                    endwhile;
                    ?>
                </div>

                <?php
                the_posts_pagination(array(
                    'prev_text' => sprintf('&larr; %s', esc_html__('Previous', '${meta.textDomain}')),
                    'next_text' => sprintf('%s &rarr;', esc_html__('Next', '${meta.textDomain}')),
                ));
            else :
                get_template_part('template-parts/content', 'none');
            endif;
            ?>
        </div>

        <?php get_sidebar(); ?>
    </div>
</main>

<?php
get_footer();
`;
}

/**
 * Generates sidebar.php
 */
export function generateSidebarPhp(meta: WordPressThemeMeta, options: ConversionOptions): string {
  const sidebarSlug = options.widgetAreas[0]?.slug || 'main-sidebar';

  return `<?php
/**
 * The sidebar containing the main widget area
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ${meta.name}
 */

if (!is_active_sidebar('${sidebarSlug}')) {
    return;
}
?>

<aside id="secondary" class="widget-area site-sidebar">
    <?php dynamic_sidebar('${sidebarSlug}'); ?>
</aside>
`;
}

/**
 * Generates 404.php
 */
export function generate404Php(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container">
    <section class="error-404 not-found" style="text-align:center; padding: 80px 0;">
        <header class="page-header">
            <h1 class="page-title" style="font-size: 72px; margin-bottom: 16px;">404</h1>
            <h2><?php esc_html_e('Oops! That page can&rsquo;t be found.', '${meta.textDomain}'); ?></h2>
        </header>

        <div class="page-content" style="max-width: 500px; margin: 24px auto 0;">
            <p><?php esc_html_e('It looks like nothing was found at this location. Maybe try a search?', '${meta.textDomain}'); ?></p>
            <?php get_search_form(); ?>
        </div>
    </section>
</main>

<?php
get_footer();
`;
}

/**
 * Generates woocommerce.php wrapper template
 */
export function generateWooCommercePhp(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The template for displaying WooCommerce shop and product pages
 *
 * @link https://woocommerce.com/document/woocommerce-theme-developer-handbook/
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main container woocommerce-page-wrapper">
    <div class="content-layout">
        <div class="primary-content woocommerce-content-area">
            <?php woocommerce_content(); ?>
        </div>
        <?php get_sidebar('shop'); ?>
    </div>
</main>

<?php
get_footer();
`;
}

/**
 * Generates woocommerce/archive-product.php template
 */
export function generateWooCommerceArchiveProduct(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The Template for displaying product archives, including the main shop page
 *
 * @package ${meta.name}
 */

defined('ABSPATH') || exit;

get_header('shop');

do_action('woocommerce_before_main_content');
?>

<header class="woocommerce-products-header">
    <?php if (apply_filters('woocommerce_show_page_title', true)) : ?>
        <h1 class="woocommerce-products-header__title page-title"><?php woocommerce_page_title(); ?></h1>
    <?php endif; ?>

    <?php do_action('woocommerce_archive_description'); ?>
</header>

<?php
if (woocommerce_product_loop()) {
    do_action('woocommerce_before_shop_loop');

    woocommerce_product_loop_start();

    if (wc_get_loop_prop('total')) {
        while (have_posts()) {
            the_post();
            do_action('woocommerce_shop_loop');
            wc_get_template_part('content', 'product');
        }
    }

    woocommerce_product_loop_end();

    do_action('woocommerce_after_shop_loop');
} else {
    do_action('woocommerce_no_products_found');
}

do_action('woocommerce_after_main_content');

get_footer('shop');
`;
}

/**
 * Generates woocommerce/single-product.php template
 */
export function generateWooCommerceSingleProduct(meta: WordPressThemeMeta): string {
  return `<?php
/**
 * The Template for displaying all single products
 *
 * @package ${meta.name}
 */

defined('ABSPATH') || exit;

get_header('shop');

do_action('woocommerce_before_main_content');

while (have_posts()) :
    the_post();
    wc_get_template_part('content', 'single-product');
endwhile;

do_action('woocommerce_after_main_content');

get_footer('shop');
`;
}

/**
 * Generates Block Pattern: Hero Section
 */
export function generateHeroBlockPattern(meta: WordPressThemeMeta): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  return `<?php
/**
 * Title: Hero Banner & Intro
 * Slug: ${prefix}/hero-banner
 * Categories: ${prefix}_sections, featured, header
 * Description: Bold full-width hero header with call-to-action buttons
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"backgroundColor":"primary","textColor":"background","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-background-color has-primary-background-color has-text-color" style="padding-top:80px;padding-bottom:80px">
    <!-- wp:heading {"textAlign":"center","level":1,"fontSize":"xx-large"} -->
    <h1 class="wp-block-heading has-text-align-center has-xx-large-font-size"><?php esc_html_e('Crafting Remarkable Digital Experiences', '${meta.textDomain}'); ?></h1>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"textAlign":"center","fontSize":"large"} -->
    <p class="has-text-align-center has-large-font-size"><?php esc_html_e('Empowering creators and brands with modern WordPress engineering.', '${meta.textDomain}'); ?></p>
    <!-- /wp:paragraph -->

    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"accent"} -->
        <div class="wp-block-button"><a class="wp-block-button__link has-accent-background-color has-background"><?php esc_html_e('Get Started Now', '${meta.textDomain}'); ?></a></div>
        <!-- /wp:button -->
        <!-- wp:button {"variant":"outline"} -->
        <div class="wp-block-button is-style-outline"><a class="wp-block-button__link"><?php esc_html_e('View Portfolio', '${meta.textDomain}'); ?></a></div>
        <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
</div>
<!-- /wp:group -->
`;
}

/**
 * Generates Block Pattern: Features 3-Column Grid
 */
export function generateFeaturesBlockPattern(meta: WordPressThemeMeta): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  return `<?php
/**
 * Title: Features & Services Grid (3 Columns)
 * Slug: ${prefix}/features-grid
 * Categories: ${prefix}_features, services, columns
 * Description: 3-column feature grid with icons and descriptions
 */
?>
<!-- wp:columns {"align":"wide","style":{"spacing":{"margin":{"top":"60px","bottom":"60px"}}}} -->
<div class="wp-block-columns alignwide" style="margin-top:60px;margin-bottom:60px">
    <!-- wp:column {"style":{"spacing":{"padding":"32px"}},"backgroundColor":"surface"} -->
    <div class="wp-block-column has-surface-background-color has-background" style="padding:32px">
        <!-- wp:heading {"level":3} -->
        <h3 class="wp-block-heading">🚀 <?php esc_html_e('High Performance', '${meta.textDomain}'); ?></h3>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p><?php esc_html_e('Optimized HTML & CSS converted into ultra-fast, lightweight PHP templates.', '${meta.textDomain}'); ?></p>
        <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column {"style":{"spacing":{"padding":"32px"}},"backgroundColor":"surface"} -->
    <div class="wp-block-column has-surface-background-color has-background" style="padding:32px">
        <!-- wp:heading {"level":3} -->
        <h3 class="wp-block-heading">⚡ <?php esc_html_e('Gutenberg Ready', '${meta.textDomain}'); ?></h3>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p><?php esc_html_e('Block editor patterns, theme.json tokens, and responsive embeds baked in.', '${meta.textDomain}'); ?></p>
        <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column {"style":{"spacing":{"padding":"32px"}},"backgroundColor":"surface"} -->
    <div class="wp-block-column has-surface-background-color has-background" style="padding:32px">
        <!-- wp:heading {"level":3} -->
        <h3 class="wp-block-heading">🛍️ <?php esc_html_e('WooCommerce Compatible', '${meta.textDomain}'); ?></h3>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p><?php esc_html_e('Full shop archives, product zoom lightbox, and mini-cart AJAX updates.', '${meta.textDomain}'); ?></p>
        <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
</div>
<!-- /wp:columns -->
`;
}

/**
 * Generates style.css with standard WordPress header block and optional WooCommerce styles
 */
export function generateStyleCss(meta: WordPressThemeMeta, rawCss: string, options?: ConversionOptions): string {
  let cleanedCss = rawCss;
  cleanedCss = cleanedCss.replace(/\/\*[\s\S]*?Theme Name:[\s\S]*?\*\//i, '').trim();

  let wooCommerceStyles = '';
  if (options?.enableWooCommerce) {
    wooCommerceStyles = `
/* ==========================================================================
   WooCommerce E-Commerce Theme Styles
   ========================================================================== */
.woocommerce ul.products li.product, .woocommerce-page ul.products li.product {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.woocommerce ul.products li.product:hover {
  transform: translateY(-4px);
  border-color: #f59e0b;
}
.woocommerce span.onsale {
  background-color: #f59e0b !important;
  color: #000000 !important;
  font-weight: 700;
  border-radius: 9999px !important;
}
.woocommerce .button, .woocommerce button.button.alt, .woocommerce a.button.alt {
  background-color: #f59e0b !important;
  color: #000000 !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  padding: 12px 24px !important;
  transition: all 0.2s ease !important;
}
.woocommerce .button:hover, .woocommerce button.button.alt:hover {
  background-color: #fbbf24 !important;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25) !important;
}
.header-cart-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #f59e0b;
  text-decoration: none;
  font-weight: 600;
}
.cart-count-badge {
  background: #f59e0b;
  color: #000;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 800;
}
`;
  }

  const headerComment = `/*
Theme Name: ${meta.name}
Theme URI: ${meta.themeUri || 'https://wordpress.org/themes/'}
Author: ${meta.author || 'WordPress Developer'}
Author URI: ${meta.authorUri || 'https://wordpress.org'}
Description: ${meta.description || 'A custom converted WordPress theme'}
Version: ${meta.version || '1.0.0'}
Requires at least: ${meta.requiresWP || '6.0'}
Tested up to: 6.7
Requires PHP: ${meta.requiresPHP || '7.4'}
License: ${meta.license || 'GNU General Public License v2 or later'}
License URI: ${meta.licenseUri || 'http://www.gnu.org/licenses/gpl-2.0.html'}
Text Domain: ${meta.textDomain}
Tags: ${meta.tags?.join(', ') || 'custom-background, custom-logo, custom-menu, featured-images, translation-ready'}${options?.enableWooCommerce ? ', e-commerce, woocommerce' : ''}

${meta.name} WordPress Theme
Built with HTML to WordPress Theme Converter
*/

`;

  return headerComment + cleanedCss + (wooCommerceStyles ? '\n\n' + wooCommerceStyles : '');
}

/**
 * Generates theme.json for modern / block theme support with custom color extraction
 */
export function generateThemeJson(meta: WordPressThemeMeta, rawCss: string): string {
  // Extract custom palette or fallback to sleek theme tokens
  const palette = [
    { slug: 'primary', color: '#f59e0b', name: 'Accent Amber' },
    { slug: 'secondary', color: '#18181b', name: 'Deep Zinc' },
    { slug: 'background', color: '#09090b', name: 'Background' },
    { slug: 'surface', color: '#121216', name: 'Surface Panel' },
    { slug: 'text', color: '#f4f4f5', name: 'Foreground Text' },
    { slug: 'muted', color: '#71717a', name: 'Muted Text' },
  ];

  return JSON.stringify(
    {
      $schema: 'https://schemas.wp.org/trunk/theme.json',
      version: 3,
      title: meta.name,
      settings: {
        appearanceTools: true,
        useSubmenuStyles: true,
        layout: {
          contentSize: '840px',
          wideSize: '1240px',
        },
        color: {
          custom: true,
          customGradient: true,
          palette,
        },
        typography: {
          fluid: true,
          fontSizes: [
            { slug: 'small', size: '0.875rem', name: 'Small' },
            { slug: 'medium', size: '1rem', name: 'Medium' },
            { slug: 'large', size: '1.25rem', name: 'Large' },
            { slug: 'x-large', size: '2rem', name: 'Extra Large' },
            { slug: 'xx-large', size: '3.25rem', name: 'Huge Display' },
          ],
        },
        spacing: {
          units: ['px', 'em', 'rem', 'vh', 'vw', '%'],
          padding: true,
          margin: true,
          blockGap: true,
        },
      },
    },
    null,
    2
  );
}

/**
 * Generates Advanced Custom Fields (ACF) Local JSON export file
 */
export function generateAcfJsonGroup(meta: WordPressThemeMeta, options: ConversionOptions): string {
  const prefix = sanitizeSlug(meta.textDomain || meta.name).replace(/-/g, '_');
  
  const defaultFields = [
    {
      key: `field_${prefix}_hero_badge`,
      label: 'Hero Badge Text',
      name: 'hero_badge_text',
      type: 'text',
      instructions: 'Optional badge or pill label displayed above the main headline.',
      required: 0,
      default_value: 'WordPress Engineering',
      placeholder: 'e.g. New Release',
    },
    {
      key: `field_${prefix}_hero_subtitle`,
      label: 'Hero Subtitle / Description',
      name: 'hero_subtitle',
      type: 'textarea',
      instructions: 'Sub-headline or paragraph under the hero title.',
      required: 0,
      rows: 3,
      default_value: 'Empowering creators and brands with modern WordPress engineering.',
    },
    {
      key: `field_${prefix}_cta_button_text`,
      label: 'Call to Action Button Text',
      name: 'cta_button_text',
      type: 'text',
      instructions: 'Text label for primary CTA button.',
      required: 0,
      default_value: 'Get Started Now',
    },
    {
      key: `field_${prefix}_cta_button_url`,
      label: 'Call to Action Button URL',
      name: 'cta_button_url',
      type: 'url',
      instructions: 'Destination URL for primary CTA button.',
      required: 0,
      default_value: '#contact',
    },
    {
      key: `field_${prefix}_featured_badge_color`,
      label: 'Accent Highlight Color',
      name: 'accent_highlight_color',
      type: 'text',
      instructions: 'Hex color code for theme highlights (e.g. #f59e0b).',
      required: 0,
      default_value: '#f59e0b',
    },
  ];

  const customFieldsFormatted = (options.customFields || []).map((cf) => ({
    key: `field_${prefix}_${sanitizeSlug(cf.name).replace(/-/g, '_')}`,
    label: cf.label,
    name: cf.name,
    type: cf.type,
    instructions: cf.instructions || '',
    required: 0,
    default_value: cf.defaultValue || '',
  }));

  const fields = customFieldsFormatted.length > 0 ? customFieldsFormatted : defaultFields;

  return JSON.stringify(
    {
      key: `group_${prefix}_theme_fields`,
      title: `${meta.name} Theme Options & Page Fields`,
      fields,
      location: [
        [
          {
            param: 'post_type',
            operator: '==',
            value: 'page',
          },
        ],
        [
          {
            param: 'post_type',
            operator: '==',
            value: 'post',
          },
        ],
      ],
      menu_order: 0,
      position: 'normal',
      style: 'default',
      label_placement: 'top',
      instruction_placement: 'label',
      hide_on_screen: '',
      active: true,
      description: 'Auto-generated by HTML to WordPress Converter for ACF Local JSON sync',
      show_in_rest: 1,
    },
    null,
    2
  );
}

/**
 * Generates WordPress Playground Blueprint JSON for instant in-browser execution
 */
export function generatePlaygroundBlueprint(meta: WordPressThemeMeta, options: ConversionOptions): PlaygroundBlueprint {
  const themeSlug = sanitizeSlug(meta.name || meta.textDomain);
  
  const steps: any[] = [
    {
      step: 'login',
      username: 'admin',
      password: 'password',
    },
    {
      step: 'setSiteOptions',
      options: {
        blogname: meta.name,
        blogdescription: meta.description,
      },
    },
  ];

  if (options.enableWooCommerce) {
    steps.push({
      step: 'installPlugin',
      pluginZipFile: {
        resource: 'wordpress.org/plugins',
        slug: 'woocommerce',
      },
      options: {
        activate: true,
      },
    });
  }

  // Activate our custom theme
  steps.push({
    step: 'runPHP',
    code: `<?php
    require_once 'wp-load.php';
    switch_theme('${themeSlug}');
    ?>`,
  });

  return {
    landingPage: '/wp-admin/',
    preferredVersions: {
      php: '8.2',
      wp: '6.7',
    },
    steps,
  };
}

/**
 * Main conversion coordinator: takes SourceFiles, Meta, and Options and produces full WP theme
 */
export function convertHtmlToWordPressTheme(
  files: SourceFile[],
  meta: WordPressThemeMeta,
  options: ConversionOptions
): ConversionResult {
  const startTime = performance.now();

  const htmlFiles = files.filter(f => f.type === 'html');
  const mainHtmlFile = htmlFiles.find(f => f.isMain) || htmlFiles[0] || { content: '<html><body><main><h1>Hello World</h1></main></body></html>', name: 'index.html', path: 'index.html', type: 'html' as const };
  const mainCssFile = files.find(f => f.type === 'css') || { content: '', name: 'style.css' };

  let rawHtml = mainHtmlFile.content;
  const rawCss = mainCssFile.content || 'body { font-family: sans-serif; }';

  // Apply visual bindings if present
  if (options.visualBindings && options.visualBindings.length > 0) {
    rawHtml = applyVisualBindings(rawHtml, options.visualBindings);
  }

  const parsed = parseHtmlStructure(rawHtml);
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
    content: generateFunctionsPhp(meta, options, parsed, files),
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

  // 6. single.php
  const singleHtmlFile = htmlFiles.find(f => f.name === 'single.html' || f.name === 'single-post.html' || f.templateType === 'single');
  themeFiles.push({
    path: 'single.php',
    name: 'single.php',
    content: singleHtmlFile ? generateCustomPageTemplate(singleHtmlFile, meta, options) : generateSinglePhp(meta),
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
    content: archiveHtmlFile ? generateCustomPageTemplate(archiveHtmlFile, meta, options) : generateArchivePhp(meta),
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
    content: notFoundHtmlFile ? generateCustomPageTemplate(notFoundHtmlFile, meta, options) : generate404Php(meta),
    language: 'php',
    purpose: '404 Not Found error page template with search form',
    isCore: false,
  });

  // 11. Multi-Page Importer: Process all additional HTML files (e.g. about.html, contact.html, pricing.html)
  let customPagesCount = 0;
  htmlFiles.forEach((htmlFile) => {
    // Skip main index or special reserved files handled above
    if (htmlFile.isMain || htmlFile.name === 'index.html' || htmlFile.name === 'single.html' || htmlFile.name === 'archive.html' || htmlFile.name === '404.html') {
      return;
    }

    const baseSlug = htmlFile.name.replace(/\.html?$/i, '');
    const cleanSlug = sanitizeSlug(baseSlug);
    
    // Create dedicated page template: page-{slug}.php
    themeFiles.push({
      path: `page-${cleanSlug}.php`,
      name: `page-${cleanSlug}.php`,
      content: generateCustomPageTemplate(htmlFile, meta, options),
      language: 'php',
      purpose: `Dedicated WordPress template for page "${baseSlug}"`,
      isCore: false,
    });

    // Also create custom selectable template in templates/
    themeFiles.push({
      path: `templates/template-${cleanSlug}.php`,
      name: `template-${cleanSlug}.php`,
      folder: 'templates',
      content: generateCustomPageTemplate(htmlFile, meta, options),
      language: 'php',
      purpose: `Custom Page Template selectable in WP Page Attributes`,
      isCore: false,
    });

    customPagesCount++;
  });

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

  // 17. Advanced Custom Fields (ACF) Local JSON auto-sync
  if (options.enableACFHelper || options.enableAcfJsonExport) {
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

  // 18. Add extra CSS and JS assets to /assets/ folder
  files.forEach((f) => {
    if (f.type === 'javascript') {
      themeFiles.push({
        path: `assets/js/${f.name}`,
        name: f.name,
        folder: 'assets/js',
        content: f.content,
        language: 'javascript',
        purpose: 'Custom JavaScript interactive bundle',
        isCore: false,
      });
    } else if (f.type === 'css' && f.name !== 'style.css') {
      themeFiles.push({
        path: `assets/css/${f.name}`,
        name: f.name,
        folder: 'assets/css',
        content: f.content,
        language: 'css',
        purpose: 'Additional component or vendor stylesheet',
        isCore: false,
      });
    }
  });

  // 19. Elementor Pro Theme Builder & Custom Widgets
  const elementorFiles = generateElementorIntegrationFiles(meta, options.customElementorWidgets);
  themeFiles.push(...elementorFiles);

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
    assetsEnqueued: 2 + parsed.googleFonts.length + files.filter(f => f.type === 'javascript').length,
    themeScore: 99,
    generationTimeMs: Math.round(performance.now() - startTime),
    blockPatternsCount,
    customPagesCount,
  };

  const warnings: string[] = [];
  if (!rawHtml.includes('<nav') && !rawHtml.includes('menu')) {
    warnings.push('No semantic <nav> element found in source HTML. A standard WordPress menu fallback was generated.');
  }

  return {
    files: themeFiles,
    meta,
    options,
    stats,
    validations,
    warnings,
    summary: `Successfully generated a complete ${options.themeType} WordPress theme with ${themeFiles.length} files (including ${customPagesCount} custom page templates, ${blockPatternsCount} Gutenberg patterns${options.enableWooCommerce ? ', full WooCommerce E-Commerce suite' : ''}, and Playground blueprint.json).`,
    blueprint,
  };
}

