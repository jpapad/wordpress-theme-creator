import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Database,
  Code,
  Tag,
  Check,
  Layout,
  Component,
  Boxes,
  FileCode2,
  Globe2,
  FileSpreadsheet,
  Zap,
  Sliders,
  FolderTree
} from 'lucide-react';
import { 
  ConversionOptions, 
  WordPressThemeMeta, 
  CustomPostType, 
  CustomTaxonomy,
  WidgetArea, 
  MenuLocation, 
  AcfFieldDefinition,
  ElementorWidgetDefinition,
  GutenbergBlockDefinition
} from '../types';

interface ThemeConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: WordPressThemeMeta;
  setMeta: React.Dispatch<React.SetStateAction<WordPressThemeMeta>>;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  onSaveAndConvert: () => void;
}

export const ThemeConfiguratorModal: React.FC<ThemeConfiguratorModalProps> = ({
  isOpen,
  onClose,
  meta,
  setMeta,
  options,
  setOptions,
  onSaveAndConvert,
}) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'elementor' | 'cpt' | 'acf' | 'gutenberg' | 'demo-i18n' | 'menus-widgets'
  >('elementor');

  if (!isOpen) return null;

  // Custom Post Type Add Handler
  const handleAddCPT = () => {
    const plural = prompt('Enter Plural Name (e.g. Portfolio Projects, Team Members, Services):', 'Portfolio Projects');
    if (!plural) return;
    const singular = prompt('Enter Singular Name (e.g. Portfolio Project, Team Member, Service):', 'Portfolio Project');
    if (!singular) return;
    const slug = plural.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newCPT: CustomPostType = {
      id: `cpt-${Date.now()}`,
      slug,
      singularName: singular,
      pluralName: plural,
      icon: 'dashicons-portfolio',
      supports: ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
      hasArchive: true,
    };

    setOptions({
      ...options,
      customPostTypes: [...options.customPostTypes, newCPT],
    });
  };

  const handleRemoveCPT = (id: string) => {
    setOptions({
      ...options,
      customPostTypes: options.customPostTypes.filter((c) => c.id !== id),
    });
  };

  // Custom Taxonomy Add Handler
  const handleAddTaxonomy = () => {
    const plural = prompt('Taxonomy Plural Name (e.g. Project Categories, Skill Tags, Locations):', 'Project Categories');
    if (!plural) return;
    const singular = prompt('Taxonomy Singular Name (e.g. Project Category, Skill Tag, Location):', 'Project Category');
    if (!singular) return;
    const slug = plural.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newTax: CustomTaxonomy = {
      id: `tax-${Date.now()}`,
      slug,
      singularName: singular,
      pluralName: plural,
      postTypes: ['portfolio', 'post'],
      hierarchical: true,
    };

    const currentTaxonomies = options.customTaxonomies || [];
    setOptions({
      ...options,
      customTaxonomies: [...currentTaxonomies, newTax],
    });
  };

  const handleRemoveTaxonomy = (id: string) => {
    const currentTaxonomies = options.customTaxonomies || [];
    setOptions({
      ...options,
      customTaxonomies: currentTaxonomies.filter((t) => t.id !== id),
    });
  };

  // Elementor Custom Widget Add Handler
  const handleAddElementorWidget = () => {
    const title = prompt('Widget Title (e.g. Pricing Table, Testimonials Carousel, Hero CTA):', 'Pricing Table');
    if (!title) return;
    const name = title.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newWidget: ElementorWidgetDefinition = {
      id: `el-widget-${Date.now()}`,
      name,
      title,
      icon: 'eicon-price-table',
      category: 'theme-elements',
      fields: [
        { name: 'title', label: 'Plan Name', type: 'TEXT', default: 'Professional' },
        { name: 'price', label: 'Price Amount', type: 'TEXT', default: '$49/mo' },
        { name: 'features', label: 'Features List', type: 'TEXTAREA', default: 'Unlimited Access\nPriority Support\nCustom Domain' },
      ],
    };

    const currentWidgets = options.customElementorWidgets || [];
    setOptions({
      ...options,
      customElementorWidgets: [...currentWidgets, newWidget],
    });
  };

  const handleRemoveElementorWidget = (id: string) => {
    const currentWidgets = options.customElementorWidgets || [];
    setOptions({
      ...options,
      customElementorWidgets: currentWidgets.filter((w) => w.id !== id),
    });
  };

  // ACF Custom Field Add Handler
  const handleAddAcfField = () => {
    const label = prompt('Field Label (e.g. Hero Subtitle, Rating, Client Logo, CTA Button URL):', 'Hero Subtitle');
    if (!label) return;
    const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newField: AcfFieldDefinition = {
      id: `acf-${Date.now()}`,
      name,
      label,
      type: 'text',
      instructions: `Enter the ${label.toLowerCase()} for this template.`,
      defaultValue: '',
    };

    const currentFields = options.customFields || [];
    setOptions({
      ...options,
      customFields: [...currentFields, newField],
    });
  };

  const handleRemoveAcfField = (id: string) => {
    const currentFields = options.customFields || [];
    setOptions({
      ...options,
      customFields: currentFields.filter((f) => f.id !== id),
    });
  };

  // Widget Area Add
  const handleAddWidgetArea = () => {
    const name = prompt('Widget Sidebar Name (e.g. Header Top, Footer Column 2, Shop Sidebar):', 'Footer Column 2');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newWidget: WidgetArea = {
      id: `widget-${Date.now()}`,
      slug,
      name,
      description: `Custom widget area for ${name}.`,
    };

    setOptions({
      ...options,
      widgetAreas: [...options.widgetAreas, newWidget],
    });
  };

  const handleRemoveWidgetArea = (id: string) => {
    setOptions({
      ...options,
      widgetAreas: options.widgetAreas.filter((w) => w.id !== id),
    });
  };

  // Menu Location Add
  const handleAddMenuLocation = () => {
    const name = prompt('Menu Name (e.g. Header Utility, Mobile Drawer, Footer Secondary):', 'Footer Secondary Menu');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newMenu: MenuLocation = {
      id: `menu-${Date.now()}`,
      slug,
      name,
    };

    setOptions({
      ...options,
      menuLocations: [...options.menuLocations, newMenu],
    });
  };

  const handleRemoveMenuLocation = (id: string) => {
    setOptions({
      ...options,
      menuLocations: options.menuLocations.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#10121a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0b0d14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">WordPress Theme Studio &amp; Extension Center</h2>
              <p className="text-xs text-zinc-400">Configure Elementor, Gutenberg, CPTs, Taxonomies, ACF &amp; Demo Importers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] bg-[#0e1017] px-4 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('elementor')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'elementor'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Component className="w-3.5 h-3.5 text-rose-400" />
            <span>Elementor Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('cpt')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cpt'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-400" />
            <span>CPTs &amp; Taxonomies</span>
          </button>

          <button
            onClick={() => setActiveTab('acf')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'acf'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACF Custom Fields</span>
          </button>

          <button
            onClick={() => setActiveTab('gutenberg')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'gutenberg'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gutenberg &amp; theme.json</span>
          </button>

          <button
            onClick={() => setActiveTab('demo-i18n')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'demo-i18n'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Demo Data (WXR) &amp; i18n</span>
          </button>

          <button
            onClick={() => setActiveTab('menus-widgets')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'menus-widgets'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-cyan-400" />
            <span>Menus &amp; Sidebars</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-amber-400 text-amber-300 bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>General Meta</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">

          {/* TAB: ELEMENTOR STUDIO */}
          {activeTab === 'elementor' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 to-amber-950/20 border border-rose-500/20">
                <div className="flex items-start gap-3">
                  <Component className="w-5 h-5 text-rose-400 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Full Elementor &amp; Elementor Pro Theme Builder Integration</h3>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Your theme automatically registers <strong>Elementor Theme Builder Locations</strong> (Header, Footer, Single Post, Archive, 404), injects conditional location checks in <code className="text-amber-300 font-mono">header.php</code> and <code className="text-amber-300 font-mono">footer.php</code>, and builds native custom PHP Elementor widgets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Elementor Features Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">Theme Builder Locations</span>
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] rounded-md font-bold">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Header, Footer &amp; Single templates replaceable via Elementor Pro.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">Elementor Canvas</span>
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] rounded-md font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Blank full-width template for landing pages in <code className="text-zinc-300">template-elementor-canvas.php</code>.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">Full Width Container</span>
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] rounded-md font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Full-width page layout keeping theme header/footer intact.</p>
                </div>
              </div>

              {/* Custom Elementor Widgets Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Custom Elementor Widgets (PHP Widget_Base)</h4>
                    <p className="text-[11px] text-zinc-400">Native PHP classes created inside <code className="text-amber-400">inc/elementor-widgets/</code></p>
                  </div>
                  <button
                    onClick={handleAddElementorWidget}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-rose-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Widget</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(options.customElementorWidgets || [
                    { id: '1', name: 'theme_hero_section', title: 'Theme Hero Banner', icon: 'eicon-banner', category: 'theme-elements', fields: [] },
                    { id: '2', name: 'theme_features_grid', title: 'Theme Features Grid', icon: 'eicon-posts-grid', category: 'theme-elements', fields: [] }
                  ]).map((widget) => (
                    <div
                      key={widget.id}
                      className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                          <Component className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{widget.title}</div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            Class: <code className="text-rose-300">class-elementor-{widget.name.replace(/_/g, '-')}-widget.php</code>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono">
                        category: theme-elements
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CPT & TAXONOMIES */}
          {activeTab === 'cpt' && (
            <div className="space-y-6">
              {/* CPT Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Custom Post Types (CPT)</h3>
                    <p className="text-xs text-zinc-400">Generates register_post_type(), single-[cpt].php &amp; archive-[cpt].php</p>
                  </div>
                  <button
                    onClick={handleAddCPT}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Post Type</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {options.customPostTypes.map((cpt) => (
                    <div
                      key={cpt.id}
                      className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2 text-xs">
                          <span>{cpt.pluralName}</span>
                          <code className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-amber-300 rounded font-mono">
                            {cpt.slug}
                          </code>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Singular: <strong className="text-zinc-300">{cpt.singularName}</strong> &bull; Supports: {cpt.supports.join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCPT(cpt.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxonomies Section */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Custom Taxonomies (Categories &amp; Tags)</h3>
                    <p className="text-xs text-zinc-400">Generates register_taxonomy() linked to your post types</p>
                  </div>
                  <button
                    onClick={handleAddTaxonomy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Taxonomy</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(options.customTaxonomies || [
                    { id: '1', slug: 'project_type', singularName: 'Project Category', pluralName: 'Project Categories', postTypes: ['portfolio'], hierarchical: true },
                    { id: '2', slug: 'skill_tag', singularName: 'Skill Tag', pluralName: 'Skill Tags', postTypes: ['portfolio'], hierarchical: false }
                  ]).map((tax) => (
                    <div
                      key={tax.id}
                      className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2 text-xs">
                          <span>{tax.pluralName}</span>
                          <code className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-indigo-300 rounded font-mono">
                            {tax.slug}
                          </code>
                          <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.05] text-zinc-400 rounded">
                            {tax.hierarchical ? 'Category (Hierarchical)' : 'Tag (Flat)'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveTaxonomy(tax.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACF CUSTOM FIELDS */}
          {activeTab === 'acf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Advanced Custom Fields (ACF) Visual Builder</h3>
                  <p className="text-xs text-zinc-400">
                    Exports <code className="text-emerald-400">acf-json/group_theme_fields.json</code> for instant sync inside ACF plugin.
                  </p>
                </div>
                <button
                  onClick={handleAddAcfField}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add ACF Field</span>
                </button>
              </div>

              <div className="space-y-2">
                {(options.customFields && options.customFields.length > 0 ? options.customFields : [
                  { id: '1', name: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea', instructions: 'Custom subheading for hero block.' },
                  { id: '2', name: 'client_name', label: 'Client Name', type: 'text', instructions: 'Client or company name for portfolio.' },
                  { id: '3', name: 'project_rating', label: 'Project Review Stars', type: 'number', instructions: 'Numeric star rating (1-5).' },
                  { id: '4', name: 'cta_button_url', label: 'CTA Button URL', type: 'url', instructions: 'Direct destination link.' }
                ]).map((field) => (
                  <div
                    key={field.id}
                    className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2 text-xs">
                        <span>{field.label}</span>
                        <code className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-emerald-300 rounded font-mono">
                          get_field('{field.name}')
                        </code>
                        <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.05] text-zinc-400 rounded uppercase font-mono">
                          {field.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">{field.instructions}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveAcfField(field.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GUTENBERG & THEME.JSON */}
          {activeTab === 'gutenberg' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-400" />
                  <span>WordPress 6.x Full Site Editing (FSE) &amp; block.json</span>
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Generates native <code className="text-indigo-300 font-mono">theme.json</code> with global color presets, typography scaling, fluid spacing, and custom <code className="text-indigo-300 font-mono">block.json</code> blocks inside <code className="text-indigo-300 font-mono">blocks/</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl">
                  <div className="font-bold text-white text-xs mb-1">blocks/hero-banner/</div>
                  <p className="text-[11px] text-zinc-400">Native block with block.json manifest &amp; server-side render.php</p>
                </div>

                <div className="p-3.5 bg-[#08090d] border border-white/[0.08] rounded-xl">
                  <div className="font-bold text-white text-xs mb-1">blocks/feature-grid/</div>
                  <p className="text-[11px] text-zinc-400">3-Column responsive card grid block with color &amp; align-wide supports</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEMO DATA & I18N */}
          {activeTab === 'demo-i18n' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>One-Click Demo Content Importer (WXR XML 1.2)</span>
                </h3>
                <div className="p-4 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs space-y-2 text-zinc-300">
                  <p>
                    <strong>demo-data/content.xml:</strong> An export XML containing all pages, posts, and navigation menus extracted from your HTML mockups.
                  </p>
                  <p>
                    <strong>inc/ocdi-config.php:</strong> Seamless integration with the popular <em>One Click Demo Import (OCDI)</em> plugin for 1-click client setup.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>Localization &amp; POT File Generator (i18n)</span>
                </h3>
                <div className="p-4 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs space-y-2 text-zinc-300">
                  <p>
                    <strong>languages/{meta.textDomain || 'theme'}.pot:</strong> Standard GNU gettext catalog with auto-scanned strings for 100% translation readiness with WPML, Polylang, and Loco Translate.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MENUS & WIDGETS */}
          {activeTab === 'menus-widgets' && (
            <div className="space-y-6">
              {/* Menu Locations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Navigation Menu Locations</h3>
                    <p className="text-[11px] text-zinc-400">Registered with register_nav_menus()</p>
                  </div>
                  <button
                    onClick={handleAddMenuLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Menu</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {options.menuLocations.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200 text-xs">{m.name}</span>
                        <code className="text-[10px] text-amber-400 font-mono">({m.slug})</code>
                      </div>
                      <button
                        onClick={() => handleRemoveMenuLocation(m.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget Areas */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Widget Sidebars</h3>
                    <p className="text-[11px] text-zinc-400">Registered with register_sidebar() in functions.php</p>
                  </div>
                  <button
                    onClick={handleAddWidgetArea}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sidebar</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {options.widgetAreas.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-[#08090d] border border-white/[0.08] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-zinc-200 text-xs">{w.name}</div>
                        <div className="text-[10px] text-zinc-400">{w.description}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveWidgetArea(w.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GENERAL META */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Theme Name</label>
                <input
                  type="text"
                  value={meta.name}
                  onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Text Domain</label>
                <input
                  type="text"
                  value={meta.textDomain}
                  onChange={(e) => setMeta({ ...meta, textDomain: e.target.value })}
                  className="w-full px-3 py-2 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Author</label>
                <input
                  type="text"
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  className="w-full px-3 py-2 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Version</label>
                <input
                  type="text"
                  value={meta.version}
                  onChange={(e) => setMeta({ ...meta, version: e.target.value })}
                  className="w-full px-3 py-2 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-zinc-300">Description</label>
                <textarea
                  rows={2}
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#08090d] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0b0d14] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSaveAndConvert();
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply &amp; Rebuild WordPress Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
};
