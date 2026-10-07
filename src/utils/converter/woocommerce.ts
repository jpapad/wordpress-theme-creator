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
