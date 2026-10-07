/**
 * Confines a theme stylesheet to one container so it cannot restyle the app around it.
 *
 * Wraps the rules in `@scope (<root>) { ... }`; `html`, `body` and `:root` selectors are
 * mapped to `:scope` (the container). Rules that cannot live inside @scope
 * (@import, @font-face, @keyframes, @property, @charset) are kept at top level.
 */
export function scopeCss(css: string, root: string): string {
  const hoisted: string[] = [];
  let scoped = '';
  let i = 0;

  while (i < css.length) {
    const at = css.slice(i).match(/^\s*@(import|charset|font-face|keyframes|-webkit-keyframes|property)\b/i);
    if (at) {
      // Statement at-rule (@import ...;) or block at-rule (@font-face {...})
      const semi = css.indexOf(';', i);
      const brace = css.indexOf('{', i);
      if (brace === -1 || (semi !== -1 && semi < brace)) {
        const end = semi === -1 ? css.length : semi + 1;
        hoisted.push(css.slice(i, end).trim());
        i = end;
        continue;
      }
      let depth = 0;
      let j = brace;
      for (; j < css.length; j++) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}' && --depth === 0) break;
      }
      hoisted.push(css.slice(i, j + 1).trim());
      i = j + 1;
      continue;
    }

    // Copy everything up to the next hoistable at-rule
    const next = css.slice(i + 1).search(/@(import|charset|font-face|keyframes|-webkit-keyframes|property)\b/i);
    const end = next === -1 ? css.length : i + 1 + next;
    scoped += css.slice(i, end);
    i = end;
  }

  // Document-level selectors become the scope root. Classes on html/body (body.home,
  // body.site-body) are dropped: the container stands in for <body> whatever its classes.
  scoped = scoped.replace(/(^|[\s,{}>+~(])(html|body|:root)(?:\.[\w-]+)*(?=[\s,{:#[>+~)]|$)/gim, '$1:scope');

  return `${hoisted.join('\n')}\n@scope (${root}) {\n${scoped}\n}`;
}
