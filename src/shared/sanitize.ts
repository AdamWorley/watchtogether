// Normalises untrusted user text before it is validated, stored or displayed.
// Rendering is always done as text (never HTML), so this is about removing
// invisible / layout-breaking characters, not about escaping markup.

// C0/C1 controls, zero-width & formatting chars (ZWJ U+200D is kept for emoji sequences), bidi embeddings/overrides/isolates,
// line/paragraph separators, BOM, interlinear annotations and Unicode "tag" characters.
/* eslint-disable no-control-regex -- matching control characters is the point */
const STRIP =
  /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u115F\u1160\u180E\u200B\u200C\u200E\u200F\u2028-\u202F\u205F-\u206F\u3164\uFEFF\uFFA0\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu;
/* eslint-enable no-control-regex */

// More than two stacked combining marks ("Zalgo text") is trimmed to two.
const COMBINING_RUN = /(\p{M}{2})\p{M}+/gu;

const WHITESPACE_RUN = /\s+/gu;

/** Normalise a single line of user text. Never throws. */
export function cleanText(input: string): string {
  return input
    .replace(/[\t\n\r\v\f]/g, ' ')
    .replace(STRIP, '')
    .replace(COMBINING_RUN, '$1')
    .replace(WHITESPACE_RUN, ' ')
    .normalize('NFC')
    .trim();
}

/** Length in user-perceived characters (code points), not UTF-16 units. */
export function textLength(input: string): number {
  return [...input].length;
}
