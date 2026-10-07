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
import { sanitizeSlug } from './php';

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
