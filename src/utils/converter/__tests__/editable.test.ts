import { describe, expect, it } from 'vitest';
import { convertHtmlToWordPressTheme } from '..';
import { SAMPLE_TEMPLATES } from '../../samples';
import { lintPhp, findDuplicateDeclarations, findMissingIncludes } from '../../phpLint';
import { ConversionOptions, SourceFile } from '../../../types';

const html = (body: string) => `<!DOCTYPE html><html><head></head><body>${body}</body></html>`;

const files: SourceFile[] = [
  {
    id: '1',
    name: 'index.html',
    path: 'index.html',
    type: 'html',
    isMain: true,
    content: html(`
      <header><a class="logo" href="index.html">Acme</a><nav><ul><li><a href="about.html">About</a></li></ul></nav></header>
      <section class="hero-section">
        <span class="badge">New release</span>
        <h1>Build <em>faster</em> sites</h1>
        <p>We ship WordPress themes that don't break.</p>
        <a class="btn btn-primary" href="about.html#team">Meet the team</a>
        <img src="images/hero.jpg" srcset="images/hero.jpg 1x, images/hero@2x.jpg 2x" alt="Hero shot">
      </section>
      <section id="services">
        <h2>Services</h2>
        <div class="grid">
          <div class="card"><h3>Design</h3><p>Pixel perfect.</p></div>
          <div class="card"><h3>Build</h3><p>Fast.</p></div>
          <div class="card"><h3>Launch</h3><p>Safe.</p></div>
        </div>
      </section>
      <footer><p>© 2024 Acme</p></footer>`),
  },
  {
    id: '2',
    name: 'about.html',
    path: 'about.html',
    type: 'html',
    content: html(`<header>H</header><main><section class="intro"><h1>About us</h1><p>Since 2010.</p></section></main><footer>F</footer>`),
  },
  { id: '3', name: 'style.css', path: 'style.css', type: 'css', content: 'body{margin:0}' },
];

const meta = { ...SAMPLE_TEMPLATES[0].themeMeta, name: 'Acme', textDomain: 'acme-theme' };
const base: ConversionOptions = { ...SAMPLE_TEMPLATES[0].options, customElementorWidgets: [], customFields: [] };

function convert(opts: Partial<ConversionOptions>) {
  const result = convertHtmlToWordPressTheme(files, meta, { ...base, ...opts });
  const get = (p: string) => result.files.find((f) => f.path === p)?.content;
  return { result, get };
}

function expectValidPhp(result: ReturnType<typeof convertHtmlToWordPressTheme>) {
  const errors = result.files.filter((f) => f.language === 'php').map((f) => lintPhp(f.path, f.content)).filter(Boolean);
  expect(errors).toEqual([]);
  expect(findDuplicateDeclarations(result.files)).toEqual([]);
  expect(findMissingIncludes(result.files)).toEqual([]);
}

describe('ACF section fields', () => {
  const { result, get } = convert({ enableACFHelper: true, enableElementor: false });

  it('produces valid PHP', () => expectValidPhp(result));

  it('detects text, buttons and images but leaves repeated cards static', () => {
    const hero = result.editableSections!.find((s) => s.slug === 'hero')!;
    expect(hero.fields.map((f) => f.name)).toEqual(['hero_label', 'hero_heading', 'hero_text', 'hero_button', 'hero_button_url', 'hero_image']);
    expect(hero.fields.find((f) => f.name === 'hero_heading')!.type).toBe('html');
    const services = result.editableSections!.find((s) => s.slug === 'services')!;
    expect(services.fields.map((f) => f.name)).toEqual(['services_heading']);
    expect(services.repeatedItems).toBe(3);
    expect(result.editableSections!.find((s) => s.page === 'about.html')!.slug).toBe('about_intro');
  });

  it('templates read fields with the original content as fallback', () => {
    const front = get('front-page.php')!;
    expect(front).toContain("acme_theme_field('hero_text', 'We ship WordPress themes that don\\'t break.')");
    expect(front).toContain("wp_kses_post(acme_theme_field('hero_heading', 'Build <em>faster</em> sites'))");
    expect(front).toContain("esc_url(acme_theme_field('hero_button_url', home_url('/about/') . '#team'))");
    expect(front).toContain("esc_url(acme_theme_field('hero_image', get_template_directory_uri() . '/assets/images/hero.jpg'))");
    expect(front).not.toContain('srcset');
    // Repeated cards untouched
    expect(front).toContain('<h3>Design</h3>');
    expect(get('page-about.php')).toContain("acme_theme_field('intro_heading', 'About us')");
  });

  it('registers field groups for the front page and the about page', () => {
    const acf = get('inc/acf-fields.php')!;
    expect(acf).toContain('function acme_theme_field($name, $default = \'\')');
    expect(acf).toContain("'value' => 'front_page'");
    expect(acf).toContain("get_page_by_path('about')");
    expect(acf).toContain("'type' => 'tab'");
    expect(get('functions.php')).toContain("/inc/acf-fields.php'");
    expect(get('functions.php')).not.toContain('elementor-support.php');
    expect(result.files.some((f) => f.path.startsWith('inc/elementor'))).toBe(false);
  });
});

describe('Elementor section widgets', () => {
  const { result, get } = convert({ enableACFHelper: false, enableElementor: true });

  it('produces valid PHP', () => expectValidPhp(result));

  it('creates one widget per section with dynamic-tag controls', () => {
    const widget = get('inc/elementor-widgets/class-section-hero.php')!;
    expect(widget).toContain('class acme_theme_Section_Hero_Widget extends Widget_Base');
    expect(widget).toContain("$this->add_control('hero_heading'");
    expect(widget).toContain("'type' => Controls_Manager::MEDIA");
    expect(widget).toContain("'url' => get_template_directory_uri() . '/assets/images/hero.jpg'");
    expect(widget).toContain("'active' => true");
    expect(widget).toContain("<?php echo esc_html($s['hero_text']); ?>");
    expect(widget).toContain("<?php echo esc_url($s['hero_image']['url'] ?? ''); ?>");
    expect(get('inc/elementor-widgets/class-section-about-intro.php')).toContain("'acme_theme_about_intro'");
    const support = get('inc/elementor-support.php')!;
    expect(support).toContain('new \\acme_theme_Section_Hero_Widget()');
    expect(support).toContain('function acme_theme_is_built_with_elementor()');
  });

  it('templates show Elementor content for Elementor-built pages, static markup otherwise', () => {
    const front = get('front-page.php')!;
    expect(front).toContain('acme_theme_is_built_with_elementor()');
    expect(front).toContain('We ship WordPress themes that don\'t break.');
    expect(front).not.toContain('acme_theme_field(');
  });
});

describe('both off', () => {
  it('keeps the plain static conversion', () => {
    const { result, get } = convert({ enableACFHelper: false, enableElementor: false });
    expectValidPhp(result);
    expect(result.editableSections).toEqual([]);
    expect(get('front-page.php')).toContain('srcset');
    expect(get('functions.php')).not.toContain('acf-fields.php');
  });

  it('generates custom Elementor widgets defined in settings', () => {
    const { result, get } = convert({
      enableElementor: true,
      enableACFHelper: false,
      customElementorWidgets: [
        { id: 'w', name: 'promo_box', title: "Promo's box", icon: 'eicon-star', category: 'x', fields: [
          { name: 'title', label: 'Title', type: 'TEXT', default: 'Hi' },
          { name: 'photo', label: 'Photo', type: 'MEDIA', default: '' },
        ] },
      ],
    });
    expectValidPhp(result);
    expect(get('inc/elementor-widgets/class-custom-promo-box.php')).toContain("esc_html__('Promo\\'s box'");
  });
});
