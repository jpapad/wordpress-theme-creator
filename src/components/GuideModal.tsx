import React from 'react';
import { X, BookOpen, FileCode, Layers, HelpCircle, CheckCircle2, Code2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0c0e15] border border-white/[0.08] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#08090d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">WordPress Theme Architecture &amp; Hierarchy Guide</h2>
              <p className="text-xs text-zinc-400">How your HTML &amp; CSS markup maps to WordPress Core files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          {/* Mapping Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Core Template Mapping Table
            </h3>

            <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#08090d] text-zinc-400 font-semibold border-b border-white/[0.06]">
                  <tr>
                    <th className="p-3.5">HTML Section</th>
                    <th className="p-3.5">WordPress File</th>
                    <th className="p-3.5">Primary WordPress Tags &amp; Functions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] bg-[#0a0c12]">
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">&lt;head&gt; + Header &amp; Nav</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">header.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">wp_head(), body_class(), wp_nav_menu()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">Main Feed / Post Grid</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">index.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">have_posts(), the_post(), the_title()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">Single Article View</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">single.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">the_content(), comments_template()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">Static Page View</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">page.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">the_content(), wp_link_pages()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">Sidebar &amp; Widgets</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">sidebar.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">dynamic_sidebar('main-sidebar')</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">&lt;footer&gt; + Scripts</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">footer.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">wp_footer(), get_footer()</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-zinc-200">Theme Logic &amp; Hooks</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">functions.php</td>
                    <td className="p-3.5 font-mono text-zinc-400">add_theme_support(), wp_enqueue_scripts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Essential WP Theme Guidelines */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Theme Development Best Practices
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 bg-[#08090d] border border-white/[0.06] rounded-2xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enqueued Assets</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Never hardcode <code>&lt;link rel="stylesheet"&gt;</code> or <code>&lt;script&gt;</code> in <code>header.php</code>. Always use <code>wp_enqueue_style()</code> and <code>wp_enqueue_script()</code> in <code>functions.php</code>.
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/[0.06] rounded-2xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security &amp; Sanitization</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Always wrap translated strings with <code>esc_html__()</code>, links with <code>esc_url()</code>, and attributes with <code>esc_attr()</code>.
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/[0.06] rounded-2xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Modular Template Parts</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Extract reusable post cards into <code>template-parts/content.php</code> and call them via <code>get_template_part('template-parts/content')</code>.
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/[0.06] rounded-2xl">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customizer Ready</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Enable <code>add_theme_support('custom-logo')</code> so users can upload brand logos directly from the WordPress Customizer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#08090d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800/90 hover:bg-zinc-700 rounded-xl transition-colors border border-white/10"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
