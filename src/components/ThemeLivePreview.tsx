import React, { useState, useMemo } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RefreshCw, 
  Sliders, 
  ExternalLink,
  BookOpen,
  FileText,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Crosshair,
  Sparkles,
  Check,
  Trash2,
  Plus,
  Code2,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { ConversionOptions, ConversionResult, VisualTagBinding, WordPressThemeMeta } from '../types';
import { scopeCss } from '../utils/scopeCss';

interface ThemeLivePreviewProps {
  result: ConversionResult | null;
  meta: WordPressThemeMeta;
  options: ConversionOptions;
  onOptionsChange: (newOptions: ConversionOptions) => void;
  onReconvert: () => void;
}

export const ThemeLivePreview: React.FC<ThemeLivePreviewProps> = ({ 
  result, 
  meta, 
  options, 
  onOptionsChange, 
  onReconvert 
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTemplate, setActiveTemplate] = useState<'home' | 'single' | 'page' | 'archive' | 'shop'>('home');
  const [simulatedTitle, setSimulatedTitle] = useState(meta.name);
  const [simulatedTagline, setSimulatedTagline] = useState('Just another WordPress site');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showTagBinder, setShowTagBinder] = useState(false);
  const [inspectMode, setInspectMode] = useState(false);

  // Selected element for tag binding modal
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [selectedSelector, setSelectedSelector] = useState('');
  const [selectedOriginalText, setSelectedOriginalText] = useState('');
  const [selectedTagType, setSelectedTagType] = useState<VisualTagBinding['tagType']>('the_title');
  const [customFieldName, setCustomFieldName] = useState('');

  // Extract CSS from generated style.css
  const rawCss = useMemo(() => {
    if (!result) return '';
    const styleFile = result.files.find((f) => f.path === 'style.css');
    return styleFile?.content || '';
  }, [result]);

  // Theme CSS confined to the preview container so it cannot restyle the app
  const previewCss = useMemo(() => {
    return scopeCss(rawCss.replace(/\/\*[\s\S]*?\*\//, ''), '.theme-preview-container');
  }, [rawCss]);

  const activeBindings = options.visualBindings || [];

  const handleElementClick = (e: React.MouseEvent<HTMLElement>, defaultSelector: string, defaultText: string, suggestedTag: VisualTagBinding['tagType'] = 'the_title') => {
    if (!inspectMode) return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedSelector(defaultSelector);
    setSelectedOriginalText(defaultText);
    setSelectedTagType(suggestedTag);
    setBindingModalOpen(true);
  };

  const handleSaveBinding = () => {
    if (!selectedSelector) return;

    const newBinding: VisualTagBinding = {
      id: `binding-${Date.now()}`,
      selector: selectedSelector,
      originalText: selectedOriginalText,
      tagType: selectedTagType,
      customFieldName: selectedTagType === 'custom_field' ? (customFieldName || 'custom_field_key') : undefined,
    };

    const updated = [...activeBindings.filter(b => b.selector !== selectedSelector), newBinding];
    const newOpts: ConversionOptions = {
      ...options,
      visualBindings: updated,
    };

    onOptionsChange(newOpts);
    setBindingModalOpen(false);
    onReconvert();
  };

  const handleRemoveBinding = (id: string) => {
    const updated = activeBindings.filter(b => b.id !== id);
    const newOpts: ConversionOptions = {
      ...options,
      visualBindings: updated,
    };
    onOptionsChange(newOpts);
    onReconvert();
  };

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-inset text-muted text-center">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent-ink flex items-center justify-center mx-auto mb-3 border border-accent/20">
            <Monitor className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">Theme Preview Ready</h3>
          <p className="text-xs text-muted max-w-sm">
            Click "Convert to WP" or select a template to preview the theme live in the interactive WordPress simulator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-inset text-ink overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-island border-b border-line px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Template Switcher */}
        <div className="flex items-center gap-1 bg-inset p-1 rounded-xl border border-line shadow-inner">
          <button
            onClick={() => setActiveTemplate('home')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTemplate === 'home' ? 'bg-inset text-accent-ink border border-accent/30 shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Home (index.php)
          </button>
          <button
            onClick={() => setActiveTemplate('single')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTemplate === 'single' ? 'bg-inset text-accent-ink border border-accent/30 shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Single Post (single.php)
          </button>
          <button
            onClick={() => setActiveTemplate('page')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTemplate === 'page' ? 'bg-inset text-accent-ink border border-accent/30 shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Page (page.php)
          </button>
          <button
            onClick={() => setActiveTemplate('archive')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTemplate === 'archive' ? 'bg-inset text-accent-ink border border-accent/30 shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            Archive (archive.php)
          </button>
          {options.enableWooCommerce && (
            <button
              onClick={() => setActiveTemplate('shop')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTemplate === 'shop' ? 'bg-inset text-purple-700 border border-purple-500/30 shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Shop (woocommerce.php)
            </button>
          )}
        </div>

        {/* Viewport & Tools Switcher */}
        <div className="flex items-center gap-2">
          {/* Point & Click Inspector Mode Toggle */}
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              inspectMode
                ? 'bg-accent text-white border-accent font-bold shadow-lg shadow-accent/20'
                : 'bg-inset hover:bg-inset text-ink-2 border-line'
            }`}
            title="Click any element in the preview to bind it to dynamic WordPress PHP template tags"
          >
            <Crosshair className={`w-3.5 h-3.5 ${inspectMode ? 'animate-spin' : 'text-accent-ink'}`} />
            <span>{inspectMode ? 'Inspecting' : 'Visual Tag Binder'}</span>
            {activeBindings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${inspectMode ? 'bg-inset text-accent-ink' : 'bg-accent/20 text-accent-ink'}`}>
                {activeBindings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowTagBinder(!showTagBinder)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showTagBinder
                ? 'bg-inset text-accent-ink border-accent/30'
                : 'bg-inset hover:bg-inset text-ink-2 border-line'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-accent-ink" />
            <span className="hidden sm:inline">Bindings ({activeBindings.length})</span>
          </button>

          {/* Viewport switchers */}
          <div className="flex items-center bg-inset p-1 rounded-xl border border-line shadow-inner">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'desktop' ? 'bg-inset text-accent-ink shadow-sm border border-accent/30' : 'text-faint hover:text-ink-2'
              }`}
              title="Desktop 100%"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'tablet' ? 'bg-inset text-accent-ink shadow-sm border border-accent/30' : 'text-faint hover:text-ink-2'
              }`}
              title="Tablet 768px"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'mobile' ? 'bg-inset text-accent-ink shadow-sm border border-accent/30' : 'text-faint hover:text-ink-2'
              }`}
              title="Mobile 375px"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showCustomizer
                ? 'bg-inset text-accent-ink border-accent/40 shadow-sm'
                : 'bg-inset hover:bg-inset text-ink-2 border-line'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customizer</span>
          </button>
        </div>
      </div>

      {/* Inspect Mode Banner */}
      {inspectMode && (
        <div className="bg-accent/15 border-b border-accent/30 px-4 py-2 flex items-center justify-between text-xs text-accent-ink">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-accent-ink animate-pulse" />
            <span className="font-semibold">Interactive Visual Tag Binder Active:</span>
            <span className="text-ink-2">Click any headline, post card, image or paragraph in the preview below to bind it to WordPress template tags.</span>
          </div>
          <button
            onClick={() => setInspectMode(false)}
            className="px-2.5 py-1 bg-inset hover:bg-line text-ink-2 rounded text-[11px] font-medium transition-colors"
          >
            Exit Inspector
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visual Tag Bindings Drawer */}
        {showTagBinder && (
          <div className="w-80 bg-inset border-r border-line p-4 overflow-y-auto space-y-4 text-xs shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="font-bold text-ink-2 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-accent-ink" />
                <span>Visual Tag Bindings ({activeBindings.length})</span>
              </div>
              <button
                onClick={() => setShowTagBinder(false)}
                className="text-faint hover:text-ink-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              These mappings replace static HTML selectors with dynamic WordPress template tags in the converted theme.
            </p>

            {activeBindings.length === 0 ? (
              <div className="p-4 bg-inset border border-dashed border-line rounded-xl text-center space-y-2">
                <Crosshair className="w-5 h-5 text-accent-ink/60 mx-auto" />
                <div className="text-ink-2 font-medium">No bindings created yet</div>
                <p className="text-[11px] text-faint">
                  Turn on <strong>Visual Tag Binder</strong> above and click elements in the live preview.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeBindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="p-3 bg-inset border border-line hover:border-line rounded-xl space-y-1.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-accent-ink bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                        {binding.selector}
                      </span>
                      <button
                        onClick={() => handleRemoveBinding(binding.id)}
                        className="text-faint hover:text-red-700 transition-colors p-1"
                        title="Remove Binding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-ink-2 font-mono text-[11px] flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-faint" />
                      <span className="text-emerald-700">
                        {binding.tagType === 'custom_field' 
                          ? `<?php echo get_post_meta($post->ID, '${binding.customFieldName || "field"}', true); ?>`
                          : `<?php ${binding.tagType}(); ?>`
                        }
                      </span>
                    </div>

                    {binding.originalText && (
                      <div className="text-[10px] text-faint truncate">
                        Replaces: "{binding.originalText}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customizer Drawer */}
        {showCustomizer && (
          <div className="w-72 bg-inset border-r border-line p-4 overflow-y-auto space-y-4 text-xs shrink-0">
            <div className="font-bold text-ink-2 uppercase tracking-wider text-[11px] pb-2 border-b border-line flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-accent-ink" />
              <span>Simulated WP Customizer</span>
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Site Title</label>
              <input
                type="text"
                value={simulatedTitle}
                onChange={(e) => setSimulatedTitle(e.target.value)}
                className="w-full bg-inset border border-line rounded-lg p-2 text-ink outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={simulatedTagline}
                onChange={(e) => setSimulatedTagline(e.target.value)}
                className="w-full bg-inset border border-line rounded-lg p-2 text-ink outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="p-3 bg-inset border border-line rounded-xl">
              <div className="font-semibold text-ink-2 mb-1">Active Menu Location:</div>
              <div className="text-muted text-[11px]">Primary Navigation Menu</div>
              <ul className="mt-2 space-y-1 text-accent-ink/90 text-[11px]">
                <li>&bull; Home (Front Page)</li>
                <li>&bull; Work / Portfolio</li>
                <li>&bull; Services</li>
                <li>&bull; Blog / Insights</li>
                <li>&bull; Contact</li>
              </ul>
            </div>

            <div className="p-3 bg-inset border border-line rounded-xl">
              <div className="font-semibold text-ink-2 mb-1">Active Sidebars:</div>
              <div className="text-muted text-[11px]">Primary Sidebar (3 Widgets Active)</div>
            </div>
          </div>
        )}

        {/* Viewport Frame */}
        <div className="flex-1 bg-inset p-4 flex items-center justify-center overflow-auto">
          <div
            className={`h-full bg-island border border-line rounded-2xl shadow-2xl overflow-y-auto transition-all relative ${
              viewport === 'desktop'
                ? 'w-full'
                : viewport === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px]'
            } ${inspectMode ? 'cursor-crosshair select-none' : ''}`}
          >
            {/* Simulated WP Admin Bar */}
            <div className="bg-island text-ink-2 text-[11px] px-3 py-1.5 flex items-center justify-between border-b border-line sticky top-0 z-50 select-none">
              <div className="flex items-center gap-3">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-accent text-white font-serif-luxury font-black flex items-center justify-center text-[10px]">W</span>
                  <span>{simulatedTitle}</span>
                </span>
                <span className="hidden sm:inline text-muted">&bull; Customize</span>
                <span className="hidden sm:inline text-muted">&bull; + New Post</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span>Howdy, Admin</span>
              </div>
            </div>

            {/* Injected Theme Styles */}
            <style dangerouslySetInnerHTML={{ __html: previewCss }} />

            {/* Rendered WP Template based on selection */}
            {/* contain: paint keeps fixed/sticky theme elements (e.g. headers) inside the preview */}
            <div className="theme-preview-container relative isolate [contain:paint]">
              {/* Header */}
              <header 
                className={`site-header ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400' : ''}`}
                id="masthead"
                onClick={(e) => handleElementClick(e, '#masthead', simulatedTitle, 'bloginfo_name')}
              >
                <div className="container header-inner">
                  <div className="site-branding">
                    <a href="#" className="custom-logo-link">
                      <span className="site-title">{simulatedTitle}</span>
                    </a>
                    {simulatedTagline && (
                      <p className="site-description text-xs text-slate-400">{simulatedTagline}</p>
                    )}
                  </div>
                  <nav 
                    className={`main-navigation ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-emerald-400' : ''}`}
                    id="site-navigation"
                    onClick={(e) => handleElementClick(e, '#site-navigation', 'Primary Menu', 'wp_nav_menu')}
                  >
                    <ul className="nav-menu">
                      <li className={activeTemplate === 'home' ? 'current-menu-item' : ''}><a href="#">Home</a></li>
                      <li><a href="#">Work</a></li>
                      <li><a href="#">Services</a></li>
                      <li className={activeTemplate === 'archive' ? 'current-menu-item' : ''}><a href="#">Insights</a></li>
                      <li className={activeTemplate === 'page' ? 'current-menu-item' : ''}><a href="#">About</a></li>
                    </ul>
                  </nav>
                </div>
              </header>

              {/* VIEW 1: HOME / POST LOOP */}
              {activeTemplate === 'home' && (
                <div>
                  <section 
                    className={`hero-section ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400' : ''}`}
                    onClick={(e) => handleElementClick(e, '.hero-title', 'Dynamic WordPress Blog Feed', 'the_title')}
                  >
                    <div className="container hero-content">
                      <span className="badge">WordPress Core Loop Simulator</span>
                      <h1 className="hero-title">Dynamic WordPress Blog Feed</h1>
                      <p className="hero-subtitle">
                        Rendering posts dynamically through <code>have_posts()</code>, <code>the_title()</code>, <code>the_post_thumbnail()</code>, and <code>the_excerpt()</code>.
                      </p>
                    </div>
                  </section>

                  <main className="site-main container">
                    <div className="content-layout">
                      <div className="primary-content">
                        <div className="posts-grid">
                          <article 
                            className={`post-card ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400' : ''}`}
                            onClick={(e) => handleElementClick(e, '.post-card .post-title', 'Building Resilient WordPress Themes with Clean Code Hierarchy', 'the_title')}
                          >
                            <div className="post-thumbnail">
                              <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80" alt="WP Theme Post" />
                              <span className="post-category">Engineering</span>
                            </div>
                            <div className="post-body">
                              <div className="post-meta">
                                <span className="post-date">August 16, 2026</span>
                                <span className="post-author">By WP Admin</span>
                              </div>
                              <h3 className="post-title"><a href="#" onClick={() => setActiveTemplate('single')}>Building Resilient WordPress Themes with Clean Code Hierarchy</a></h3>
                              <p className="post-excerpt">How modern WordPress template structures ensure fast loading times, standard hook support, and seamless block editing.</p>
                              <a href="#" onClick={() => setActiveTemplate('single')} className="read-more">Read Full Story &rarr;</a>
                            </div>
                          </article>

                          <article className="post-card">
                            <div className="post-thumbnail">
                              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80" alt="Performance" />
                              <span className="post-category">Performance</span>
                            </div>
                            <div className="post-body">
                              <div className="post-meta">
                                <span className="post-date">August 10, 2026</span>
                                <span className="post-author">By Sarah Jenkins</span>
                              </div>
                              <h3 className="post-title"><a href="#" onClick={() => setActiveTemplate('single')}>Optimizing Core Web Vitals with Clean Asset Enqueuing</a></h3>
                              <p className="post-excerpt">How wp_enqueue_scripts ensures conditional loading and eliminates render-blocking stylesheets.</p>
                              <a href="#" onClick={() => setActiveTemplate('single')} className="read-more">Read Full Story &rarr;</a>
                            </div>
                          </article>
                        </div>
                      </div>

                      {/* Dynamic Sidebar */}
                      <aside 
                        className={`site-sidebar ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400' : ''}`}
                        id="secondary"
                        onClick={(e) => handleElementClick(e, '#secondary', 'Primary Sidebar', 'dynamic_sidebar')}
                      >
                        <div className="widget">
                          <h4 className="widget-title">About This Theme</h4>
                          <p>Converted from static HTML &amp; CSS directly into a WordPress standard compliant theme.</p>
                        </div>
                        <div className="widget">
                          <h4 className="widget-title">Categories</h4>
                          <ul>
                            <li><a href="#">Engineering <span>(14)</span></a></li>
                            <li><a href="#">Performance <span>(8)</span></a></li>
                            <li><a href="#">WordPress <span>(22)</span></a></li>
                          </ul>
                        </div>
                      </aside>
                    </div>
                  </main>
                </div>
              )}

              {/* VIEW 2: SINGLE POST (single.php) */}
              {activeTemplate === 'single' && (
                <main className="site-main container" style={{ padding: '60px 24px' }}>
                  <div className="content-layout">
                    <div className="primary-content">
                      <article 
                        className={`single-post-entry ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400' : ''}`}
                        onClick={(e) => handleElementClick(e, '.single-post-entry .entry-title', 'Building Resilient WordPress Themes', 'the_title')}
                      >
                        <div className="post-meta" style={{ marginBottom: '12px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                          <span>August 16, 2026</span>
                          <span>By WordPress Admin</span>
                          <span>Category: Engineering</span>
                        </div>
                        <h1 style={{ fontSize: '38px', marginBottom: '24px', lineHeight: 1.25 }}>Building Resilient WordPress Themes with Clean Code Hierarchy</h1>

                        <div style={{ marginBottom: '32px', borderRadius: '16px', overflow: 'hidden' }}>
                          <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80" alt="Full Featured" style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
                        </div>

                        <div 
                          className={`entry-content ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400' : ''}`} 
                          style={{ lineHeight: 1.8, fontSize: '17px', color: '#e2e8f0' }}
                          onClick={(e) => handleElementClick(e, '.entry-content', 'Main Body Content', 'the_content')}
                        >
                          <p style={{ marginBottom: '20px' }}>
                            WordPress themes are governed by the template hierarchy. When a visitor requests a page or post, WordPress looks for the most specific template file available before falling back to <code>index.php</code>.
                          </p>
                          <p style={{ marginBottom: '20px' }}>
                            By separating your static markup into modular partials like <code>header.php</code>, <code>footer.php</code>, <code>sidebar.php</code>, and <code>template-parts/content.php</code>, you achieve maximum code reusability and lightning-fast maintainability.
                          </p>
                          <blockquote style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '20px', margin: '28px 0', fontStyle: 'italic', color: '#93c5fd' }}>
                            "A well-architected WordPress theme relies on clean standard hooks rather than hardcoded scripts or styles."
                          </blockquote>
                          <p>
                            All dynamic features such as featured images, title tags, HTML5 markup, and widget zones are declared inside <code>functions.php</code> through <code>after_setup_theme</code> and <code>widgets_init</code>.
                          </p>
                        </div>
                      </article>
                    </div>

                    <aside className="site-sidebar">
                      <div className="widget">
                        <h4 className="widget-title">Author Profile</h4>
                        <p>WordPress core contributor and web architect specializing in headless and classic PHP themes.</p>
                      </div>
                    </aside>
                  </div>
                </main>
              )}

              {/* VIEW 3: STATIC PAGE (page.php) */}
              {activeTemplate === 'page' && (
                <main className="site-main container" style={{ padding: '60px 24px' }}>
                  <article className="page-entry" style={{ maxWidth: '840px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '42px', marginBottom: '24px' }}>About Our Creative Studio</h1>
                    <div className="entry-content" style={{ lineHeight: 1.8, fontSize: '17px', color: '#e2e8f0' }}>
                      <p style={{ marginBottom: '20px' }}>
                        This is an example of a static WordPress page generated via <code>page.php</code>. Static pages are ideal for About Us, Contact, Privacy Policies, and custom landing pages.
                      </p>
                      <p style={{ marginBottom: '20px' }}>
                        In WordPress, page content is managed directly through the Block Editor (Gutenberg) and rendered via the single standard call <code>the_content()</code>.
                      </p>
                    </div>
                  </article>
                </main>
              )}

              {/* VIEW 4: ARCHIVE (archive.php) */}
              {activeTemplate === 'archive' && (
                <main className="site-main container" style={{ padding: '60px 24px' }}>
                  <div className="section-header" style={{ marginBottom: '36px' }}>
                    <span style={{ fontSize: '13px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>Category Archive</span>
                    <h1 style={{ fontSize: '36px' }}>Category: Web Engineering</h1>
                    <p style={{ color: '#94a3b8', marginTop: '6px' }}>Browsing all articles filed under the Web Engineering topic.</p>
                  </div>

                  <div className="posts-grid">
                    <article className="post-card">
                      <div className="post-thumbnail">
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80" alt="Archive Post" />
                      </div>
                      <div className="post-body">
                        <h3 className="post-title"><a href="#">Achieving Perfect Core Web Vitals with Clean WordPress Architectures</a></h3>
                        <p className="post-excerpt">Deep dive into lazy asset pipelines, font subsetting, and modern server caching techniques.</p>
                      </div>
                    </article>
                  </div>
                </main>
              )}

              {/* VIEW 5: WOOCOMMERCE SHOP (woocommerce.php) */}
              {activeTemplate === 'shop' && (
                <main className="site-main container" style={{ padding: '60px 24px' }}>
                  <div className="section-header" style={{ marginBottom: '36px' }}>
                    <span style={{ fontSize: '13px', color: '#a855f7', textTransform: 'uppercase', fontWeight: 'bold' }}>WooCommerce Store</span>
                    <h1 style={{ fontSize: '36px' }}>Catalog &amp; Products</h1>
                    <p style={{ color: '#94a3b8', marginTop: '6px' }}>Displaying products through WooCommerce core archive templates and action hooks.</p>
                  </div>

                  <div className="posts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                    <div 
                      className={`post-card ${inspectMode ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-purple-400' : ''}`}
                      onClick={(e) => handleElementClick(e, '.product-card .price', '$129.00', 'woocommerce_price')}
                    >
                      <div className="post-thumbnail">
                        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80" alt="Product" />
                      </div>
                      <div className="post-body" style={{ textAlign: 'center' }}>
                        <h3 className="post-title" style={{ fontSize: '18px' }}>Pro Studio Headphones</h3>
                        <div className="price" style={{ color: '#f59e0b', fontWeight: 'bold', margin: '8px 0', fontSize: '18px' }}>$129.00</div>
                        <button 
                          className="button add_to_cart_button" 
                          style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}
                          onClick={(e) => handleElementClick(e, '.add_to_cart_button', 'Add to Cart', 'woocommerce_add_to_cart')}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    <div className="post-card">
                      <div className="post-thumbnail">
                        <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80" alt="Product 2" />
                      </div>
                      <div className="post-body" style={{ textAlign: 'center' }}>
                        <h3 className="post-title" style={{ fontSize: '18px' }}>Minimalist Smartwatch</h3>
                        <div className="price" style={{ color: '#f59e0b', fontWeight: 'bold', margin: '8px 0', fontSize: '18px' }}>$249.00</div>
                        <button className="button add_to_cart_button" style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', width: '100%' }}>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </main>
              )}

              {/* Footer */}
              <footer className="site-footer" id="colophon">
                <div className="container footer-bottom">
                  <p className="copyright">&copy; {new Date().getFullYear()} {simulatedTitle}. All rights reserved.</p>
                  <ul className="legal-links">
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                  </ul>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* Point & Click Tag Binding Modal */}
      {bindingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-island border border-accent/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-line bg-island flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent/10 text-accent-ink rounded-lg border border-accent/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Bind Element to WordPress PHP Tag</h3>
                  <p className="text-[11px] text-muted">Replaces static element with dynamic WordPress logic</p>
                </div>
              </div>
              <button
                onClick={() => setBindingModalOpen(false)}
                className="text-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs text-ink-2">
              <div>
                <label className="block text-muted font-medium mb-1">Target CSS Selector</label>
                <input
                  type="text"
                  value={selectedSelector}
                  onChange={(e) => setSelectedSelector(e.target.value)}
                  className="w-full bg-inset border border-line rounded-lg p-2 font-mono text-accent-ink text-xs outline-none focus:border-accent"
                />
              </div>

              {selectedOriginalText && (
                <div className="p-2.5 bg-inset border border-line rounded-lg">
                  <span className="text-[10px] uppercase tracking-wider text-faint font-bold block mb-1">Original Text in HTML:</span>
                  <span className="text-ink-2 italic text-xs font-serif">"{selectedOriginalText}"</span>
                </div>
              )}

              <div>
                <label className="block text-muted font-medium mb-1.5">Choose WordPress Template Tag</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {[
                    { id: 'the_title', label: 'the_title()', desc: 'Post / Page Title', color: 'text-accent-ink' },
                    { id: 'the_content', label: 'the_content()', desc: 'Main Body Content', color: 'text-blue-700' },
                    { id: 'the_excerpt', label: 'the_excerpt()', desc: 'Post Excerpt / Summary', color: 'text-emerald-700' },
                    { id: 'the_post_thumbnail', label: 'the_post_thumbnail()', desc: 'Featured Post Image', color: 'text-purple-700' },
                    { id: 'the_author', label: 'the_author()', desc: 'Post Author Name', color: 'text-cyan-700' },
                    { id: 'the_date', label: 'the_time() / the_date()', desc: 'Published Date', color: 'text-rose-700' },
                    { id: 'the_permalink', label: 'the_permalink()', desc: 'Post Link URL', color: 'text-indigo-700' },
                    { id: 'bloginfo_name', label: 'bloginfo("name")', desc: 'Site Name', color: 'text-accent-ink' },
                    { id: 'bloginfo_description', label: 'bloginfo("description")', desc: 'Site Tagline', color: 'text-ink-2' },
                    { id: 'wp_nav_menu', label: 'wp_nav_menu()', desc: 'Primary Nav Menu', color: 'text-emerald-700' },
                    { id: 'dynamic_sidebar', label: 'dynamic_sidebar()', desc: 'Sidebar Widget Area', color: 'text-violet-700' },
                    { id: 'woocommerce_price', label: 'woocommerce_price()', desc: 'Woo Product Price', color: 'text-purple-700' },
                    { id: 'woocommerce_add_to_cart', label: 'add_to_cart_button', desc: 'WooCommerce Button', color: 'text-purple-700' },
                    { id: 'custom_field', label: 'get_post_meta() / ACF', desc: 'Custom Field Meta', color: 'text-accent-ink' },
                  ].map((tag) => (
                    <label
                      key={tag.id}
                      onClick={() => setSelectedTagType(tag.id as any)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        selectedTagType === tag.id
                          ? 'bg-accent/15 border-accent text-ink'
                          : 'bg-inset border-line hover:border-line text-ink-2'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono font-bold text-[11px] ${tag.color}`}>{tag.label}</span>
                        {selectedTagType === tag.id && <Check className="w-3.5 h-3.5 text-accent-ink" />}
                      </div>
                      <span className="text-[10px] text-muted mt-1">{tag.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTagType === 'custom_field' && (
                <div>
                  <label className="block text-muted font-medium mb-1">Custom Field Key / Name</label>
                  <input
                    type="text"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    placeholder="e.g. hero_subtitle, client_company, rating"
                    className="w-full bg-inset border border-line rounded-lg p-2 font-mono text-xs text-ink outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-line bg-island flex items-center justify-end gap-2">
              <button
                onClick={() => setBindingModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-muted hover:text-ink rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBinding}
                className="px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Tag Binding</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
