export interface SourceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'html' | 'css' | 'javascript' | 'image' | 'json' | 'other';
  isMain?: boolean;
  templateType?: 'front-page' | 'index' | 'page' | 'single' | 'archive' | '404' | 'custom-page' | 'woocommerce-shop' | 'woocommerce-product' | 'contact' | 'about' | 'pricing' | 'portfolio';
  templateName?: string;
}

export interface VisualTagBinding {
  id: string;
  selector: string;
  originalText?: string;
  tagType: 'the_title' | 'the_content' | 'the_excerpt' | 'the_post_thumbnail' | 'the_permalink' | 'the_author' | 'the_date' | 'bloginfo_name' | 'bloginfo_description' | 'wp_nav_menu' | 'dynamic_sidebar' | 'custom_field' | 'shortcode' | 'woocommerce_price' | 'woocommerce_add_to_cart';
  customSnippet?: string;
  customFieldName?: string;
  widgetAreaSlug?: string;
  menuLocationSlug?: string;
}

export interface WordPressThemeMeta {
  name: string;
  themeUri: string;
  author: string;
  authorUri: string;
  description: string;
  version: string;
  license: string;
  licenseUri: string;
  textDomain: string;
  tags: string[];
  requiresPHP: string;
  requiresWP: string;
}

export interface CustomPostType {
  id: string;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  supports: string[];
  hasArchive: boolean;
}

export interface WidgetArea {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface MenuLocation {
  id: string;
  slug: string;
  name: string;
}

export interface AcfFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'url' | 'number' | 'true_false' | 'wysiwyg' | 'select';
  instructions?: string;
  defaultValue?: string;
}

export interface CustomTaxonomy {
  id: string;
  slug: string;
  singularName: string;
  pluralName: string;
  postTypes: string[];
  hierarchical: boolean;
}

export interface ElementorWidgetField {
  name: string;
  label: string;
  type: 'TEXT' | 'TEXTAREA' | 'WYSIWYG' | 'MEDIA' | 'URL' | 'SWITCHER' | 'SELECT' | 'COLOR';
  default: string;
}

export interface ElementorWidgetDefinition {
  id: string;
  name: string;
  title: string;
  icon: string;
  category: string;
  fields: ElementorWidgetField[];
}

export interface GutenbergBlockDefinition {
  id: string;
  name: string;
  title: string;
  icon: string;
  category: string;
  description: string;
}

export interface AcfFieldGroup {
  id: string;
  key: string;
  title: string;
  locationPostType: string;
  fields: AcfFieldDefinition[];
}

export interface ConversionOptions {
  themeType: 'classic' | 'hybrid' | 'block';
  enableTitleTag: boolean;
  enablePostThumbnails: boolean;
  enableCustomLogo: boolean;
  enableHTML5: boolean;
  enableResponsiveEmbeds: boolean;
  enableAlignWide: boolean;
  enableWooCommerce: boolean;
  enableWCGalleryZoom?: boolean;
  enableWCGalleryLightbox?: boolean;
  enableWCGallerySlider?: boolean;
  wooGalleryZoom?: boolean;
  wooGalleryLightbox?: boolean;
  wooGallerySlider?: boolean;
  enableBlockPatterns?: boolean;
  generateThemeJson?: boolean;
  generatePlaygroundBlueprint?: boolean;
  enableACFHelper: boolean;
  enableAcfJsonExport?: boolean;
  customFields?: AcfFieldDefinition[];
  acfFieldGroups?: AcfFieldGroup[];
  customPostTypes: CustomPostType[];
  customTaxonomies?: CustomTaxonomy[];
  widgetAreas: WidgetArea[];
  menuLocations: MenuLocation[];
  extractLoop: boolean;
  extractHeaderFooter: boolean;
  extractSidebar: boolean;
  visualBindings?: VisualTagBinding[];
  // Advanced Features
  enableElementor?: boolean;
  enableElementorHeaderFooter?: boolean;
  enableElementorCanvas?: boolean;
  customElementorWidgets?: ElementorWidgetDefinition[];
  enableGutenbergBlocks?: boolean;
  gutenbergBlocks?: GutenbergBlockDefinition[];
  enableDemoImport?: boolean;
  generateWxrXml?: boolean;
  generatePotFile?: boolean;
  enableScriptDefer?: boolean;
  enableGoogleFontsPreconnect?: boolean;
}

export interface WordPressThemeFile {
  path: string;
  name: string;
  content: string;
  language: 'php' | 'css' | 'javascript' | 'json' | 'markdown';
  purpose: string;
  isCore?: boolean;
  folder?: string;
}

export interface ValidationItem {
  id: string;
  title: string;
  category: 'core' | 'hooks' | 'standards' | 'security' | 'assets' | 'woocommerce' | 'blocks';
  status: 'pass' | 'warning' | 'error';
  description: string;
  codeSnippet?: string;
  recommendation?: string;
}

export interface ConversionStats {
  filesCreated: number;
  phpHooksInjected: number;
  templateTagsUsed: number;
  assetsEnqueued: number;
  themeScore: number;
  generationTimeMs: number;
  blockPatternsCount?: number;
  customPagesCount?: number;
}

export interface PlaygroundBlueprint {
  landingPage?: string;
  preferredVersions?: {
    php?: string;
    wp?: string;
  };
  steps?: any[];
}

export interface ConversionResult {
  files: WordPressThemeFile[];
  meta: WordPressThemeMeta;
  options: ConversionOptions;
  stats: ConversionStats;
  validations: ValidationItem[];
  warnings: string[];
  summary: string;
  aiEnhanced?: boolean;
  blueprint?: PlaygroundBlueprint;
}

export interface SampleTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage?: string;
  themeMeta: WordPressThemeMeta;
  options: ConversionOptions;
  files: SourceFile[];
}
