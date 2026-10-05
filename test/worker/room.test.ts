import { env } from 'cloudflare:workers';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { FREE } from '../../src/shared/bingo';
import { PROTOCOL } from '../../src/shared/protocol';
import { connect, createRoom, joinRoom, post, upgrade } from './helpers';

const XSS = '<img src=x onerror=alert(1)><script>alert(1)</script>';

describe('WebSocket auth', () => {
  it('rejects cross-origin upgrades (CSWSH)', async () => {
    const room = await createRoom();
    expect((await upgrade(room.roomId, `${PROTOCOL}, ${room.token}`, 'https://evil.example')).status).toBe(
      403,
    );
    expect((await upgrade(room.roomId, `${PROTOCOL}, ${room.token}`, null)).status).toBe(403);
  });

  it('rejects missing, malformed and wrong tokens', async () => {
    const room = await createRoom();
    for (const protocols of [
      PROTOCOL,
      `${PROTOCOL}, nope`,
      `other, ${room.token}`,
      `${PROTOCOL}, ${'A'.repeat(43)}`,
    ]) {
      expect((await upgrade(room.roomId, protocols)).status).toBe(401);
    }
  });

  it('404s rooms that do not exist', async () => {
    expect((await upgrade('f'.repeat(64), `${PROTOCOL}, x`)).status).toBe(404);
    expect((await upgrade('not-a-room', `${PROTOCOL}, x`)).status).toBe(404);
  });
});

describe('room session', () => {
  it('welcomes each member with their own unique card', async () => {
    const room = await createRoom();
    const host = await connect(room);
    const guest = await connect(await joinRoom(room.code, 'Guest'));

    const a = await host.next('welcome');
    const b = await guest.next('welcome');
    expect(a.you.host).toBe(true);
    expect(b.you.host).toBe(false);
    expect(a.card[12]).toBe(FREE);
    expect(a.card).not.toEqual(b.card);
    expect(b.room.code).toBe(room.code);
    expect(b.members.map((m) => m.name)).toEqual(['Host', 'Guest']);
  });

  it('keeps display names unique so nobody can impersonate another member', async () => {
    const room = await createRoom('traitors', 'Sam');
    await joinRoom(room.code, 'sam');
    await joinRoom(room.code, 'SAM');
    const long = 'A'.repeat(24);
    await joinRoom(room.code, long);
    const last = await connect(await joinRoom(room.code, long));
    const { members, you } = await last.next('welcome');
    expect(members.map((m) => m.name)).toEqual(['Sam', 'sam (2)', 'SAM (3)', long, `${'A'.repeat(20)} (2)`]);
    expect(you.name).toBe(`${'A'.repeat(20)} (2)`);
  });

  it('broadcasts chat as data, untouched apart from cleaning', async () => {
    const room = await createRoom();
    const host = await connect(room);
    const guest = await connect(await joinRoom(room.code, XSS.slice(0, 24)));
    await guest.next('welcome');

    host.send({ t: 'chat', text: `${XSS}\u202E` });
    const msg = await guest.next('chat');
    expect(msg.entry.text).toBe(XSS);
    expect(msg.entry.name).toBe('Host');
  });

  it('replays recent chat to late joiners', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    host.send({ t: 'chat', text: 'first!' });
    await host.next('chat');
    const late = await connect(await joinRoom(room.code, 'Late'));
    const welcome = await late.next('welcome');
    expect(welcome.chat.map((c) => c.text)).toEqual(['first!']);
  });

  it('answers invalid frames with an error and keeps the socket open', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    for (const bad of ['nope', '{"t":"chat"}', JSON.stringify({ t: 'chat', text: 'x'.repeat(3000) })]) {
      host.send(bad);
      expect((await host.next('error')).code).toBe('invalid');
    }
    host.send({ t: 'ping' });
    await host.next('pong');
  });

  it('rate limits chat floods', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    for (let i = 0; i < 8; i++) host.send({ t: 'chat', text: `spam ${i}` });
    expect((await host.next('error')).code).toBe('rate_limited');
  });
});

describe('bingo', () => {
  it('only accepts claims backed by marks, and announces the first', async () => {
    const room = await createRoom();
    const host = await connect(room);
    const guest = await connect(await joinRoom(room.code, 'Guest'));
    await host.next('welcome');
    await guest.next('welcome');

    host.send({ t: 'claim', kind: 'line' });
    expect((await host.next('error')).code).toBe('bad_claim');

    for (const cell of [0, 1, 2, 3]) host.send({ t: 'mark', cell, marked: true });
    await host.next('marks', (m) => m.marks.length === 4);
    host.send({ t: 'mark', cell: 4, marked: true });
    host.send({ t: 'mark', cell: 4, marked: false });
    await host.next('marks', (m) => m.marks.length === 5);
    await host.next('marks', (m) => m.marks.length === 4);
    host.send({ t: 'claim', kind: 'line' });
    expect((await host.next('error')).code).toBe('bad_claim');

    host.send({ t: 'mark', cell: 4, marked: true });
    host.send({ t: 'claim', kind: 'line' });
    const claim = await guest.next('claim');
    expect(claim.claim).toMatchObject({ name: 'Host', kind: 'line', first: true, marks: [0, 1, 2, 3, 4] });
    expect(guest.messages.some((m) => m.t === 'marks')).toBe(false); // marks are private

    host.send({ t: 'claim', kind: 'line' });
    expect((await host.next('error')).code).toBe('already_claimed');
  });
});

describe('host controls', () => {
  it('are refused for non-hosts', async () => {
    const room = await createRoom();
    const guest = await connect(await joinRoom(room.code, 'Guest'));
    const welcome = await guest.next('welcome');
    for (const msg of [
      { t: 'lock', locked: true },
      { t: 'rotate' },
      { t: 'filter', enabled: false },
      { t: 'kick', memberId: welcome.members[0]!.id },
    ]) {
      guest.send(msg);
      expect((await guest.next('error')).code).toBe('forbidden');
    }
  });

  it('kick closes the socket and bans the token', async () => {
    const room = await createRoom();
    const host = await connect(room);
    const guestSession = await joinRoom(room.code, 'Guest');
    const guest = await connect(guestSession);
    const { you } = await guest.next('welcome');
    await host.next('welcome');

    host.send({ t: 'kick', memberId: you.id });
    expect((await guest.next('closed')).reason).toBe('kicked');
    expect((await guest.closed).code).toBe(4001);
    expect((await host.next('system', (m) => m.kind === 'kick')).name).toBe('Guest');
    expect((await upgrade(room.roomId, `${PROTOCOL}, ${guestSession.token}`)).status).toBe(401);
  });

  it('lock stops new joins', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    host.send({ t: 'lock', locked: true });
    expect((await host.next('room')).room.locked).toBe(true);
    const res = await post('/api/rooms/join', { code: room.code, name: 'Late' });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'locked' });
  });

  it('rotate invalidates the old code and shares the new one', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    host.send({ t: 'rotate' });
    const { room: state } = await host.next('room');
    expect(state.code).not.toBe(room.code);
    expect((await post('/api/rooms/join', { code: room.code, name: 'Old' })).status).toBe(404);
    expect((await joinRoom(state.code, 'New')).roomId).toBe(room.roomId);
  });
});

describe('end of window', () => {
  it('closes every socket and wipes all room data', async () => {
    const room = await createRoom();
    const host = await connect(room);
    await host.next('welcome');
    host.send({ t: 'chat', text: 'remember me?' });
    await host.next('chat');

    const stub = env.ROOM.get(env.ROOM.idFromString(room.roomId));
    expect(await runDurableObjectAlarm(stub)).toBe(true);

    expect((await host.next('closed')).reason).toBe('ended');
    expect((await host.closed).code).toBe(4000);
    expect(await env.KV.get(`code:${room.code}`)).toBeNull();
    await runInDurableObject(stub, (_instance, state) => {
      expect(state.storage.kv.get('meta')).toBeUndefined();
      const tables = state.storage.sql
        .exec<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('members','chat','claims')",
        )
        .toArray();
      expect(tables).toEqual([]);
    });
    expect((await upgrade(room.roomId, `${PROTOCOL}, ${room.token}`)).status).toBe(410);
  });
});
