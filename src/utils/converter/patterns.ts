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
import { sanitizeSlug, toPhpPrefix } from './php';

/**
 * Generates Block Pattern: Hero Section
 */
export function generateHeroBlockPattern(meta: WordPressThemeMeta): string {
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
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
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
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
