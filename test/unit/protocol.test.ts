import { describe, expect, it } from 'vitest';
import {
  ClientMessage,
  CreateRoomRequest,
  MAX_FRAME_BYTES,
  parseFrame,
  ServerMessage,
} from '../../src/shared/protocol';

const frame = (v: unknown) => JSON.stringify(v);

describe('ClientMessage', () => {
  it('accepts valid messages', () => {
    expect(parseFrame(ClientMessage, frame({ t: 'chat', text: 'hi' }))).toEqual({ t: 'chat', text: 'hi' });
    expect(parseFrame(ClientMessage, frame({ t: 'mark', cell: 24, marked: true }))).not.toBeNull();
    expect(parseFrame(ClientMessage, frame({ t: 'claim', kind: 'house' }))).not.toBeNull();
    expect(parseFrame(ClientMessage, frame({ t: 'kick', memberId: 'abcdefghijklmn_-' }))).not.toBeNull();
    expect(parseFrame(ClientMessage, frame({ t: 'rotate' }))).not.toBeNull();
  });

  it('cleans chat text and enforces its length after cleaning', () => {
    expect(parseFrame(ClientMessage, frame({ t: 'chat', text: '  a\u202Eb  ' }))).toEqual({
      t: 'chat',
      text: 'ab',
    });
    expect(parseFrame(ClientMessage, frame({ t: 'chat', text: ' \u200B ' }))).toBeNull();
    expect(parseFrame(ClientMessage, frame({ t: 'chat', text: 'x'.repeat(280) }))).not.toBeNull();
    expect(parseFrame(ClientMessage, frame({ t: 'chat', text: 'x'.repeat(281) }))).toBeNull();
  });

  it('rejects unknown types, extra keys and wrong types', () => {
    for (const bad of [
      { t: 'nope' },
      { t: 'chat', text: 'hi', extra: 1 },
      { t: 'chat', text: 5 },
      { t: 'mark', cell: 25, marked: true },
      { t: 'mark', cell: -1, marked: true },
      { t: 'mark', cell: 1.5, marked: true },
      { t: 'claim', kind: 'everything' },
      { t: 'kick', memberId: '../../etc' },
      { t: 'lock', locked: 'yes' },
      [],
      null,
    ]) {
      expect(parseFrame(ClientMessage, frame(bad))).toBeNull();
    }
  });

  it('rejects prototype-pollution keys', () => {
    expect(parseFrame(ClientMessage, '{"t":"chat","text":"hi","__proto__":{"admin":true}}')).toBeNull();
    expect(parseFrame(ClientMessage, '{"t":"rotate","constructor":{"prototype":{}}}')).toBeNull();
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });

  it('rejects non-JSON, binary and oversized frames', () => {
    expect(parseFrame(ClientMessage, '{not json')).toBeNull();
    expect(parseFrame(ClientMessage, new ArrayBuffer(8))).toBeNull();
    const big = frame({ t: 'chat', text: 'x'.repeat(MAX_FRAME_BYTES) });
    expect(parseFrame(ClientMessage, big)).toBeNull();
    // multi-byte characters count as bytes, not string length
    const wide = frame({ t: 'chat', text: '€'.repeat(700) });
    expect(wide.length).toBeLessThan(MAX_FRAME_BYTES);
    expect(parseFrame(ClientMessage, wide)).toBeNull();
  });
});

describe('CreateRoomRequest', () => {
  it('validates the show and name', () => {
    expect(CreateRoomRequest.safeParse({ show: 'traitors', name: ' Sam ' }).data).toEqual({
      show: 'traitors',
      name: 'Sam',
    });
    expect(CreateRoomRequest.safeParse({ show: 'love-island', name: 'Sam' }).success).toBe(false);
    expect(CreateRoomRequest.safeParse({ show: 'traitors', name: 'x'.repeat(25) }).success).toBe(false);
    expect(CreateRoomRequest.safeParse({ show: 'traitors', name: '' }).success).toBe(false);
  });
});

describe('ServerMessage', () => {
  it('round-trips a pong and rejects unknown fields', () => {
    expect(ServerMessage.safeParse({ t: 'pong' }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'pong', html: '<b>' }).success).toBe(false);
  });
});
