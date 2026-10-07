import React, { useState } from 'react';
import { AlertTriangle, Check, ShieldCheck, X } from 'lucide-react';
import { ConversionResult, ValidationItem } from '../types';

interface ThemeValidationReportProps {
  result: ConversionResult | null;
}

const CATEGORIES: { id: 'all' | ValidationItem['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'standards', label: 'Standards' },
  { id: 'security', label: 'Security' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'woocommerce', label: 'WooCommerce' },
];

const STATUS_STYLE: Record<ValidationItem['status'], { bg: string; fg: string; Icon: typeof Check }> = {
  pass: { bg: 'bg-ok-soft', fg: 'text-ok', Icon: Check },
  warning: { bg: 'bg-warn-soft', fg: 'text-warn', Icon: AlertTriangle },
  error: { bg: 'bg-err-soft', fg: 'text-err', Icon: X },
};

/**
 * Which template WordPress resolves first for common requests, given the generated files.
 */
function hierarchyRows(paths: Set<string>) {
  const pick = (...candidates: string[]) => candidates.filter((c) => paths.has(c));
  const pageTemplate = [...paths].find((p) => /^page-[^/]+\.php$/.test(p));
  const rows = [
    { label: 'Front page', chain: pick('front-page.php', 'home.php', 'index.php') },
    { label: 'Blog post', chain: pick('single.php', 'singular.php', 'index.php') },
    { label: 'Archive', chain: pick('archive.php', 'index.php') },
    { label: 'Not found', chain: pick('404.php', 'index.php') },
  ];
  if (pageTemplate) {
    rows.splice(1, 0, { label: pageTemplate.replace(/^page-|\.php$/g, ''), chain: [pageTemplate, ...pick('page.php', 'index.php')] });
  }
  return rows.filter((r) => r.chain.length > 0);
}

export const ThemeValidationReport: React.FC<ThemeValidationReportProps> = ({ result }) => {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]['id']>('all');

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="island p-8 max-w-sm">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-accent-ink" />
          <h2 className="font-display text-lg font-bold mb-1">Nothing to audit yet</h2>
          <p className="text-sm text-muted">Convert your HTML to check PHP syntax, hooks, security and standards.</p>
        </div>
      </div>
    );
  }

  const { validations } = result;
  const passCount = validations.filter((v) => v.status === 'pass').length;
  const warnings = validations.filter((v) => v.status === 'warning');
  const errors = validations.filter((v) => v.status === 'error');
  const phpFiles = result.files.filter((f) => f.language === 'php').length;
  const phpErrorItem = validations.find((v) => v.id === 'security-php-syntax' && v.status === 'error');
  const phpErrorCount = phpErrorItem?.codeSnippet?.split('\n').length ?? 0;
  const integrity = [
    { label: 'Duplicate declarations', id: 'core-duplicate-declarations' },
    { label: 'Missing includes', id: 'core-missing-includes' },
    { label: 'Invalid JSON', id: 'standards-json' },
  ].map((row) => {
    const item = validations.find((v) => v.id === row.id);
    return { ...row, count: item?.codeSnippet ? item.codeSnippet.split('\n').length : 0 };
  });
  const issues = [...errors, ...warnings];
  const visible = filter === 'all' ? validations : validations.filter((v) => v.category === filter);
  const categoriesPresent = CATEGORIES.filter((c) => c.id === 'all' || validations.some((v) => v.category === c.id));
  const rows = hierarchyRows(new Set(result.files.map((f) => f.path)));
  const headline = errors.length
    ? `${errors.length} issue${errors.length > 1 ? 's' : ''} to fix before installing.`
    : 'Ready to install on any WordPress 6.x site.';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
        {/* Score */}
        <section className="sm:col-span-2 flex flex-wrap items-center gap-7 p-7 rounded-3xl bg-ink text-white">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[#A9AFBC]">Theme health</span>
            <span className="font-display text-8xl font-bold leading-[0.9] tracking-tighter">{result.stats.themeScore}</span>
          </div>
          <div className="flex-[1_1_260px] flex flex-col gap-3.5">
            <h1 className="font-display text-[28px] font-bold leading-tight">{headline}</h1>
            <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
              <span className="px-3 py-1.5 rounded-full bg-[#1F3A2B] text-[#8CE8B4]">{passCount} passed</span>
              <span className="px-3 py-1.5 rounded-full bg-[#3A3018] text-[#F6CF7A]">
                {warnings.length} warning{warnings.length === 1 ? '' : 's'}
              </span>
              <span className={`px-3 py-1.5 rounded-full ${errors.length ? 'bg-[#4A1D1A] text-[#FFB4AB]' : 'bg-[#262A34] text-[#D7DAE1]'}`}>
                {errors.length} error{errors.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </section>

        {/* PHP syntax */}
        <section className="island p-6 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">PHP 8 syntax</h2>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${phpErrorItem ? 'bg-err-soft text-err' : 'bg-ok-soft text-ok'}`}>
              {phpErrorItem ? <X className="w-3.5 h-3.5" strokeWidth={3} /> : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
          </div>
          <span className="font-display text-[40px] font-bold leading-none">
            {phpFiles - phpErrorCount} / {phpFiles}
          </span>
          <span className="text-muted">files parsed without errors</span>
        </section>

        {/* Integrity */}
        <section className="island p-6 flex flex-col gap-3">
          <h2 className="text-[15px] font-bold">Integrity</h2>
          {integrity.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-inset">
              <span>{row.label}</span>
              <strong className={row.count ? 'text-err' : ''}>{row.count}</strong>
            </div>
          ))}
        </section>

        {/* Template hierarchy */}
        <section className="island sm:col-span-2 p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-bold">Template hierarchy</h2>
            <span className="text-[13px] text-muted">What WordPress loads for each request</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-[13px] text-muted capitalize truncate">{row.label}</span>
                {row.chain.map((file, i) => (
                  <React.Fragment key={file}>
                    {i > 0 && <span className="text-faint" aria-hidden="true">→</span>}
                    <span className={`px-3 py-2 rounded-[10px] font-mono text-xs ${i === 0 ? 'bg-accent text-white' : 'bg-inset text-muted'}`}>{file}</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Issues */}
        <section className={`p-6 flex flex-col gap-3 rounded-[22px] ${issues.length ? (errors.length ? 'bg-err-soft' : 'bg-warn-soft') : 'island'}`}>
          <div className="flex items-center gap-2">
            {issues.length ? (
              <AlertTriangle className={`w-[18px] h-[18px] ${errors.length ? 'text-err' : 'text-warn'}`} />
            ) : (
              <ShieldCheck className="w-[18px] h-[18px] text-ok" />
            )}
            <h2 className="text-[15px] font-bold">{issues.length ? `${issues.length} to review` : 'No issues'}</h2>
          </div>
          {issues.length === 0 && <p className="text-muted leading-relaxed">Every check passed.</p>}
          {issues.slice(0, 3).map((item) => (
            <div key={item.id} className="flex flex-col gap-1">
              <p className="font-semibold leading-snug">{item.title}</p>
              <p className="text-[13px] text-ink-2 leading-relaxed">{item.description}</p>
              {item.codeSnippet && (
                <pre className="mt-1 p-2.5 rounded-lg bg-island/70 text-[11px] font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto">{item.codeSnippet}</pre>
              )}
            </div>
          ))}
        </section>

        {/* All checks */}
        <section className="island col-span-full p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold">All checks</h2>
            <div role="group" aria-label="Filter checks" className="flex flex-wrap gap-1.5">
              {categoriesPresent.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilter(c.id)}
                  aria-pressed={filter === c.id}
                  className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                    filter === c.id ? 'bg-ink text-white border-ink' : 'bg-island text-ink-2 border-line-strong hover:bg-inset'
                  }`}
                >
                  {c.label}
                  {c.id === 'all' && ` ${validations.length}`}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {visible.map((item) => {
              const s = STATUS_STYLE[item.status];
              return (
                <li key={item.id} className="flex flex-wrap items-start gap-3.5 py-3.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.bg} ${s.fg}`}>
                    <s.Icon className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                  <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-0.5">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-[13px] text-muted leading-relaxed">{item.description}</span>
                    {item.recommendation && <span className="text-[13px] text-accent-ink">Fix: {item.recommendation}</span>}
                  </div>
                  <span className="text-xs text-muted px-2.5 py-1 rounded-full border border-line-strong capitalize">{item.category}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};
