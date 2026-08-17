import { CustomPostType, CustomTaxonomy, WordPressThemeFile, WordPressThemeMeta } from '../types';
import { sanitizeSlug } from './converter';

/**
 * Generates Custom Post Type and Custom Taxonomy registration code and template files
 */
export function generateCptAndTaxonomyFiles(
  meta: WordPressThemeMeta,
  cpts: CustomPostType[],
  taxonomies?: CustomTaxonomy[]
): WordPressThemeFile[] {
  const prefix = sanitizeSlug(meta.textDomain || meta.name);
  const files: WordPressThemeFile[] = [];

  const defaultTaxonomies: CustomTaxonomy[] = taxonomies && taxonomies.length > 0 ? taxonomies : [
    {
      id: 'tax-project-type',
      slug: 'project_type',
      singularName: 'Project Category',
      pluralName: 'Project Categories',
      postTypes: ['portfolio'],
      hierarchical: true,
    },
    {
      id: 'tax-skills',
      slug: 'skill_tag',
      singularName: 'Skill Tag',
      pluralName: 'Skill Tags',
      postTypes: ['portfolio'],
      hierarchical: false,
    },
  ];

  // 1. inc/cpt-and-taxonomies.php
  const cptPhpSnippets = cpts.map((cpt) => `
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
        'menu_icon'          => '${cpt.icon || 'dashicons-portfolio'}',
        'supports'           => array(${cpt.supports.map(s => `'${s}'`).join(', ')}),
    ));`).join('\n');

  const taxPhpSnippets = defaultTaxonomies.map((tax) => `
    // Register Custom Taxonomy: ${tax.pluralName}
    register_taxonomy('${tax.slug}', array(${tax.postTypes.map(p => `'${p}'`).join(', ')}), array(
        'labels' => array(
            'name'              => _x('${tax.pluralName}', 'taxonomy general name', '${meta.textDomain}'),
            'singular_name'     => _x('${tax.singularName}', 'taxonomy singular name', '${meta.textDomain}'),
            'search_items'      => __('Search ${tax.pluralName}', '${meta.textDomain}'),
            'all_items'         => __('All ${tax.pluralName}', '${meta.textDomain}'),
            'parent_item'       => __('Parent ${tax.singularName}', '${meta.textDomain}'),
            'parent_item_colon' => __('Parent ${tax.singularName}:', '${meta.textDomain}'),
            'edit_item'         => __('Edit ${tax.singularName}', '${meta.textDomain}'),
            'update_item'       => __('Update ${tax.singularName}', '${meta.textDomain}'),
            'add_new_item'      => __('Add New ${tax.singularName}', '${meta.textDomain}'),
            'new_item_name'     => __('New ${tax.singularName} Name', '${meta.textDomain}'),
            'menu_name'         => __('${tax.pluralName}', '${meta.textDomain}'),
        ),
        'hierarchical'      => ${tax.hierarchical ? 'true' : 'false'},
        'show_ui'           => true,
        'show_admin_column' => true,
        'query_var'         => true,
        'show_in_rest'      => true,
        'rewrite'           => array('slug' => '${tax.slug}'),
    ));`).join('\n');

  const cptAndTaxonomiesPhp = `<?php
/**
 * Custom Post Types & Custom Taxonomies Registration
 *
 * @package ${meta.name}
 */

if (!defined('ABSPATH')) {
    exit;
}

function ${prefix}_register_cpts_and_taxonomies() {
${cptPhpSnippets}
${taxPhpSnippets}
}
add_action('init', '${prefix}_register_cpts_and_taxonomies', 0);
`;

  files.push({
    path: 'inc/cpt-and-taxonomies.php',
    name: 'cpt-and-taxonomies.php',
    folder: 'inc',
    content: cptAndTaxonomiesPhp,
    language: 'php',
    purpose: 'Custom Post Types (CPT) and Custom Taxonomies registration hooks and labels',
    isCore: false,
  });

  // 2. Generate dedicated single-{cpt}.php and archive-{cpt}.php for each CPT
  cpts.forEach((cpt) => {
    // Single CPT Template
    const singleCptContent = `<?php
/**
 * The template for displaying single ${cpt.singularName} items
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main py-12 px-4 max-w-5xl mx-auto">
    <?php
    while (have_posts()) :
        the_post();
        ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class('single-${cpt.slug}-item'); ?>>
            <header class="entry-header mb-8 text-center">
                <h1 class="entry-title text-4xl sm:text-5xl font-extrabold mb-4"><?php the_title(); ?></h1>
                
                <?php if (has_term('', 'project_type')) : ?>
                    <div class="cpt-terms mb-4">
                        <span class="inline-block px-3 py-1 text-xs font-semibold uppercase bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                            <?php the_terms(get_the_ID(), 'project_type', '', ', '); ?>
                        </span>
                    </div>
                <?php endif; ?>
            </header>

            <?php if (has_post_thumbnail()) : ?>
                <div class="post-thumbnail mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <?php the_post_thumbnail('full', array('class' => 'w-full h-auto object-cover')); ?>
                </div>
            <?php endif; ?>

            <div class="entry-content prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                <?php
                the_content();

                wp_link_pages(array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', '${meta.textDomain}'),
                    'after'  => '</div>',
                ));
                ?>
            </div>

            <?php if (function_exists('get_field')) : ?>
                <!-- ACF Custom Fields Area -->
                <div class="cpt-custom-meta mt-12 p-6 rounded-2xl bg-zinc-900/80 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <?php if (get_field('client_name')) : ?>
                        <div>
                            <span class="text-xs uppercase text-zinc-500 font-bold block">Client:</span>
                            <strong class="text-white text-base"><?php echo esc_html(get_field('client_name')); ?></strong>
                        </div>
                    <?php endif; ?>
                    <?php if (get_field('completion_date')) : ?>
                        <div>
                            <span class="text-xs uppercase text-zinc-500 font-bold block">Date:</span>
                            <strong class="text-white text-base"><?php echo esc_html(get_field('completion_date')); ?></strong>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </article>

        <?php
        the_post_navigation(array(
            'prev_text' => '<span class="nav-subtitle">' . esc_html__('Previous ${cpt.singularName}:', '${meta.textDomain}') . '</span> <span class="nav-title">%title</span>',
            'next_text' => '<span class="nav-subtitle">' . esc_html__('Next ${cpt.singularName}:', '${meta.textDomain}') . '</span> <span class="nav-title">%title</span>',
        ));

    endwhile;
    ?>
</main>

<?php
get_footer();
`;

    files.push({
      path: `single-${cpt.slug}.php`,
      name: `single-${cpt.slug}.php`,
      content: singleCptContent,
      language: 'php',
      purpose: `Dedicated single view template for ${cpt.singularName} post type`,
      isCore: false,
    });

    // Archive CPT Template (if hasArchive is true)
    if (cpt.hasArchive) {
      const archiveCptContent = `<?php
/**
 * The template for displaying ${cpt.pluralName} archive catalog
 *
 * @package ${meta.name}
 */

get_header();
?>

<main id="primary" class="site-main py-12 px-4 max-w-7xl mx-auto">
    <header class="page-header mb-12 text-center">
        <h1 class="page-title text-4xl sm:text-5xl font-extrabold mb-4"><?php post_type_archive_title(); ?></h1>
        <div class="archive-description text-zinc-400 max-w-2xl mx-auto">
            <?php the_archive_description(); ?>
        </div>
    </header>

    <?php if (have_posts()) : ?>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <?php
            while (have_posts()) :
                the_post();
                ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class('bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-amber-500/40 transition-all duration-300 shadow-xl'); ?>>
                    <?php if (has_post_thumbnail()) : ?>
                        <a href="<?php the_permalink(); ?>" class="aspect-video overflow-hidden block">
                            <?php the_post_thumbnail('medium_large', array('class' => 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500')); ?>
                        </a>
                    <?php endif; ?>

                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <h2 class="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h2>
                            <div class="text-zinc-400 text-sm line-clamp-3 mb-4">
                                <?php the_excerpt(); ?>
                            </div>
                        </div>

                        <a href="<?php the_permalink(); ?>" class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider">
                            <span>View ${cpt.singularName}</span> &rarr;
                        </a>
                    </div>
                </article>
                <?php
            endwhile;
            ?>
        </div>

        <div class="mt-12 text-center">
            <?php
            the_posts_pagination(array(
                'prev_text' => '&larr; ' . esc_html__('Previous', '${meta.textDomain}'),
                'next_text' => esc_html__('Next', '${meta.textDomain}') . ' &rarr;',
            ));
            ?>
        </div>
    <?php else : ?>
        <p class="text-center text-zinc-400"><?php esc_html_e('No items found in this section.', '${meta.textDomain}'); ?></p>
    <?php endif; ?>
</main>

<?php
get_footer();
`;

      files.push({
        path: `archive-${cpt.slug}.php`,
        name: `archive-${cpt.slug}.php`,
        content: archiveCptContent,
        language: 'php',
        purpose: `Dedicated archive grid template for ${cpt.pluralName}`,
        isCore: false,
      });
    }
  });

  return files;
}
