import { ConversionOptions, SourceFile, WordPressThemeMeta } from '../../types';
import { sanitizeSlug, commentSafe, toPhpPrefix } from './php';
import { ParsedHtmlStructure, parseHtmlStructure, parseOptionsFrom } from './parser';

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
  options: ConversionOptions,
  namedTemplate = true,
  /** Already parsed page (with editable sections); parsed here when omitted */
  parsed?: ParsedHtmlStructure
): string {
  // Header, footer, scripts removed; assets, links and bindings converted
  const mainBody = (parsed ?? parseHtmlStructure(file.content, parseOptionsFrom(options, meta.textDomain))).mainHtml;
  const templateName = file.templateName || file.name.replace(/\.html?$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Template';
  const slug = sanitizeSlug(file.name.replace(/\.html?$/i, ''));

  // Only files in templates/ are offered in the Page Attributes dropdown; page-{slug}.php is
  // picked automatically by the template hierarchy and must not duplicate the template name.
  const headerDoc = namedTemplate
    ? ` * Template Name: ${commentSafe(templateName)}
 * Template Post Type: post, page
 *
 * Description: Custom converted WordPress template for ${commentSafe(file.name)}`
    : ` * Template for the page with slug "${slug}" (converted from ${commentSafe(file.name)})`;

  return `<?php
/**
${headerDoc}
 *
 * @package ${commentSafe(meta.name)}
 */

get_header();
?>

${elementorAware(wrapMain(mainBody, `page-custom-${slug}`), meta, options)}

<?php
get_footer();
`;
}

/**
 * Wraps converted body markup in the theme's #primary landmark without nesting <main> elements.
 */
function wrapMain(body: string, extraClass: string): string {
  if (!body) {
    return `<main id="primary" class="site-main ${extraClass}">
    <div class="container">
        <?php
        while (have_posts()) :
            the_post();
            the_content();
        endwhile;
        ?>
    </div>
</main>`;
  }
  const tag = /<main[\s>]/i.test(body) ? 'div' : 'main';
  return `<${tag} id="primary" class="site-main ${extraClass}">
${body}
</${tag}>`;
}

/**
 * With Elementor enabled, a page built with Elementor shows its Elementor content
 * instead of the converted static markup.
 */
function elementorAware(markup: string, meta: WordPressThemeMeta, options: ConversionOptions): string {
  if (!options.enableElementor) return markup;
  const prefix = toPhpPrefix(meta.textDomain || meta.name);
  return `<?php if (function_exists('${prefix}_is_built_with_elementor') && ${prefix}_is_built_with_elementor()) : ?>
<main id="primary" class="site-main elementor-page">
    <?php
    while (have_posts()) :
        the_post();
        the_content();
    endwhile;
    ?>
</main>
<?php else : ?>
${markup}
<?php endif; ?>`;
}

/**
 * Generates front-page.php from the body of the main HTML file (hero, sections, CTAs...).
 */
export function generateFrontPagePhp(meta: WordPressThemeMeta, parsed: ParsedHtmlStructure, options?: ConversionOptions): string {
  return `<?php
/**
 * The front page template, converted from the main HTML file.
 *
 * WordPress uses this template for the site front page regardless of the
 * "Your homepage displays" setting. Blog posts are listed by home.php / index.php.
 *
 * @package ${commentSafe(meta.name)}
 */

get_header();
?>

${options ? elementorAware(wrapMain(parsed.mainHtml, 'front-page'), meta, options) : wrapMain(parsed.mainHtml, 'front-page')}

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
