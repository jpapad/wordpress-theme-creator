import JSZip from 'jszip';
import { WordPressThemeFile, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from './converter';

/**
 * Generates a clean 1200x900 screenshot.png data URL for WordPress themes
 */
export function generateThemeScreenshot(
  meta: WordPressThemeMeta,
  customAccent: string = '#f59e0b'
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(new Blob([], { type: 'image/png' }));
      return;
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 900);
    grad.addColorStop(0, '#09090d');
    grad.addColorStop(0.5, '#12131a');
    grad.addColorStop(1, '#0e0f14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 900);

    // Subtle background mesh glow
    const glow1 = ctx.createRadialGradient(250, 200, 50, 250, 200, 450);
    glow1.addColorStop(0, `${customAccent}26`);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 1200, 900);

    const glow2 = ctx.createRadialGradient(950, 700, 50, 950, 700, 400);
    glow2.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, 1200, 900);

    // Mockup Window Frame
    const frameX = 80;
    const frameY = 80;
    const frameW = 1040;
    const frameH = 740;
    const frameRadius = 24;

    // Window shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Window background
    ctx.fillStyle = '#16171f';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, [frameRadius]);
    ctx.fill();

    // Window border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Window Header Bar
    ctx.fillStyle = '#1e202c';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, 64, [frameRadius, frameRadius, 0, 0]);
    ctx.fill();

    // Window traffic light dots
    const dotColors = ['#ef4444', '#f59e0b', '#10b981'];
    dotColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(frameX + 32 + i * 22, frameY + 32, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mock Address / Title Bar
    ctx.fillStyle = '#121319';
    ctx.beginPath();
    ctx.roundRect(frameX + 130, frameY + 16, 780, 32, [16]);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`https://example.com/wp-admin/themes.php — ${meta.name}`, frameX + 520, frameY + 32);

    // Main Card Body Inside Window
    // WordPress Badge
    ctx.fillStyle = customAccent;
    ctx.beginPath();
    ctx.arc(frameX + 520, frameY + 190, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 52px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', frameX + 520, frameY + 190);

    // Theme Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(meta.name || 'WordPress Theme', frameX + 520, frameY + 280);

    // Description / Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const cleanDesc = (meta.description || 'Converted High-Performance WordPress Theme').slice(0, 70);
    ctx.fillText(cleanDesc, frameX + 520, frameY + 330);

    // Feature Badges Container
    const badges = [
      'Gutenberg Block Ready',
      'Full Site Editing (theme.json)',
      'WooCommerce Ready',
      'PHP 8.2+ Clean Code',
      'ACF Auto-Sync',
    ];

    const badgeStartX = frameX + 160;
    const badgeY = frameY + 400;
    const badgeSpacing = 145;

    badges.slice(0, 4).forEach((text, i) => {
      const bx = badgeStartX + i * 185;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(bx - 80, badgeY, 160, 36, [18]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(text, bx, badgeY + 18);
    });

    // Mock Content Preview Grid Inside Window
    const gridY = frameY + 470;
    for (let col = 0; col < 3; col++) {
      const gx = frameX + 80 + col * 295;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.roundRect(gx, gridY, 275, 180, [14]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Mock image top inside post card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.roundRect(gx + 12, gridY + 12, 251, 85, [8]);
      ctx.fill();

      // Mock text bars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(gx + 14, gridY + 112, 160, 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(gx + 14, gridY + 132, 230, 8);
      ctx.fillRect(gx + 14, gridY + 148, 190, 8);
    }

    // Bottom Meta Bar
    ctx.fillStyle = '#64748b';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Version ${meta.version || '1.0.0'} • Developed by ${meta.author || 'Author'} • Text Domain: ${meta.textDomain || 'custom-theme'}`, frameX + 520, frameY + frameH - 24);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}

/**
 * Creates and downloads a ready-to-install Child Theme .zip file
 */
export async function exportWordPressChildThemeZip(
  meta: WordPressThemeMeta,
  parentFiles: WordPressThemeFile[]
): Promise<Blob> {
  const zip = new JSZip();
  const parentSlug = sanitizeSlug(meta.name || meta.textDomain || 'custom-theme');
  const childFolderSlug = `${parentSlug}-child`;
  const childFolder = zip.folder(childFolderSlug);

  if (!childFolder) {
    throw new Error('Failed to create child theme directory inside zip');
  }

  const prefix = sanitizeSlug(meta.textDomain || parentSlug).replace(/-/g, '_');

  // 1. Child style.css with parent template declaration
  const childStyleCss = `/*
Theme Name: ${meta.name} Child
Theme URI: ${meta.themeUri || 'https://example.com'}
Description: Child theme for ${meta.name} with safe overrides and custom stylesheet inheritance.
Author: ${meta.author || 'Custom Theme Developer'}
Author URI: ${meta.authorUri || 'https://example.com'}
Template: ${parentSlug}
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${parentSlug}-child
*/

/* Add your custom child theme styles below */
`;
  childFolder.file('style.css', childStyleCss);

  // 2. Child functions.php with proper parent stylesheet enqueue
  const childFunctionsPhp = `<?php
/**
 * ${meta.name} Child Theme Functions and Definitions
 *
 * @link https://developer.wordpress.org/themes/advanced-topics/child-themes/
 *
 * @package ${meta.name}_Child
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Enqueue parent and child stylesheets cleanly
 */
function ${prefix}_child_enqueue_styles() {
    // Enqueue parent theme stylesheet
    wp_enqueue_style(
        '${parentSlug}-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme()->parent()->get('Version')
    );

    // Enqueue child theme stylesheet with dependency on parent
    wp_enqueue_style(
        '${parentSlug}-child-style',
        get_stylesheet_uri(),
        array('${parentSlug}-parent-style'),
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', '${prefix}_child_enqueue_styles');

/**
 * Add custom functions, hooks, or filters for ${meta.name} Child below:
 */
`;
  childFolder.file('functions.php', childFunctionsPhp);

  // 3. Child README.md
  const childReadme = `# ${meta.name} Child Theme

## Overview
This is a standard WordPress Child Theme for **${meta.name}**.

Using a child theme allows you to:
1. Update the parent theme (**${parentSlug}**) without losing your custom CSS modifications.
2. Override specific template files (e.g. copy \`header.php\` or \`single.php\` from the parent theme to edit).
3. Safely add custom hooks, shortcodes, and filters in \`functions.php\`.

## Installation Guide
1. Ensure the parent theme (\`${parentSlug}.zip\`) is installed in **Appearance > Themes**.
2. Click **Add New Theme > Upload Theme** and upload this \`${childFolderSlug}.zip\`.
3. Click **Activate**.
`;
  childFolder.file('README.md', childReadme);

  // 4. Generate screenshot for child theme
  try {
    const childMeta = {
      ...meta,
      name: `${meta.name} Child`,
      description: `Official Child Theme for ${meta.name}`,
    };
    const screenshotBlob = await generateThemeScreenshot(childMeta, '#3b82f6');
    childFolder.file('screenshot.png', screenshotBlob);
  } catch (err) {
    console.warn('Could not generate child theme screenshot.png:', err);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

/**
 * Creates and downloads a ready-to-install WordPress Theme .zip file
 */
export async function exportWordPressThemeZip(
  files: WordPressThemeFile[],
  meta: WordPressThemeMeta
): Promise<Blob> {
  const zip = new JSZip();
  const themeFolderSlug = sanitizeSlug(meta.name || meta.textDomain || 'custom-theme');
  const themeFolder = zip.folder(themeFolderSlug);

  if (!themeFolder) {
    throw new Error('Failed to create theme directory inside zip');
  }

  // Add all theme files
  files.forEach((file) => {
    themeFolder.file(file.path, file.content);
  });

  // Generate and attach screenshot.png
  try {
    const screenshotBlob = await generateThemeScreenshot(meta);
    themeFolder.file('screenshot.png', screenshotBlob);
  } catch (err) {
    console.warn('Could not generate screenshot.png:', err);
  }

  // Generate zip archive blob
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return content;
}

/**
 * Triggers a browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
