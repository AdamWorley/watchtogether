import type { z } from '../shared/zod';

// API responses are JSON only; this CSP forbids everything should one ever be rendered as a document.
const API_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

export function json(body: unknown, status = 200, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...API_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}

export function error(code: string, status: number): Response {
  return json({ error: code }, status);
}

/**
 * Browsers always send Origin on cross-origin requests, POSTs and WebSocket upgrades.
 * Requiring it to equal our own origin blocks CSRF and cross-site WebSocket hijacking
 * without maintaining a per-environment allowlist.
 */
export function isSameOrigin(request: Request, url: URL): boolean {
  return request.headers.get('Origin') === url.origin;
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

const MAX_BODY_BYTES = 1024;

/** Read and validate a small JSON request body. Returns null on any problem. */
export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | null> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > MAX_BODY_BYTES) return null;
  const text = await readCapped(request.body, MAX_BODY_BYTES);
  if (text === null) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Read a stream as UTF-8 text, giving up (null) once it exceeds maxBytes. */
export async function readCapped(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<string | null> {
  if (!body) return '';
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buf);
}

/** Structured log line. Never pass user content (names, chat, codes, tokens) here. */
export function log(event: string, fields: Record<string, string | number | boolean> = {}): void {
  console.log(JSON.stringify({ event, ...fields }));
}
