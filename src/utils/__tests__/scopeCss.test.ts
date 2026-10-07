import { describe, expect, it } from 'vitest';
import { scopeCss } from '../scopeCss';

describe('scopeCss', () => {
  it('wraps rules and maps document selectors to :scope', () => {
    const out = scopeCss('* { padding: 0 }\nbody { color: red }\n:root{--a:1}\nhtml, .x body > p { margin: 0 }', '.preview');
    expect(out).toContain('@scope (.preview) {');
    expect(out).toContain(':scope { color: red }');
    expect(out).toContain(':scope{--a:1}');
    expect(out).toContain(':scope, .x :scope > p');
    expect(out).not.toMatch(/\bbody\b/);
  });

  it('keeps font-face, keyframes and imports at top level', () => {
    const css = "@import url('a.css');\n.a{x:1}\n@font-face { font-family: X; src: url(x.woff2) }\n@keyframes spin { from { a: 1 } to { a: 2 } }\n.b{y:2}";
    const out = scopeCss(css, '.p');
    const scopeStart = out.indexOf('@scope');
    expect(out.indexOf("@import url('a.css');")).toBeLessThan(scopeStart);
    expect(out.indexOf('@font-face')).toBeLessThan(scopeStart);
    expect(out.indexOf('@keyframes spin { from { a: 1 } to { a: 2 } }')).toBeLessThan(scopeStart);
    expect(out.slice(scopeStart)).toContain('.a{x:1}');
    expect(out.slice(scopeStart)).toContain('.b{y:2}');
  });

  it('maps body with classes to :scope', () => {
    const out = scopeCss('body.site-body { background: #000 } body.home.blog .x { a: 1 }', '.p');
    expect(out).toContain(':scope { background: #000 }');
    expect(out).toContain(':scope .x { a: 1 }');
  });

  it('does not touch class names containing body/html', () => {
    const out = scopeCss('.entry-body { a: 1 } .html-block{b:2}', '.p');
    expect(out).toContain('.entry-body');
    expect(out).toContain('.html-block');
  });
});
