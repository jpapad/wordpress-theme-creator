import React from 'react';
import { X, BookOpen, FileCode, Layers, HelpCircle, CheckCircle2, Code2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md">
      <div className="bg-island border border-line rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-inset">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent-ink rounded-xl border border-accent/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink font-display">WordPress Theme Architecture &amp; Hierarchy Guide</h2>
              <p className="text-xs text-muted">How your HTML &amp; CSS markup maps to WordPress Core files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink rounded-xl hover:bg-ink/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink-2">
          {/* Mapping Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-2 uppercase tracking-wider">
              Core Template Mapping Table
            </h3>

            <div className="border border-line rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-inset text-muted font-semibold border-b border-line">
                  <tr>
                    <th className="p-3.5">HTML Section</th>
                    <th className="p-3.5">WordPress File</th>
                    <th className="p-3.5">Primary WordPress Tags &amp; Functions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-inset">
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">&lt;head&gt; + Header &amp; Nav</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">header.php</td>
                    <td className="p-3.5 font-mono text-muted">wp_head(), body_class(), wp_nav_menu()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">Main Feed / Post Grid</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">index.php</td>
                    <td className="p-3.5 font-mono text-muted">have_posts(), the_post(), the_title()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">Single Article View</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">single.php</td>
                    <td className="p-3.5 font-mono text-muted">the_content(), comments_template()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">Static Page View</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">page.php</td>
                    <td className="p-3.5 font-mono text-muted">the_content(), wp_link_pages()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">Sidebar &amp; Widgets</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">sidebar.php</td>
                    <td className="p-3.5 font-mono text-muted">dynamic_sidebar('main-sidebar')</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">&lt;footer&gt; + Scripts</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">footer.php</td>
                    <td className="p-3.5 font-mono text-muted">wp_footer(), get_footer()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink-2">Theme Logic &amp; Hooks</td>
                    <td className="p-3.5 font-mono text-accent-ink font-bold">functions.php</td>
                    <td className="p-3.5 font-mono text-muted">add_theme_support(), wp_enqueue_scripts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Essential WP Theme Guidelines */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-2 uppercase tracking-wider">
              Theme Development Best Practices
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 bg-inset border border-line rounded-2xl">
                <div className="font-semibold text-ink mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Enqueued Assets</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Never hardcode <code>&lt;link rel="stylesheet"&gt;</code> or <code>&lt;script&gt;</code> in <code>header.php</code>. Always use <code>wp_enqueue_style()</code> and <code>wp_enqueue_script()</code> in <code>functions.php</code>.
                </p>
              </div>

              <div className="p-4 bg-inset border border-line rounded-2xl">
                <div className="font-semibold text-ink mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Security &amp; Sanitization</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Always wrap translated strings with <code>esc_html__()</code>, links with <code>esc_url()</code>, and attributes with <code>esc_attr()</code>.
                </p>
              </div>

              <div className="p-4 bg-inset border border-line rounded-2xl">
                <div className="font-semibold text-ink mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Modular Template Parts</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Extract reusable post cards into <code>template-parts/content.php</code> and call them via <code>get_template_part('template-parts/content')</code>.
                </p>
              </div>

              <div className="p-4 bg-inset border border-line rounded-2xl">
                <div className="font-semibold text-ink mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Customizer Ready</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Enable <code>add_theme_support('custom-logo')</code> so users can upload brand logos directly from the WordPress Customizer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line bg-inset flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-ink-2 hover:text-ink bg-inset hover:bg-line rounded-xl transition-colors border border-line"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
