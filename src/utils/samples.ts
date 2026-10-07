import { SampleTemplate } from '../types';

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'agency-portfolio',
    name: 'Apex Studio & Agency',
    category: 'Agency & Creative',
    description: 'Modern dynamic agency layout with hero intro, service grid, featured portfolio works, client testimonials, and CTA footer.',
    themeMeta: {
      name: 'Apex Creative Studio',
      themeUri: 'https://example.com/themes/apex',
      author: 'DesignCrafters',
      authorUri: 'https://example.com',
      description: 'A modern, high-performance agency and portfolio WordPress theme crafted from clean HTML/CSS.',
      version: '1.0.0',
      license: 'GNU General Public License v2 or later',
      licenseUri: 'http://www.gnu.org/licenses/gpl-2.0.html',
      textDomain: 'apex-creative',
      tags: ['agency', 'portfolio', 'grid-layout', 'custom-header', 'custom-menu', 'featured-images'],
      requiresPHP: '7.4',
      requiresWP: '6.0',
    },
    options: {
      themeType: 'hybrid',
      enableTitleTag: true,
      enablePostThumbnails: true,
      enableCustomLogo: true,
      enableHTML5: true,
      enableResponsiveEmbeds: true,
      enableAlignWide: true,
      enableWooCommerce: false,
      enableBlockPatterns: true,
      generateThemeJson: true,
      enableACFHelper: true,
      enableElementor: true,
      customPostTypes: [
        {
          id: 'cpt-portfolio',
          slug: 'portfolio',
          singularName: 'Portfolio Project',
          pluralName: 'Portfolio Projects',
          icon: 'dashicons-portfolio',
          supports: ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
          hasArchive: true,
        },
        {
          id: 'cpt-testimonials',
          slug: 'testimonials',
          singularName: 'Client Review',
          pluralName: 'Client Reviews',
          icon: 'dashicons-testimonial',
          supports: ['title', 'editor', 'thumbnail'],
          hasArchive: false,
        },
      ],
      widgetAreas: [
        {
          id: 'sidebar-1',
          slug: 'main-sidebar',
          name: 'Primary Sidebar',
          description: 'Widgets shown on standard blog and archive pages.',
        },
        {
          id: 'footer-1',
          slug: 'footer-widgets',
          name: 'Footer Column 1',
          description: 'Widgets displayed in the primary footer region.',
        },
      ],
      menuLocations: [
        { id: 'primary', slug: 'primary-menu', name: 'Primary Navigation Menu' },
        { id: 'footer', slug: 'footer-menu', name: 'Footer Quick Links' },
      ],
      extractLoop: true,
      extractHeaderFooter: true,
      extractSidebar: true,
    },
    files: [
      {
        id: 'index-html',
        name: 'index.html',
        path: 'index.html',
        type: 'html',
        isMain: true,
        templateType: 'front-page',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Creative Studio — Digital Experience & Design</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
</head>
<body class="site-body">
  <!-- SITE HEADER -->
  <header class="site-header" id="masthead">
    <div class="container header-inner">
      <div class="site-branding">
        <a href="/" class="custom-logo-link">
          <span class="logo-mark">▲</span>
          <span class="site-title">APEX<strong>STUDIO</strong></span>
        </a>
      </div>

      <nav class="main-navigation" id="site-navigation">
        <ul class="nav-menu">
          <li class="menu-item current-menu-item"><a href="/">Home</a></li>
          <li class="menu-item"><a href="/portfolio">Work</a></li>
          <li class="menu-item"><a href="/services">Services</a></li>
          <li class="menu-item"><a href="/blog">Insights</a></li>
          <li class="menu-item"><a href="/about">About</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a href="/contact" class="btn btn-primary">Start a Project</a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <span class="badge">Crafting Digital Excellence</span>
        <h1 class="hero-title">We architect bespoke digital experiences that ignite brands.</h1>
        <p class="hero-subtitle">Apex is an award-winning creative agency engineering websites, digital branding, and custom web applications for ambitious companies worldwide.</p>
        <div class="hero-buttons">
          <a href="/portfolio" class="btn btn-primary btn-lg">Explore Selected Works</a>
          <a href="/services" class="btn btn-secondary btn-lg">Our Capabilities</a>
        </div>
      </div>
    </div>
  </section>

  <!-- MAIN CONTENT / BLOG POSTS LOOP -->
  <main class="site-main container" id="main">
    <div class="content-layout">
      <div class="primary-content">
        <div class="section-header">
          <h2 class="section-title">Latest Articles & Insights</h2>
          <p class="section-desc">Fresh perspectives on modern web design, engineering, and digital brand strategy.</p>
        </div>

        <div class="posts-grid">
          <!-- POST CARD 1 -->
          <article class="post-card">
            <div class="post-thumbnail">
              <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80" alt="Design Systems at Scale" />
              <span class="post-category">Design Systems</span>
            </div>
            <div class="post-body">
              <div class="post-meta">
                <span class="post-date">October 14, 2025</span>
                <span class="post-author">By Sarah Jenkins</span>
              </div>
              <h3 class="post-title"><a href="/articles/design-systems-scale">Building Resilient Design Systems for Global Enterprise Brands</a></h3>
              <p class="post-excerpt">How unified design tokens and component-driven architectures speed up product delivery by over 40%.</p>
              <a href="/articles/design-systems-scale" class="read-more">Read Full Story &rarr;</a>
            </div>
          </article>

          <!-- POST CARD 2 -->
          <article class="post-card">
            <div class="post-thumbnail">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80" alt="Next Gen Performance" />
              <span class="post-category">Web Performance</span>
            </div>
            <div class="post-body">
              <div class="post-meta">
                <span class="post-date">October 02, 2025</span>
                <span class="post-author">By Alex Chen</span>
              </div>
              <h3 class="post-title"><a href="/articles/next-gen-performance">Achieving Perfect Core Web Vitals with Clean WordPress Architectures</a></h3>
              <p class="post-excerpt">Deep dive into lazy asset pipelines, font subsetting, and modern server caching techniques.</p>
              <a href="/articles/next-gen-performance" class="read-more">Read Full Story &rarr;</a>
            </div>
          </article>

          <!-- POST CARD 3 -->
          <article class="post-card">
            <div class="post-thumbnail">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80" alt="Conversion Rate Optimization" />
              <span class="post-category">Strategy</span>
            </div>
            <div class="post-body">
              <div class="post-meta">
                <span class="post-date">September 24, 2025</span>
                <span class="post-author">By Marcus Vance</span>
              </div>
              <h3 class="post-title"><a href="/articles/conversion-rate-optimization">The Science of High-Converting Digital Landing Pages</a></h3>
              <p class="post-excerpt">Actionable UX patterns and behavioral triggers that turn casual visitors into loyal high-value customers.</p>
              <a href="/articles/conversion-rate-optimization" class="read-more">Read Full Story &rarr;</a>
            </div>
          </article>
        </div>

        <!-- PAGINATION -->
        <nav class="pagination-navigation" aria-label="Posts Navigation">
          <span class="page-numbers current">1</span>
          <a class="page-numbers" href="/page/2">2</a>
          <a class="page-numbers" href="/page/3">3</a>
          <a class="next page-numbers" href="/page/2">Next &rarr;</a>
        </nav>
      </div>

      <!-- SIDEBAR WIDGETS -->
      <aside class="site-sidebar" id="secondary">
        <div class="widget widget-about">
          <h4 class="widget-title">About Apex</h4>
          <p>We are a multidisciplinary digital studio collaborating with visionaries to create meaningful brand experiences.</p>
        </div>

        <div class="widget widget-categories">
          <h4 class="widget-title">Topics</h4>
          <ul>
            <li><a href="/category/design">Digital Design <span>(12)</span></a></li>
            <li><a href="/category/engineering">Web Engineering <span>(18)</span></a></li>
            <li><a href="/category/strategy">Brand Strategy <span>(8)</span></a></li>
            <li><a href="/category/case-studies">Case Studies <span>(15)</span></a></li>
          </ul>
        </div>

        <div class="widget widget-newsletter">
          <h4 class="widget-title">Studio Dispatch</h4>
          <p>Join 14,000+ designers and founders receiving our monthly design breakdown.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="Your work email..." required />
            <button type="submit" class="btn btn-primary btn-block">Subscribe</button>
          </form>
        </div>
      </aside>
    </div>
  </main>

  <!-- CALL TO ACTION -->
  <section class="cta-banner">
    <div class="container cta-inner">
      <h2>Have an ambitious project in mind?</h2>
      <p>Let's collaborate to build something extraordinary together.</p>
      <a href="/contact" class="btn btn-light btn-lg">Schedule a Consultation</a>
    </div>
  </section>

  <!-- SITE FOOTER -->
  <footer class="site-footer" id="colophon">
    <div class="container footer-grid">
      <div class="footer-col">
        <span class="site-title">APEX<strong>STUDIO</strong></span>
        <p class="footer-desc">Independent design & development practice based in San Francisco and London.</p>
      </div>

      <div class="footer-col">
        <h5 class="footer-heading">Navigation</h5>
        <ul class="footer-menu">
          <li><a href="/portfolio">Portfolio</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/blog">Blog & News</a></li>
          <li><a href="/about">About Us</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h5 class="footer-heading">Capabilities</h5>
        <ul class="footer-menu">
          <li><a href="#">Custom WordPress</a></li>
          <li><a href="#">UI/UX Interface Design</a></li>
          <li><a href="#">Enterprise Architecture</a></li>
          <li><a href="#">Headless Development</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h5 class="footer-heading">Connect</h5>
        <p>hello@apexstudio.design</p>
        <p>+1 (415) 555-0199</p>
      </div>
    </div>

    <div class="container footer-bottom">
      <p class="copyright">&copy; 2025 Apex Creative Studio. All rights reserved.</p>
      <ul class="legal-links">
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
      </ul>
    </div>
  </footer>

  <script src="main.js"></script>
</body>
</html>`,
      },
      {
        id: 'style-css',
        name: 'style.css',
        path: 'style.css',
        type: 'css',
        content: `/*
Theme Name: Apex Creative Studio
Theme URI: https://example.com/themes/apex
Author: DesignCrafters
Author URI: https://example.com
Description: A modern, high-performance agency and portfolio WordPress theme crafted from clean HTML/CSS.
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: apex-creative
Tags: agency, portfolio, grid-layout, custom-header, custom-menu, featured-images
*/

:root {
  --color-bg: #0b0f19;
  --color-surface: #131b2e;
  --color-surface-hover: #1a243d;
  --color-border: #23304e;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-accent: #60a5fa;
  --color-text-main: #f8fafc;
  --color-text-muted: #94a3b8;
  --font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body.site-body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-text-main);
  line-height: 1.65;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
}

/* TYPOGRAPHY */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: #ffffff;
  font-weight: 700;
  line-height: 1.25;
}

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #93c5fd;
}

/* BUTTONS */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  color: #ffffff;
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text-main);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-surface-hover);
}

.btn-lg {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 10px;
}

.btn-light {
  background: #ffffff;
  color: #0f172a;
}

.btn-light:hover {
  background: #f1f5f9;
}

.btn-block {
  width: 100%;
}

/* HEADER */
.site-header {
  border-bottom: 1px solid var(--color-border);
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 18px 0;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-branding .custom-logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-mark {
  color: var(--color-primary);
  font-size: 22px;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 32px;
}

.nav-menu a {
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 500;
}

.nav-menu a:hover,
.nav-menu .current-menu-item a {
  color: #ffffff;
}

/* HERO */
.hero-section {
  padding: 100px 0 80px;
  text-align: center;
  background: radial-gradient(circle at top center, rgba(59, 130, 246, 0.15), transparent 70%);
}

.hero-content {
  max-width: 860px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  margin-bottom: 24px;
}

.hero-title {
  font-size: 52px;
  letter-spacing: -1.5px;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 20px;
  color: var(--color-text-muted);
  margin-bottom: 40px;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* MAIN LAYOUT */
.site-main {
  padding: 60px 24px;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 48px;
}

.section-header {
  margin-bottom: 36px;
}

.section-title {
  font-size: 32px;
  margin-bottom: 8px;
}

.section-desc {
  color: var(--color-text-muted);
  font-size: 16px;
}

.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.post-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 280px 1fr;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.5);
}

.post-thumbnail {
  position: relative;
  height: 100%;
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-category {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.post-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.post-title {
  font-size: 22px;
  margin-bottom: 12px;
}

.post-title a {
  color: #ffffff;
}

.post-title a:hover {
  color: var(--color-accent);
}

.post-excerpt {
  color: var(--color-text-muted);
  font-size: 15px;
  margin-bottom: 20px;
  flex-grow: 1;
}

.read-more {
  font-weight: 600;
  font-size: 14px;
}

/* PAGINATION */
.pagination-navigation {
  display: flex;
  gap: 8px;
  margin-top: 48px;
}

.page-numbers {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-main);
  font-weight: 600;
}

.page-numbers.current {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
}

/* SIDEBAR */
.site-sidebar {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.widget {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px;
}

.widget-title {
  font-size: 18px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.widget p {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.widget ul {
  list-style: none;
}

.widget ul li {
  margin-bottom: 10px;
}

.widget ul li a {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 14px;
}

.widget ul li a:hover {
  color: #ffffff;
}

.newsletter-form input {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: #ffffff;
  margin: 16px 0 12px;
}

/* CTA */
.cta-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  padding: 60px 0;
  text-align: center;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.cta-inner h2 {
  font-size: 36px;
  margin-bottom: 12px;
}

.cta-inner p {
  font-size: 18px;
  color: #bfdbfe;
  margin-bottom: 28px;
}

/* FOOTER */
.site-footer {
  background: #070a11;
  padding: 80px 0 32px;
  border-top: 1px solid var(--color-border);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.footer-desc {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-top: 16px;
  max-width: 280px;
}

.footer-heading {
  font-size: 16px;
  margin-bottom: 20px;
}

.footer-menu {
  list-style: none;
}

.footer-menu li {
  margin-bottom: 10px;
}

.footer-menu a {
  color: var(--color-text-muted);
  font-size: 14px;
}

.footer-menu a:hover {
  color: #ffffff;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 14px;
  color: var(--color-text-muted);
}

.legal-links {
  display: flex;
  gap: 24px;
  list-style: none;
}

.legal-links a {
  color: var(--color-text-muted);
}

@media (max-width: 992px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  .post-card {
    grid-template-columns: 1fr;
  }
  .post-thumbnail {
    height: 240px;
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .hero-title {
    font-size: 38px;
  }
}
`,
      },
      {
        id: 'main-js',
        name: 'main.js',
        path: 'main.js',
        type: 'javascript',
        content: `// Apex Studio Interactions
document.addEventListener('DOMContentLoaded', () => {
  console.log('Apex Creative Studio Theme Loaded');
});`,
      },
    ],
  },
  {
    id: 'editorial-magazine',
    name: 'The Chronos Magazine',
    category: 'Blog & Editorial',
    description: 'Clean typographic magazine with breaking news banner, dual-column story stream, category filters, and newsletter box.',
    themeMeta: {
      name: 'Chronos Editorial',
      themeUri: 'https://example.com/chronos',
      author: 'Typeform Press',
      authorUri: 'https://example.com',
      description: 'Elegant typographic news and magazine theme for WordPress with rich editorial layouts.',
      version: '1.2.0',
      license: 'GPL v2',
      licenseUri: 'https://www.gnu.org/licenses/gpl-2.0.html',
      textDomain: 'chronos-editorial',
      tags: ['blog', 'news', 'two-columns', 'custom-colors', 'editor-style', 'threaded-comments'],
      requiresPHP: '7.4',
      requiresWP: '6.0',
    },
    options: {
      themeType: 'classic',
      enableTitleTag: true,
      enablePostThumbnails: true,
      enableCustomLogo: true,
      enableHTML5: true,
      enableResponsiveEmbeds: true,
      enableAlignWide: true,
      enableWooCommerce: false,
      enableACFHelper: false,
      customPostTypes: [],
      widgetAreas: [
        { id: 'sidebar-1', slug: 'sidebar-main', name: 'Editorial Sidebar', description: 'Main sidebar for magazine posts' },
      ],
      menuLocations: [
        { id: 'primary', slug: 'primary', name: 'Header Navigation' },
        { id: 'secondary', slug: 'topics-menu', name: 'Topic Bar' },
      ],
      extractLoop: true,
      extractHeaderFooter: true,
      extractSidebar: true,
    },
    files: [
      {
        id: 'index-html',
        name: 'index.html',
        path: 'index.html',
        type: 'html',
        isMain: true,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Chronos Review — Global Dispatches & Culture</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="header-chronos">
    <div class="top-date-bar">
      <span>Sunday, August 16, 2026</span>
      <span>Edition: Global / English</span>
    </div>
    <div class="brand-masthead">
      <h1 class="paper-title"><a href="/">THE CHRONOS</a></h1>
      <p class="tagline">Independent Journalism, Global Economics & Architectural Criticism</p>
    </div>
    <nav class="nav-bar">
      <ul>
        <li><a href="/">Frontpage</a></li>
        <li><a href="/category/world">World</a></li>
        <li><a href="/category/business">Economy</a></li>
        <li><a href="/category/culture">Culture & Books</a></li>
        <li><a href="/category/technology">Tech & AI</a></li>
        <li><a href="/category/opinion">Opinion</a></li>
      </ul>
    </nav>
  </header>

  <main class="container main-content">
    <div class="lead-story">
      <div class="lead-img">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80" alt="Lead Architecture" />
      </div>
      <div class="lead-text">
        <span class="kicker">Urban Planning</span>
        <h2><a href="/article/future-of-cities">The Post-Metropolitan Architecture: How European Capitals Are Reclaiming Public Spaces</a></h2>
        <p class="lead-summary">A 6-month investigative dispatch examining pedestrianization, autonomous transit corridors, and green canopy expansion in Zurich, Copenhagen, and Vienna.</p>
        <div class="byline">By Claire Delacroix &bull; 12 min read</div>
      </div>
    </div>

    <div class="stories-columns">
      <div class="col-main">
        <article class="feed-item">
          <span class="kicker">Geopolitics</span>
          <h3><a href="/article/diplomatic-shifts">The New Silk Routes of Sovereign Renewable Power</a></h3>
          <p>Cross-border submarine power interconnectors are redefining 21st-century energy diplomacy.</p>
          <span class="meta">By David Thorne</span>
        </article>

        <article class="feed-item">
          <span class="kicker">Artificial Intelligence</span>
          <h3><a href="/article/algorithmic-courts">Synthetic Judicial Precedents: Where Algorithmic Due Process Meets Constitutional Law</a></h3>
          <p>Legal scholars debate the admissibility of probabilistic predictive frameworks in international arbitration.</p>
          <span class="meta">By Maya Patel</span>
        </article>
      </div>

      <aside class="col-sidebar">
        <div class="box-opinions">
          <h4>Columns & Ideas</h4>
          <div class="opinion-item">
            <span class="author-name">Arthur Vance</span>
            <h5><a href="#">The Fallacy of Purely Frictionless Living</a></h5>
          </div>
          <div class="opinion-item">
            <span class="author-name">Elena Rostova</span>
            <h5><a href="#">When Architecture Forgets the Pedestrian</a></h5>
          </div>
        </div>
      </aside>
    </div>
  </main>

  <footer class="footer-chronos">
    <p>&copy; 2026 The Chronos Publishing Guild. Powered by WordPress.</p>
  </footer>
</body>
</html>`,
      },
      {
        id: 'style-css',
        name: 'style.css',
        path: 'style.css',
        type: 'css',
        content: `/*
Theme Name: Chronos Editorial
Theme URI: https://example.com/chronos
Author: Typeform Press
Author URI: https://example.com
Description: Elegant typographic news and magazine theme for WordPress with rich editorial layouts.
Version: 1.2.0
License: GPL v2
Text Domain: chronos-editorial
*/

body {
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  background: #fdfcf9;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
}

.header-chronos {
  border-bottom: 2px solid #111;
  text-align: center;
  background: #ffffff;
}

.top-date-bar {
  display: flex;
  justify-content: space-between;
  padding: 6px 20px;
  font-size: 12px;
  border-bottom: 1px solid #eee;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.brand-masthead {
  padding: 30px 20px 20px;
}

.paper-title {
  font-family: 'Playfair Display', serif;
  font-size: 64px;
  margin: 0;
  letter-spacing: -1px;
}

.paper-title a {
  color: #000;
  text-decoration: none;
}

.tagline {
  font-size: 14px;
  color: #555;
  margin-top: 6px;
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

.nav-bar ul {
  display: flex;
  justify-content: center;
  gap: 30px;
  list-style: none;
  padding: 12px 0;
  margin: 0;
  border-top: 1px solid #111;
}

.nav-bar a {
  text-decoration: none;
  color: #111;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lead-story {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 40px;
  padding: 40px 0;
  border-bottom: 1px solid #ddd;
}

.lead-img img {
  width: 100%;
  height: 380px;
  object-fit: cover;
}

.kicker {
  font-size: 12px;
  text-transform: uppercase;
  color: #b91c1c;
  font-weight: 700;
  letter-spacing: 1px;
}

.lead-text h2 {
  font-family: 'Playfair Display', serif;
  font-size: 34px;
  line-height: 1.25;
  margin: 10px 0 16px;
}

.lead-text h2 a {
  color: #111;
  text-decoration: none;
}

.stories-columns {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  padding: 40px 0;
}

.feed-item {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.feed-item h3 {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  margin: 6px 0 10px;
}

.feed-item h3 a {
  color: #111;
  text-decoration: none;
}

.box-opinions {
  background: #f4f2eb;
  padding: 24px;
  border-radius: 4px;
}

.box-opinions h4 {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  margin: 0 0 16px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
}

.opinion-item {
  margin-bottom: 16px;
}

.author-name {
  font-size: 12px;
  font-weight: 700;
  color: #777;
}

.opinion-item h5 {
  margin: 4px 0 0;
  font-size: 15px;
}

.opinion-item h5 a {
  color: #222;
  text-decoration: none;
}

.footer-chronos {
  background: #111;
  color: #aaa;
  text-align: center;
  padding: 40px 20px;
  font-size: 13px;
  margin-top: 60px;
}
`,
      },
    ],
  },
];
