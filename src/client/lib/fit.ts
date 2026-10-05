// Fit a bingo caption inside its tile's frame without ever splitting a word that can't carry a hyphen.
// Each world sets its tile padding to clear its own frame (keyline, piping, rope...). If the caption's
// widest unbreakable word doesn't fit inside that padding, step the type down (fit-1..3 classes, styled in
// app.css) until it does. Classes, not inline styles: our CSP forbids style attributes.

const STEPS = ['fit-1', 'fit-2', 'fit-3'] as const;

/** Words the browser may legitimately break: soft hyphen, real hyphen, or a long lowercase word. */
function breakable(word: string): boolean {
  if (word.includes('\u00AD') || word.includes('-')) return true;
  const core = word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
  return /^[a-z]/.test(core) && core.replace(/[^a-z]/gi, '').length >= 9;
}

let canvas: CanvasRenderingContext2D | null = null;

function widestUnbreakable(node: HTMLElement): number {
  canvas ??= document.createElement('canvas').getContext('2d');
  if (!canvas) return 0;
  const style = getComputedStyle(node);
  canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const tracking = parseFloat(style.letterSpacing) || 0;
  let widest = 0;
  for (const word of (node.textContent ?? '').split(/\s+/)) {
    if (!word || breakable(word)) continue;
    widest = Math.max(widest, canvas.measureText(word).width + tracking * word.length);
  }
  return widest;
}

function available(node: HTMLElement, cell: HTMLElement): number {
  const c = getComputedStyle(cell);
  const t = getComputedStyle(node);
  return (
    cell.clientWidth -
    parseFloat(c.paddingLeft) -
    parseFloat(c.paddingRight) -
    parseFloat(t.paddingLeft) -
    parseFloat(t.paddingRight)
  );
}

function fit(node: HTMLElement): void {
  const cell = node.closest<HTMLElement>('.cell');
  if (!cell || cell.clientWidth === 0) return;
  node.classList.remove(...STEPS);
  for (const step of [null, ...STEPS]) {
    if (step) {
      node.classList.remove(...STEPS);
      node.classList.add(step);
    }
    // 2px of slack: canvas measurement and layout round sub-pixels differently.
    if (widestUnbreakable(node) <= available(node, cell) - 2) return;
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
