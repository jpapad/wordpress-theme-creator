import React from 'react';
import { RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { ConversionOptions, ConversionResult, VisualTagBinding, WordPressThemeMeta } from '../types';

interface InspectorProps {
  meta: WordPressThemeMeta;
  setMeta: React.Dispatch<React.SetStateAction<WordPressThemeMeta>>;
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  result: ConversionResult | null;
  isConverting: boolean;
  onConvert: () => void;
  onOpenConfig: () => void;
}

const TAG_LABELS: Record<VisualTagBinding['tagType'], string> = {
  the_title: 'the_title()',
  the_content: 'the_content()',
  the_excerpt: 'the_excerpt()',
  the_post_thumbnail: 'the_post_thumbnail()',
  the_permalink: 'the_permalink()',
  the_author: 'the_author()',
  the_date: 'get_the_date()',
  bloginfo_name: "bloginfo('name')",
  bloginfo_description: "bloginfo('description')",
  wp_nav_menu: 'wp_nav_menu()',
  dynamic_sidebar: 'dynamic_sidebar()',
  custom_field: 'get_post_meta()',
  shortcode: 'do_shortcode()',
  woocommerce_price: 'get_price_html()',
  woocommerce_add_to_cart: 'add_to_cart()',
};

/** Accessible on/off switch */
const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-3 py-1.5 cursor-pointer">
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold">{label}</span>
      <span className="block text-xs text-muted leading-snug">{hint}</span>
    </span>
    <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
    <span
      aria-hidden="true"
      className="mt-0.5 w-10 h-6 rounded-full bg-line-strong peer-checked:bg-accent relative shrink-0 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
    />
  </label>
);

/**
 * ACF / Elementor toggles and the sections whose content becomes editable.
 */
const EditableContent: React.FC<{
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  result: ConversionResult | null;
}> = ({ options, onOptionsChange, result }) => {
  const sections = result?.editableSections ?? [];
  const enabled = !!options.enableACFHelper || !!options.enableElementor;
  const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);
  const repeated = sections.reduce((n, s) => n + s.repeatedItems, 0);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[13px] font-semibold mb-1">Editable content</h3>
      <Switch
        label="ACF fields"
        hint="Texts, buttons & images editable from the page editor"
        checked={!!options.enableACFHelper}
        onChange={(v) => onOptionsChange({ ...options, enableACFHelper: v })}
      />
      <Switch
        label="Elementor widgets"
        hint="Each section becomes a drag & drop widget"
        checked={!!options.enableElementor}
        onChange={(v) => onOptionsChange({ ...options, enableElementor: v })}
      />
      {enabled && (
        <div className="mt-2 flex flex-col gap-1.5">
          {sections.length === 0 ? (
            <p className="text-xs text-muted leading-relaxed">
              No sections found. Wrap page parts in <code className="font-mono">&lt;section&gt;</code> to make them editable.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted">
                {sections.length} section{sections.length === 1 ? '' : 's'} · {fieldCount} field{fieldCount === 1 ? '' : 's'}
              </p>
              <ul className="flex flex-col gap-1.5">
                {sections.map((s) => (
                  <li key={s.slug} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-inset text-[13px]">
                    <span className="flex-1 min-w-0 truncate font-medium">{s.title}</span>
                    <span className="text-xs text-muted shrink-0">{s.page}</span>
                    <span className="text-xs font-semibold text-accent-ink shrink-0">{s.fields.length}</span>
                  </li>
                ))}
              </ul>
              {repeated > 0 && (
                <p className="text-xs text-muted leading-relaxed">
                  {repeated} repeated items (cards, lists) stay static; use a custom post type for those.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const fieldClass =
  'h-[42px] px-3 rounded-xl border border-line-strong bg-island text-ink text-[13px] font-medium outline-none focus:border-accent';

/**
 * Right island: theme identity, conversion trigger, visual bindings and output summary.
 */
export const Inspector: React.FC<InspectorProps> = ({
  meta,
  setMeta,
  options,
  onOptionsChange,
  result,
  isConverting,
  onConvert,
  onOpenConfig,
}) => {
  const bindings = options.visualBindings || [];

  return (
    <aside aria-label="Inspector" className="island flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-base">Theme</h2>
        <button
          type="button"
          onClick={onOpenConfig}
          className="h-8 px-2.5 rounded-[10px] text-[13px] font-semibold text-accent-ink hover:bg-accent-soft flex items-center gap-1.5 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Advanced
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Name
        <input
          type="text"
          value={meta.name}
          onChange={(e) => setMeta({ ...meta, name: e.target.value })}
          placeholder="Theme Name"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Text domain
        <input
          type="text"
          value={meta.textDomain}
          onChange={(e) => setMeta({ ...meta, textDomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          placeholder="textdomain"
          className={`${fieldClass} font-mono`}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Author
        <input
          type="text"
          value={meta.author}
          onChange={(e) => setMeta({ ...meta, author: e.target.value })}
          placeholder="Author"
          className={fieldClass}
        />
      </label>

      <button
        type="button"
        id="btn-convert"
        onClick={onConvert}
        disabled={isConverting}
        className="min-h-11 rounded-xl bg-ink text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-ink-2 transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${isConverting ? 'animate-spin' : ''}`} />
        {isConverting ? 'Converting…' : 'Convert'}
        <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-white/15 text-white/80">Ctrl S</kbd>
      </button>

      <EditableContent options={options} onOptionsChange={onOptionsChange} result={result} />

      <div className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold">Dynamic bindings</h3>
        {bindings.length === 0 ? (
          <p className="text-[13px] text-muted leading-relaxed">
            In Preview, turn on <strong className="text-ink-2">Visual Tag Binder</strong> and click any text to connect it to WordPress data.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {bindings.map((b) => (
              <li key={b.id} className="flex items-center gap-2 py-2 pl-3 pr-1.5 rounded-xl bg-inset text-[13px]">
                <span className="flex-1 min-w-0 truncate">{b.originalText || b.selector}</span>
                <span className="font-mono text-xs text-accent-ink shrink-0">{TAG_LABELS[b.tagType]}</span>
                <button
                  type="button"
                  aria-label={`Remove binding ${b.originalText || b.selector}`}
                  onClick={() => onOptionsChange({ ...options, visualBindings: bindings.filter((x) => x.id !== b.id) })}
                  className="w-7 h-7 rounded-lg text-faint hover:text-err hover:bg-island flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <dl className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-canvas">
          <div className="p-3 rounded-xl bg-inset">
            <dt className="text-xs text-muted">Score</dt>
            <dd className="font-display text-2xl font-bold">{result.stats.themeScore}</dd>
          </div>
          <div className="p-3 rounded-xl bg-inset">
            <dt className="text-xs text-muted">Built in</dt>
            <dd className="font-display text-2xl font-bold">
              {result.stats.generationTimeMs}
              <span className="text-sm font-semibold text-muted"> ms</span>
            </dd>
          </div>
        </dl>
      )}
    </aside>
  );
};
