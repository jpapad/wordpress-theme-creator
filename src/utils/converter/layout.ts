import { ConversionOptions, WordPressThemeMeta } from '../../types';
import { toPhpPrefix, phpStr, commentSafe } from './php';
import { ParsedHtmlStructure } from './parser';

/**
 * Generates header.php
 */
export function generateHeaderPhp(
  meta: WordPressThemeMeta,
  parsed: ParsedHtmlStructure,
  options?: ConversionOptions
): string {
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
  const menuLocation = phpStr(options?.menuLocations?.[0]?.slug || 'primary-menu');
  // Navigation, logo and WooCommerce cart were converted by parseHtmlStructure()
  const convertedHeader = parsed.headerHtml;
  return `<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ${commentSafe(meta.name)}
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
                        <p class="site-description"><?php echo esc_html($description); ?></p>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <nav id="site-navigation" class="main-navigation">
                <?php
                wp_nav_menu(array(
                    'theme_location' => '${menuLocation}',
                    'menu_id'        => '${menuLocation}',
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
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
  // Copyright year was made dynamic by parseHtmlStructure()
  const footerContent = parsed.footerHtml;

  return `<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ${commentSafe(meta.name)}
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
                <p>&copy; <?php echo esc_html(wp_date('Y')); ?> <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>. <?php esc_html_e('All rights reserved.', '${meta.textDomain}'); ?></p>
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
