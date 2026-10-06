// Fit a bingo caption inside its tile's frame without ever splitting a word that can't carry a hyphen.
// Each world sets its tile padding to clear its own frame (keyline, piping, rope...). If the caption's
// widest unbreakable word wraps or crosses that padding in the real layout, step the type down (fit-1..3
// classes, styled in app.css) until it doesn't. Classes, not inline styles: our CSP forbids style attributes.

const STEPS = ['fit-1', 'fit-2', 'fit-3'] as const;

/**
 * Words the browser may legitimately break: real hyphen, a long lowercase word, or (unless `strict`) a soft
 * hyphen. Strict mode prefers shrinking the type over breaking at a soft hyphen.
 */
function breakable(word: string, strict = false): boolean {
  if (word.includes('-') || (!strict && word.includes('\u00AD'))) return true;
  const core = word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
  return /^[a-z]/.test(core) && core.replace(/[^a-z]/gi, '').length >= 9;
}

/** The tile's content box: inside its padding, which each world sets to clear its frame. */
function frame(cell: HTMLElement): { left: number; right: number } {
  const c = getComputedStyle(cell);
  const box = cell.getBoundingClientRect();
  const left = box.left + cell.clientLeft + parseFloat(c.paddingLeft);
  return { left, right: left + cell.clientWidth - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight) };
}

/**
 * Measure the real layout (not a canvas estimate, which can resolve fonts like system-ui differently):
 * true if any unbreakable word wraps across lines or pokes outside the frame.
 */
function misfits(node: HTMLElement, cell: HTMLElement, strict: boolean): boolean {
  const { left, right } = frame(cell);
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    for (const m of (text.textContent ?? '').matchAll(/\S+/g)) {
      if (breakable(m[0], strict)) continue;
      range.setStart(text, m.index);
      range.setEnd(text, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (new Set(rects.map((r) => Math.round(r.top))).size > 1) return true;
      if (rects.some((r) => r.left < left - 0.5 || r.right > right + 0.5)) return true;
    }
  }
  return false;
}

function fit(node: HTMLElement): void {
  const cell = node.closest<HTMLElement>('.cell');
  if (!cell || cell.clientWidth === 0) return;
  // First try to keep soft-hyphenated words whole by shrinking; on very wide fonts, fall back to letting
  // them break at their soft hyphen.
  for (const strict of [true, false]) {
    node.classList.remove(...STEPS);
    if (!misfits(node, cell, strict)) return;
    for (const step of STEPS) {
      node.classList.remove(...STEPS);
      node.classList.add(step);
      if (!misfits(node, cell, strict)) return;
    }
  }
}

/** Svelte action: refits on mount, on text changes, on resize, and once web fonts have loaded. */
export function fitCaption(node: HTMLElement): { destroy(): void } {
  const refit = () => fit(node);
  refit();
  const cell = node.closest('.cell');
  let lastWidth = -1;
  // Only a width change can change the fit; ignoring height avoids refit loops as the type steps down.
  const resize = new ResizeObserver(([entry]) => {
    const width = Math.round(entry?.contentRect.width ?? 0);
    if (width === lastWidth) return;
    lastWidth = width;
    refit();
  });
  if (cell) resize.observe(cell);
  const mutations = new MutationObserver(refit);
  mutations.observe(node, { childList: true, characterData: true, subtree: true });
  void document.fonts.ready.then(refit);
  return {
    destroy() {
      resize.disconnect();
      mutations.disconnect();
    },
  };
}
