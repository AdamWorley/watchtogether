// Fails if any tracked source file contains invisible or bidirectional control characters
// (Trojan Source, CVE-2021-42574). Use \u escapes in string literals instead.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Code point ranges: C1 controls, soft hyphen, Arabic letter mark, zero-width space/non-joiner,
// LRM/RLM, line/paragraph separators, bidi embeddings/overrides, word joiner..bidi isolates, BOM.
// (ZWJ U+200D is allowed: emoji sequences need it.) Written numerically so the file itself stays clean.
/** @type {[number, number][]} */
const RANGES = [
  [0x80, 0x9f],
  [0xad, 0xad],
  [0x61c, 0x61c],
  [0x200b, 0x200c],
  [0x200e, 0x200f],
  [0x2028, 0x202f],
  [0x2060, 0x206f],
  [0xfeff, 0xfeff],
];
/** @param {number} n */
const hex = (n) => `\\u{${n.toString(16)}}`;
const BAD = new RegExp(`[${RANGES.map(([a, b]) => `${hex(a)}-${hex(b)}`).join('')}]`, 'u');
const EXT = /\.(ts|js|mjs|cjs|svelte|json|jsonc|html|css|yml|yaml|md)$/;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => EXT.test(f) && f !== 'package-lock.json' && !f.endsWith('worker-configuration.d.ts'));

let failed = false;
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const m = BAD.exec(line);
      if (m) {
        failed = true;
        const cp = m[0].codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0');
        console.error(`${file}:${i + 1}: invisible character U+${cp}`);
      }
    });
}
if (failed) process.exit(1);
console.log(`check-unicode: ${files.length} files clean`);
