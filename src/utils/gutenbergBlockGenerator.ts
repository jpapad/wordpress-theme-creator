import { GutenbergBlockDefinition, WordPressThemeFile, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from './converter';

/**
 * Generates Gutenberg custom blocks (block.json + render.php) and registration code
 */
export function generateGutenbergBlockFiles(
  meta: WordPressThemeMeta,
  blocks?: GutenbergBlockDefinition[]
): WordPressThemeFile[] {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  const files: WordPressThemeFile[] = [];

  const defaultBlocks: GutenbergBlockDefinition[] = blocks && blocks.length > 0 ? blocks : [
    {
      id: 'block-hero',
      name: 'hero-banner',
      title: 'Hero Banner',
      icon: 'cover-image',
      category: 'theme-blocks',
      description: 'Modern high-converting hero banner with dynamic title and action button',
    },
    {
      id: 'block-features',
      name: 'feature-grid',
      title: 'Feature Cards Grid',
      icon: 'grid-view',
      category: 'theme-blocks',
      description: 'Responsive multi-column showcase cards with icon and description',
    },
  ];

  // 1. inc/gutenberg-blocks.php
  const registerCalls = defaultBlocks.map((b) => `
    register_block_type(get_template_directory() . '/blocks/${b.name}');
  `).join('\n');

  const blocksRegisterPhp = `<?php
/**
 * Register Gutenberg Custom Blocks & Categories
 *
 * @package ${meta.name}
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Theme Block Category
 */
function ${prefix}_register_block_category($categories) {
    return array_merge(
        $categories,
        array(
            array(
                'slug'  => 'theme-blocks',
                'title' => esc_html__('${meta.name} Custom Blocks', '${meta.textDomain}'),
                'icon'  => 'superhero',
            ),
        )
    );
}
add_filter('block_categories_all', '${prefix}_register_block_category', 10, 1);

/**
 * Register Native WordPress 6.x Blocks from block.json
 */
function ${prefix}_register_theme_blocks() {
${registerCalls}
}
add_action('init', '${prefix}_theme_blocks_init');
function ${prefix}_theme_blocks_init() {
${registerCalls}
}
`;

  files.push({
    path: 'inc/gutenberg-blocks.php',
    name: 'gutenberg-blocks.php',
    folder: 'inc',
    content: blocksRegisterPhp,
    language: 'php',
    purpose: 'WordPress 6.x Gutenberg block category and block.json registration hooks',
    isCore: false,
  });

  // 2. Generate blocks/hero-banner/block.json & render.php
  const heroBlockJson = {
    $schema: 'https://schemas.wp.org/trunk/block.json',
    apiVersion: 3,
    name: `${prefix}/hero-banner`,
    version: '1.0.0',
    title: `${meta.name} Hero Banner`,
    category: 'theme-blocks',
    icon: 'cover-image',
    description: 'Dynamic Hero Banner section with title, subtitle, and CTA button.',
    supports: {
      html: false,
      align: ['wide', 'full'],
      color: {
        background: true,
        text: true,
      },
      spacing: {
        padding: true,
        margin: true,
      },
    },
    attributes: {
      headline: {
        type: 'string',
        default: 'Crafting High-Performance Digital Products',
      },
      description: {
        type: 'string',
        default: 'Transforming complex challenges into elegant, intuitive web applications built for speed.',
      },
      buttonLabel: {
        type: 'string',
        default: 'Explore Portfolio',
      },
      buttonUrl: {
        type: 'string',
        default: '#',
      },
    },
    render: 'file:./render.php',
  };

  files.push({
    path: 'blocks/hero-banner/block.json',
    name: 'block.json',
    folder: 'blocks/hero-banner',
    content: JSON.stringify(heroBlockJson, null, 2),
    language: 'json',
    purpose: 'Gutenberg block manifest definition for Hero Banner',
    isCore: false,
  });

  const heroRenderPhp = `<?php
/**
 * Render template for Hero Banner Block
 *
 * @param array $attributes Block attributes.
 * @param string $content Block default content.
 * @param WP_Block $block Block instance.
 */

$headline     = !empty($attributes['headline']) ? $attributes['headline'] : esc_html__('Crafting High-Performance Digital Products', '${meta.textDomain}');
$description  = !empty($attributes['description']) ? $attributes['description'] : '';
$button_label = !empty($attributes['buttonLabel']) ? $attributes['buttonLabel'] : esc_html__('Explore Portfolio', '${meta.textDomain}');
$button_url   = !empty($attributes['buttonUrl']) ? $attributes['buttonUrl'] : '#';
$wrapper_attributes = get_block_wrapper_attributes(array(
    'class' => 'theme-block-hero-banner py-20 px-6 max-w-6xl mx-auto text-center',
));
?>

<div <?php echo $wrapper_attributes; ?>>
    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-white">
        <?php echo esc_html($headline); ?>
    </h1>
    
    <?php if ($description) : ?>
        <p class="text-lg sm:text-xl text-zinc-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            <?php echo esc_html($description); ?>
        </p>
    <?php endif; ?>

    <?php if ($button_label) : ?>
        <div>
            <a href="<?php echo esc_url($button_url); ?>" class="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20">
                <?php echo esc_html($button_label); ?> &rarr;
            </a>
        </div>
    <?php endif; ?>
</div>
`;

  files.push({
    path: 'blocks/hero-banner/render.php',
    name: 'render.php',
    folder: 'blocks/hero-banner',
    content: heroRenderPhp,
    language: 'php',
    purpose: 'PHP server-side render template for Hero Banner block',
    isCore: false,
  });

  // 3. Generate blocks/feature-grid/block.json & render.php
  const featureBlockJson = {
    $schema: 'https://schemas.wp.org/trunk/block.json',
    apiVersion: 3,
    name: `${prefix}/feature-grid`,
    version: '1.0.0',
    title: `${meta.name} Feature Cards`,
    category: 'theme-blocks',
    icon: 'grid-view',
    description: '3-Column responsive feature card showcase block.',
    supports: {
      align: ['wide', 'full'],
    },
    attributes: {
      title: {
        type: 'string',
        default: 'Key Features & Capabilities',
      },
    },
    render: 'file:./render.php',
  };

  files.push({
    path: 'blocks/feature-grid/block.json',
    name: 'block.json',
    folder: 'blocks/feature-grid',
    content: JSON.stringify(featureBlockJson, null, 2),
    language: 'json',
    purpose: 'Gutenberg block manifest definition for Feature Cards',
    isCore: false,
  });

  const featureRenderPhp = `<?php
/**
 * Render template for Feature Grid Block
 */

$title = !empty($attributes['title']) ? $attributes['title'] : esc_html__('Key Features & Capabilities', '${meta.textDomain}');
$wrapper_attributes = get_block_wrapper_attributes(array(
    'class' => 'theme-block-feature-grid py-16 px-4 max-w-7xl mx-auto',
));
?>

<section <?php echo $wrapper_attributes; ?>>
    <h2 class="text-3xl sm:text-4xl font-extrabold text-center mb-12 text-white"><?php echo esc_html($title); ?></h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
                <span class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg mb-4">01</span>
                <h3 class="text-xl font-bold text-white mb-2"><?php esc_html_e('Optimized Performance', '${meta.textDomain}'); ?></h3>
                <p class="text-zinc-400 text-sm leading-relaxed"><?php esc_html_e('Sub-second asset load times with async script execution and zero render blocking.', '${meta.textDomain}'); ?></p>
            </div>
        </div>

        <div class="p-8 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
                <span class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg mb-4">02</span>
                <h3 class="text-xl font-bold text-white mb-2"><?php esc_html_e('Elementor & FSE Ready', '${meta.textDomain}'); ?></h3>
                <p class="text-zinc-400 text-sm leading-relaxed"><?php esc_html_e('Compatible with Elementor Theme Builder and WordPress Full Site Editing theme.json tokens.', '${meta.textDomain}'); ?></p>
            </div>
        </div>

        <div class="p-8 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
                <span class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg mb-4">03</span>
                <h3 class="text-xl font-bold text-white mb-2"><?php esc_html_e('ACF & CPT Integration', '${meta.textDomain}'); ?></h3>
                <p class="text-zinc-400 text-sm leading-relaxed"><?php esc_html_e('Pre-wired Custom Post Types, Taxonomies, and ACF meta boxes with Local JSON sync.', '${meta.textDomain}'); ?></p>
            </div>
        </div>
    </div>
</section>
`;

  files.push({
    path: 'blocks/feature-grid/render.php',
    name: 'render.php',
    folder: 'blocks/feature-grid',
    content: featureRenderPhp,
    language: 'php',
    purpose: 'PHP server-side render template for Feature Grid block',
    isCore: false,
  });

  return files;
}
