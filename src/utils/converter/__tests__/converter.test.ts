import { describe, expect, it } from 'vitest';
import { convertHtmlToWordPressTheme, parseHtmlStructure, rewriteCssUrls, sanitizeSlug, toPhpPrefix, phpStr } from '..';
import { SAMPLE_TEMPLATES } from '../../samples';
import { lintPhp, findDuplicateDeclarations, findMissingIncludes } from '../../phpLint';
import { ConversionOptions, SourceFile, WordPressThemeMeta } from '../../../types';

function expectValidTheme(files: ReturnType<typeof convertHtmlToWordPressTheme>['files']) {
  const errors = files
    .filter((f) => f.language === 'php')
    .map((f) => lintPhp(f.path, f.content))
    .filter(Boolean);
  expect(errors).toEqual([]);
  expect(findDuplicateDeclarations(files)).toEqual([]);
  expect(findMissingIncludes(files)).toEqual([]);
  for (const f of files.filter((f) => f.path.endsWith('.json'))) {
    expect(() => JSON.parse(f.content), f.path).not.toThrow();
  }
}

// Plain conversion: ACF / Elementor section extraction off (tested separately)
const baseOptions: ConversionOptions = { ...SAMPLE_TEMPLATES[0].options, enableACFHelper: false, enableElementor: false };

const trickyMeta: WordPressThemeMeta = {
  ...SAMPLE_TEMPLATES[0].themeMeta,
  name: "John's 2nd Theme */ <b>",
  description: "It's \"quoted\" \\ back\\slashed\nmulti-line",
  textDomain: '2nd-Theme Domain!',
};

const html = (body: string, head = '') =>
  `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

describe('slug helpers', () => {
  it('produces valid PHP prefixes and slugs', () => {
    expect(sanitizeSlug('Apex Creative')).toBe('apex-creative');
    expect(sanitizeSlug('Ελληνικό Θέμα')).toBe('theme');
    expect(toPhpPrefix('apex-creative')).toBe('apex_creative');
    expect(toPhpPrefix('2nd theme')).toBe('theme_2nd_theme');
    expect(phpStr("it's \\ ok")).toBe("it\\'s \\\\ ok");
  });

  it('lint catches hyphenated function names and broken strings', () => {
    expect(lintPhp('a.php', '<?php function apex-creative_setup() {}')).not.toBeNull();
    expect(lintPhp('b.php', "<?php echo esc_html__('John's Theme', 'x');")).not.toBeNull();
    expect(lintPhp('c.php', '<?php function ok_setup() {} ?><div><?php echo 1; ?></div>')).toBeNull();
  });
});

describe('sample templates', () => {
  for (const sample of SAMPLE_TEMPLATES) {
    it(`"${sample.name}" generates syntactically valid PHP`, () => {
      const result = convertHtmlToWordPressTheme(sample.files, sample.themeMeta, sample.options);
      expectValidTheme(result.files);
      expect(result.files.some((f) => f.path === 'front-page.php')).toBe(true);
    });
  }
});

describe('hostile metadata', () => {
  it('escapes quotes, hyphens and comment terminators', () => {
    const options: ConversionOptions = {
      ...baseOptions,
      enableWooCommerce: true,
      enableBlockPatterns: true,
      menuLocations: [{ id: 'm', slug: 'Main Menu', name: "Visitor's menu" }],
      widgetAreas: [{ id: 'w', slug: 'side bar', name: "Author's sidebar", description: "Don't" }],
      customPostTypes: [
        { id: 'c', slug: 'Case Study', singularName: "Client's Case", pluralName: "Client's Cases", icon: 'dashicons-portfolio', supports: ['title', 'editor'], hasArchive: true },
      ],
    };
    const result = convertHtmlToWordPressTheme(SAMPLE_TEMPLATES[0].files, trickyMeta, options);
    expectValidTheme(result.files);

    const functionsPhp = result.files.find((f) => f.path === 'functions.php')!.content;
    expect(functionsPhp).toContain('function theme_2nd_theme_domain_setup()');
    expect(functionsPhp).toContain("'main_menu' =>");
    expect(functionsPhp).toContain("load_theme_textdomain('2nd-theme-domain'");
    // CPTs are registered once, in inc/
    expect(functionsPhp).not.toContain('register_post_type(');

    const style = result.files.find((f) => f.path === 'style.css')!.content;
    expect(style.match(/\*\//g)!.length).toBeGreaterThanOrEqual(1);
    expect(style.split('*/')[0]).toContain("Theme Name: John's 2nd Theme  <b>");
  });
});

describe('front page, assets and links', () => {
  const files: SourceFile[] = [
    {
      id: '1',
      name: 'index.html',
      path: 'index.html',
      type: 'html',
      isMain: true,
      content: html(
        `<header><a class="logo" href="index.html">Acme</a><nav><ul class="menu"><li><a href="about.html">About</a></li><li><a href="/blog">Blog</a></li></ul></nav></header>
         <section class="hero" style="background-image:url('img/hero.jpg')"><h1>Welcome Hero</h1><img src="images/team.png" srcset="images/team.png 1x, images/team@2x.png 2x"><a href="https://example.com/x.png">ext</a></section>
         <footer><p>&copy; 2019–2024 Acme Inc. All rights reserved.</p></footer>
         <script>console.log('inline')</script>
         <script src="https://cdn.example.com/lib.js"></script>`,
        `<link rel="stylesheet" href="https://cdn.example.com/lib.css"><style>.x{background:url(../img/x.svg)}</style><script src="https://cdn.tailwindcss.com"></script>`
      ),
    },
    { id: '2', name: 'about.html', path: 'about.html', type: 'html', content: html('<header>H</header><main><h1>About us</h1></main><footer>F</footer>') },
    { id: '3', name: 'style.css', path: 'style.css', type: 'css', content: 'body{background:url("../images/bg.webp")}' },
    { id: '4', name: 'vendor.css', path: 'vendor.css', type: 'css', content: '.v{background:url(img/v.png)}' },
    { id: '5', name: 'hero.jpg', path: 'img/hero.jpg', type: 'image', content: 'data:image/jpeg;base64,AAAA' },
  ];

  const result = convertHtmlToWordPressTheme(files, SAMPLE_TEMPLATES[0].themeMeta, baseOptions);
  const get = (p: string) => result.files.find((f) => f.path === p)?.content || '';

  it('is valid PHP', () => expectValidTheme(result.files));

  it('creates front-page.php with the body content', () => {
    const front = get('front-page.php');
    expect(front).toContain('Welcome Hero');
    expect(front).not.toContain('<footer');
    expect(front).not.toContain('<script');
  });

  it('rewrites image paths to the theme directory', () => {
    const front = get('front-page.php');
    expect(front).toContain("get_template_directory_uri() . '/assets/images/team.png'");
    expect(front).toContain("get_template_directory_uri() . '/assets/images/team@2x.png'); ?> 2x");
    expect(front).toContain("url('<?php echo esc_url(get_template_directory_uri() . '/assets/images/hero.jpg'); ?>')");
    expect(front).toContain('https://example.com/x.png');
    expect(get('style.css')).toContain('url("assets/images/bg.webp")');
    expect(get('style.css')).toContain('url(assets/images/x.svg)');
    expect(get('assets/css/vendor.css')).toContain('url(../images/v.png)');
    expect(result.files.find((f) => f.path === 'assets/images/hero.jpg')?.encoding).toBe('dataurl');
  });

  it('converts internal links', () => {
    const header = get('header.php');
    expect(header).toContain("home_url('/about/')");
    expect(header).toContain("home_url('/blog')");
    expect(header).toContain('has_custom_logo()');
    expect(header).toContain("wp_nav_menu(array(");
  });

  it('keeps the copyright wording with a dynamic year', () => {
    const footer = get('footer.php');
    expect(footer).toContain("2019–<?php echo esc_html(wp_date('Y')); ?> Acme Inc. All rights reserved.");
  });

  it('enqueues CDN assets, inline scripts and does not duplicate the main stylesheet', () => {
    const fn = get('functions.php');
    expect(fn).toContain("'https://cdn.example.com/lib.css'");
    expect(fn).toContain("'https://cdn.tailwindcss.com', array(), null, false");
    expect(fn).toContain("'https://cdn.example.com/lib.js', array(), null, true");
    expect(fn).toContain('/assets/js/theme-inline.js');
    expect(fn).toContain('/assets/css/vendor.css');
    expect(fn).not.toContain('/assets/css/style.css');
    expect(get('assets/js/theme-inline.js')).toContain("console.log('inline')");
  });

  it('page-{slug}.php has no Template Name header, templates/ does', () => {
    expect(get('page-about.php')).not.toContain('Template Name:');
    expect(get('templates/template-about.php')).toContain('Template Name: About Template');
    // Source <main> is not nested inside another <main>
    expect(get('page-about.php').match(/<main/g)!.length).toBe(1);
  });
});

describe('visual bindings', () => {
  it('replaces every occurrence of the bound text', () => {
    const parsed = parseHtmlStructure(html('<main><h2>Title</h2><p>Title</p></main>'), {
      bindings: [{ id: 'b', selector: 'h2', originalText: 'Title', tagType: 'the_title' }],
    });
    expect(parsed.mainHtml.match(/the_title\(\)/g)!.length).toBe(2);
  });

  it('does not touch logo inside nav when replacing the menu', () => {
    const parsed = parseHtmlStructure(
      html('<header><nav class="navbar"><a class="navbar-brand" href="/">Brand</a><ul class="navbar-nav"><li><a href="#">A</a></li></ul></nav></header>')
    );
    expect(parsed.headerHtml).toContain('has_custom_logo()');
    expect(parsed.headerHtml).toContain("'container'      => false");
    expect(parsed.headerHtml).toContain('<nav class="navbar">');
  });
});

describe('css url rewriting', () => {
  it('leaves data and external urls alone', () => {
    const css = 'a{background:url(data:image/png;base64,xx)} b{background:url(https://x.com/a.png)}';
    expect(rewriteCssUrls(css)).toBe(css);
  });
});
