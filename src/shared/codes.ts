// Room access codes: 10 Crockford base32 characters (50 bits), displayed as XXXXX-XXXXX.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 10;
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{10}$/;

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so `& 31` is unbiased.
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

/** Canonicalise user input (case, separators, confusable letters). Returns null if invalid. */
export function normaliseCode(input: string): string | null {
  if (input.length > 32) return null;
  const code = input.toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  return CODE_RE.test(code) ? code : null;
}

export function formatCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** 256-bit random session token, base64url without padding (43 chars). */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
