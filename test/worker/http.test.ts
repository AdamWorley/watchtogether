import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { MAX_MEMBERS } from '../../src/shared/protocol';
import { createRoom, episodeAiring, freshIp, joinRoom, ORIGIN, post, seedSchedule } from './helpers';

describe('GET /api/schedule/:show', () => {
  it('returns the stored schedule with CDN cache headers', async () => {
    await seedSchedule('strictly', [episodeAiring(120, 7)]);
    const res = await exports.default.fetch(`${ORIGIN}/api/schedule/strictly`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    const body = await res.json<{ show: string; episodes: { id: number }[] }>();
    expect(body.show).toBe('strictly');
    expect(body.episodes.map((e) => e.id)).toEqual([7]);
  });

  it('404s unknown shows', async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/schedule/bakeoff`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/rooms', () => {
  it('requires a same-origin request (CSRF)', async () => {
    await seedSchedule('traitors', [episodeAiring()]);
    expect((await post('/api/rooms', { show: 'traitors', name: 'A' }, { origin: null })).status).toBe(403);
    expect(
      (await post('/api/rooms', { show: 'traitors', name: 'A' }, { origin: 'https://evil.example' })).status,
    ).toBe(403);
  });

  it('rejects invalid bodies', async () => {
    for (const body of [
      {},
      { show: 'traitors' },
      { show: 'nope', name: 'A' },
      { show: 'traitors', name: 'A', admin: true },
    ]) {
      expect((await post('/api/rooms', body)).status).toBe(400);
    }
    const res = await exports.default.fetch(`${ORIGIN}/api/rooms`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'text/plain', 'CF-Connecting-IP': freshIp() },
      body: JSON.stringify({ show: 'traitors', name: 'A' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    expect((await post('/api/rooms', { show: 'traitors', name: 'A', pad: 'x'.repeat(5000) })).status).toBe(
      400,
    );
  });

  it('refuses to create a room outside the watch window', async () => {
    await seedSchedule('traitors', [episodeAiring(31), episodeAiring(-200, 2)]);
    const res = await post('/api/rooms', { show: 'traitors', name: 'A' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'not_live' });
  });

  it('creates a room, registers its code and never caches the response', async () => {
    const res = await (async () => {
      await seedSchedule('traitors', [episodeAiring()]);
      return post('/api/rooms', { show: 'traitors', name: 'Host' });
    })();
    expect(res.status).toBe(201);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const session = await res.json<{ roomId: string; token: string; code: string }>();
    expect(session.roomId).toMatch(/^[0-9a-f]{64}$/);
    expect(session.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/);
    expect(await env.KV.get(`code:${session.code}`, 'json')).toEqual({ roomId: session.roomId });
  });

  it('rate limits room creation per IP', async () => {
    await seedSchedule('traitors', [episodeAiring()]);
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++)
      statuses.push((await post('/api/rooms', { show: 'traitors', name: 'A' }, { ip })).status);
    expect(statuses).toContain(429);
  });
});

describe('POST /api/rooms/join', () => {
  it('joins with a code in any reasonable format', async () => {
    const room = await createRoom();
    const formatted = `${room.code.slice(0, 5)}-${room.code.slice(5)}`.toLowerCase();
    const joined = await joinRoom(formatted, 'Guest');
    expect(joined.roomId).toBe(room.roomId);
    expect(joined.token).not.toBe(room.token);
    expect(joined.show).toBe('traitors');
  });

  it('gives the same answer for malformed and unknown codes', async () => {
    for (const code of ['nope', 'ZZZZZZZZZZ', '<script>']) {
      const res = await post('/api/rooms/join', { code, name: 'A' });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'not_found' });
    }
  });

  it(`caps rooms at ${MAX_MEMBERS} members`, async () => {
    const room = await createRoom();
    for (let i = 1; i < MAX_MEMBERS; i++) await joinRoom(room.code, `P${i}`);
    const res = await post('/api/rooms/join', { code: room.code, name: 'One too many' });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'full' });
  });

  it('rate limits join attempts per IP (code brute force)', async () => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++)
      statuses.push((await post('/api/rooms/join', { code: 'ZZZZZZZZZZ', name: 'A' }, { ip })).status);
    expect(statuses).toContain(429);
  });
});

describe('routing', () => {
  it('404s unknown API routes as JSON', async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/whatever`);
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  });
});
