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
