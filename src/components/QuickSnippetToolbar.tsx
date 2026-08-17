import React from 'react';
import { 
  Plus, 
  Code, 
  FileCode, 
  Menu, 
  Image, 
  Layers, 
  Bookmark, 
  Sliders, 
  Zap, 
  FileText 
} from 'lucide-react';

interface QuickSnippetToolbarProps {
  onInsertSnippet: (snippet: string) => void;
}

interface SnippetItem {
  label: string;
  category: 'Loop' | 'Tags' | 'Assets' | 'Menus';
  snippet: string;
  description: string;
}

const COMMON_WORDPRESS_SNIPPETS: SnippetItem[] = [
  {
    label: 'Standard WP Loop',
    category: 'Loop',
    description: 'Standard WordPress post query loop with have_posts()',
    snippet: `<?php if ( have_posts() ) : ?>
  <div class="posts-grid">
    <?php while ( have_posts() ) : the_post(); ?>
      <article id="post-<?php the_ID(); ?>" <?php post_class('post-card'); ?>>
        <?php if ( has_post_thumbnail() ) : ?>
          <a href="<?php the_permalink(); ?>" class="post-thumbnail">
            <?php the_post_thumbnail('medium_large'); ?>
          </a>
        <?php endif; ?>
        <h2 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <div class="entry-excerpt"><?php the_excerpt(); ?></div>
        <div class="entry-meta">
          <span>By <?php the_author_posts_link(); ?></span> &bull; 
          <time datetime="<?php echo esc_attr( get_the_date('c') ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
        </div>
      </article>
    <?php endwhile; ?>
  </div>
  <?php the_posts_pagination(array('prev_text' => '&larr; Previous', 'next_text' => 'Next &rarr;')); ?>
<?php else : ?>
  <p><?php esc_html_e( 'No posts found.', 'textdomain' ); ?></p>
<?php endif; ?>`,
  },
  {
    label: 'wp_nav_menu()',
    category: 'Menus',
    description: 'Header primary navigation menu call',
    snippet: `<?php
wp_nav_menu( array(
    'theme_location' => 'primary-menu',
    'container'      => 'nav',
    'container_class'=> 'site-navigation primary-nav',
    'menu_class'     => 'nav-list flex items-center gap-6',
    'fallback_cb'    => false,
) );
?>`,
  },
  {
    label: 'the_post_thumbnail()',
    category: 'Tags',
    description: 'Featured image template tag with fallback',
    snippet: `<?php if ( has_post_thumbnail() ) : ?>
    <figure class="featured-image">
        <?php the_post_thumbnail( 'full', array( 'class' => 'rounded-xl shadow-lg w-full h-auto' ) ); ?>
    </figure>
<?php endif; ?>`,
  },
  {
    label: 'get_template_part()',
    category: 'Assets',
    description: 'Include modular template file from template-parts/',
    snippet: `<?php get_template_part( 'template-parts/content', get_post_type() ); ?>`,
  },
  {
    label: 'dynamic_sidebar()',
    category: 'Tags',
    description: 'Render registered sidebar widget area',
    snippet: `<?php if ( is_active_sidebar( 'main-sidebar' ) ) : ?>
    <aside id="secondary" class="widget-area sidebar">
        <?php dynamic_sidebar( 'main-sidebar' ); ?>
    </aside>
<?php endif; ?>`,
  },
  {
    label: 'the_custom_logo()',
    category: 'Tags',
    description: 'Render custom site logo with fallback site title',
    snippet: `<?php
if ( function_exists( 'the_custom_logo' ) && has_custom_logo() ) {
    the_custom_logo();
} else {
    echo '<a href="' . esc_url( home_url( '/' ) ) . '" class="site-title font-bold text-xl">' . esc_html( get_bloginfo( 'name' ) ) . '</a>';
}
?>`,
  },
  {
    label: 'get_theme_mod() Customizer',
    category: 'Tags',
    description: 'Retrieve dynamic customizer setting with fallback',
    snippet: `<?php echo esc_html( get_theme_mod( 'hero_heading_text', 'Default Welcome Headline' ) ); ?>`,
  },
];

export const QuickSnippetToolbar: React.FC<QuickSnippetToolbarProps> = ({ onInsertSnippet }) => {
  return (
    <div className="bg-[#090b11] border-b border-white/[0.06] px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
        <Zap className="w-3 h-3 text-amber-400" />
        <span>Quick Snippets:</span>
      </div>

      <div className="flex items-center gap-1.5">
        {COMMON_WORDPRESS_SNIPPETS.map((snip, idx) => (
          <button
            key={idx}
            onClick={() => onInsertSnippet(snip.snippet)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#0e111a] hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-white/[0.06] hover:border-amber-500/30 rounded-lg text-xs transition-all shrink-0 active:scale-95 group font-medium"
            title={snip.description}
          >
            <Plus className="w-3 h-3 text-amber-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>{snip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
