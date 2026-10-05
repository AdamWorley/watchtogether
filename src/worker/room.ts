import { DurableObject } from 'cloudflare:workers';
import { cardKey, generateCard, isValidClaim, type ClaimKind } from '../shared/bingo';
import { generateCode, generateToken, TOKEN_RE } from '../shared/codes';
import { SQUARES } from '../shared/content';
import {
  CHAT_HISTORY,
  ClientMessage,
  MAX_MEMBERS,
  NAME_MAX,
  parseFrame,
  PROTOCOL,
  type ChatEntry,
  type Claim,
  type Member,
  type RoomState,
  type ServerMessage,
} from '../shared/protocol';
import type { ShowSlug } from '../shared/shows';
import type { Episode } from '../shared/window';
import { log } from './http';

interface Meta {
  show: ShowSlug;
  episode: Episode;
  closesAt: number;
  code: string;
  locked: boolean;
  filter: boolean;
}

/** Per-socket state; survives hibernation via serializeAttachment. */
interface Attachment {
  memberId: string;
  /** General message bucket. */
  msgTokens: number;
  /** Chat-only bucket. */
  chatTokens: number;
  ts: number;
}

interface MemberRow extends Record<string, SqlStorageValue> {
  id: string;
  name: string;
  host: number;
  card: string;
  marks: string;
  banned: number;
}

export type JoinResult =
  | { ok: true; token: string; memberId: string; show: ShowSlug }
  | { ok: false; error: 'closed' | 'locked' | 'full' };

export interface CreateResult {
  token: string;
  memberId: string;
  code: string;
}

export interface CreateInput {
  show: ShowSlug;
  episode: Episode;
  closesAt: number;
  hostName: string;
}

const MSG_BUCKET = { capacity: 20, perSecond: 5 };
const CHAT_BUCKET = { capacity: 5, perSecond: 1 };
const CLOSE_KICKED = 4001;
const CLOSE_ENDED = 4000;
const CLOSE_POLICY = 1008;

export const codeKey = (code: string) => `code:${code}`;

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** 96-bit random member id (16 base64url chars). Public within a room; not a credential. */
function memberId(): string {
  return generateToken().slice(0, 16);
}

function refill(
  tokens: number,
  ts: number,
  now: number,
  bucket: { capacity: number; perSecond: number },
): number {
  return Math.min(bucket.capacity, tokens + ((now - ts) / 1000) * bucket.perSecond);
}

export class Room extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.migrate();
  }

  private migrate(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        host INTEGER NOT NULL,
        card TEXT NOT NULL,
        card_key TEXT NOT NULL UNIQUE,
        marks TEXT NOT NULL DEFAULT '[]',
        banned INTEGER NOT NULL DEFAULT 0,
        joined_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS claims (
        member_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        card TEXT NOT NULL,
        marks TEXT NOT NULL,
        first INTEGER NOT NULL,
        at INTEGER NOT NULL,
        PRIMARY KEY (member_id, kind)
      );
    `);
  }

  // ---------------------------------------------------------------- meta

  private meta(): Meta | undefined {
    return this.ctx.storage.kv.get<Meta>('meta');
  }

  private setMeta(meta: Meta): void {
    this.ctx.storage.kv.put('meta', meta);
  }

  private isOpen(meta: Meta | undefined): meta is Meta {
    return meta !== undefined && Date.now() < meta.closesAt;
  }

  private roomState(meta: Meta): RoomState {
    return {
      show: meta.show,
      episode: meta.episode,
      closesAt: meta.closesAt,
      code: meta.code,
      locked: meta.locked,
      filter: meta.filter,
    };
  }

  // ---------------------------------------------------------------- RPC (called by the Worker)

  /** Initialise a brand-new room and add the host. Returns the access code alongside the session. */
  async create(input: CreateInput): Promise<CreateResult> {
    if (this.meta()) throw new Error('room already initialised');
    try {
      const code = await this.claimFreshCode(input.closesAt);
      this.setMeta({
        show: input.show,
        episode: input.episode,
        closesAt: input.closesAt,
        code,
        locked: false,
        filter: true,
      });
      await this.ctx.storage.setAlarm(input.closesAt);
      const result = await this.addMember(input.hostName, true);
      if (!result.ok) throw new Error('could not add host');
      return { token: result.token, memberId: result.memberId, code };
    } catch (err) {
      // Never leave a half-built room (or its code) behind.
      const meta = this.meta();
      if (meta) await this.env.KV.delete(codeKey(meta.code));
      await this.ctx.storage.deleteAll();
      throw err;
    }
  }

  async join(name: string): Promise<JoinResult> {
    const meta = this.meta();
    if (!this.isOpen(meta)) return { ok: false, error: 'closed' };
    if (meta.locked) return { ok: false, error: 'locked' };
    const count = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM members WHERE banned = 0').one().n;
    if (count >= MAX_MEMBERS) return { ok: false, error: 'full' };
    const unique = this.uniqueName(name);
    const result = await this.addMember(unique, false);
    this.broadcast({ t: 'system', kind: 'join', name: unique, at: Date.now() });
    this.broadcastMembers();
    return result;
  }

  /** Names are unique (case-insensitively) within a room so nobody can pose as someone else. */
  private uniqueName(name: string): string {
    const taken = new Set(
      this.sql
        .exec<{ name: string }>('SELECT name FROM members WHERE banned = 0')
        .toArray()
        .map((r) => r.name.toLocaleLowerCase()),
    );
    if (!taken.has(name.toLocaleLowerCase())) return name;
    for (let n = 2; ; n++) {
      const suffix = ` (${n})`;
      const base = [...name]
        .slice(0, NAME_MAX - suffix.length)
        .join('')
        .trimEnd();
      const candidate = `${base}${suffix}`;
      if (!taken.has(candidate.toLocaleLowerCase())) return candidate;
    }
  }

  private async addMember(name: string, host: boolean): Promise<JoinResult> {
    const meta = this.meta();
    if (!meta) return { ok: false, error: 'closed' };
    const pool = SQUARES[meta.show].length;
    const token = generateToken();
    const tokenHash = await sha256(token);
    const id = memberId();
    for (let attempt = 0; attempt < 20; attempt++) {
      const card = generateCard(pool);
      const key = cardKey(card);
      const clash = this.sql.exec('SELECT 1 FROM members WHERE card_key = ?', key).toArray().length > 0;
      if (clash) continue;
      this.sql.exec(
        'INSERT INTO members (id, token_hash, name, host, card, card_key, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id,
        tokenHash,
        name,
        host ? 1 : 0,
        JSON.stringify(card),
        key,
        Date.now(),
      );
      return { ok: true, token, memberId: id, show: meta.show };
    }
    throw new Error('could not generate a unique card');
  }

  /** Pick an unused access code and register it in KV until the room closes. */
  private async claimFreshCode(closesAt: number): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      if ((await this.env.KV.get(codeKey(code))) !== null) continue;
      await this.env.KV.put(codeKey(code), JSON.stringify({ roomId: this.ctx.id.toString() }), {
        // KV requires expiry >= 60s ahead; rooms always close well after creation.
        expiration: Math.max(Math.ceil(closesAt / 1000) + 60, Math.ceil(Date.now() / 1000) + 120),
      });
      return code;
    }
    throw new Error('could not allocate access code');
  }

  // ---------------------------------------------------------------- WebSocket

  override async fetch(request: Request): Promise<Response> {
    const meta = this.meta();
    if (!this.isOpen(meta)) return new Response('room closed', { status: 410 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }
    // Browsers can't set headers on WebSockets, so the token travels as a subprotocol:
    // new WebSocket(url, ['watchtogether.v1', token]). It never appears in a URL or log line.
    const protocols = (request.headers.get('Sec-WebSocket-Protocol') ?? '').split(',').map((p) => p.trim());
    const [proto, token] = protocols;
    if (protocols.length !== 2 || proto !== PROTOCOL || !token || !TOKEN_RE.test(token)) {
      return new Response('unauthorised', { status: 401 });
    }
    const member = this.sql
      .exec<MemberRow>(
        'SELECT id, name, host, card, marks, banned FROM members WHERE token_hash = ?',
        await sha256(token),
      )
      .toArray()[0];
    if (!member || member.banned) return new Response('unauthorised', { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server, [member.id]);
    const now = Date.now();
    const attachment: Attachment = {
      memberId: member.id,
      msgTokens: MSG_BUCKET.capacity,
      chatTokens: CHAT_BUCKET.capacity,
      ts: now,
    };
    server.serializeAttachment(attachment);

    this.send(server, {
      t: 'welcome',
      you: { id: member.id, name: member.name, host: member.host === 1 },
      room: this.roomState(meta),
      card: JSON.parse(member.card) as number[],
      marks: JSON.parse(member.marks) as number[],
      members: this.members(),
      chat: this.chatHistory(),
      claims: this.claims(),
    });
    this.broadcastMembers();
    log('room.connect', { members: this.ctx.getWebSockets().length });

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': PROTOCOL },
    });
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const meta = this.meta();
    const att = ws.deserializeAttachment() as Attachment | null;
    if (!att || !this.isOpen(meta)) {
      this.safeClose(ws, CLOSE_ENDED, 'closed');
      return;
    }
    const member = this.member(att.memberId);
    if (!member || member.banned) {
      this.safeClose(ws, CLOSE_POLICY, 'unauthorised');
      return;
    }

    const now = Date.now();
    att.msgTokens = refill(att.msgTokens, att.ts, now, MSG_BUCKET);
    att.chatTokens = refill(att.chatTokens, att.ts, now, CHAT_BUCKET);
    att.ts = now;
    if (att.msgTokens < 1) {
      ws.serializeAttachment(att);
      this.send(ws, { t: 'error', code: 'rate_limited' });
      return;
    }
    att.msgTokens -= 1;

    const msg = parseFrame(ClientMessage, raw);
    if (!msg) {
      ws.serializeAttachment(att);
      this.send(ws, { t: 'error', code: 'invalid' });
      return;
    }
    if (msg.t === 'chat') {
      if (att.chatTokens < 1) {
        ws.serializeAttachment(att);
        this.send(ws, { t: 'error', code: 'rate_limited' });
        return;
      }
      att.chatTokens -= 1;
    }
    ws.serializeAttachment(att);

    const isHost = member.host === 1;
    switch (msg.t) {
      case 'ping':
        this.send(ws, { t: 'pong' });
        return;
      case 'chat':
        return this.onChat(member, msg.text);
      case 'mark':
        return this.onMark(member, msg.cell, msg.marked);
      case 'claim':
        return this.onClaim(ws, member, msg.kind);
      case 'kick':
      case 'lock':
      case 'filter':
      case 'rotate':
        if (!isHost) {
          this.send(ws, { t: 'error', code: 'forbidden' });
          return;
        }
        if (msg.t === 'kick') return this.onKick(member, msg.memberId);
        if (msg.t === 'lock') return this.onLock(meta, msg.locked);
        if (msg.t === 'filter') return this.onFilter(meta, msg.enabled);
        return this.onRotate(meta);
    }
  }

  override webSocketClose(ws: WebSocket, code: number): void {
    this.safeClose(ws, code === 1005 || code === 1006 ? 1000 : code, 'bye');
    // After the end-of-window wipe the tables are gone; there is nobody left to tell.
    if (this.meta()) this.broadcastMembers(ws);
  }

  override webSocketError(ws: WebSocket): void {
    this.safeClose(ws, 1011, 'error');
    if (this.meta()) this.broadcastMembers(ws);
  }

  // ---------------------------------------------------------------- handlers

  private onChat(member: MemberRow, text: string): void {
    const at = Date.now();
    const row = this.sql
      .exec<{ id: number }>(
        'INSERT INTO chat (member_id, name, text, at) VALUES (?, ?, ?, ?) RETURNING id',
        member.id,
        member.name,
        text,
        at,
      )
      .one();
    this.sql.exec('DELETE FROM chat WHERE id <= ?', row.id - CHAT_HISTORY);
    this.broadcast({ t: 'chat', entry: { id: row.id, memberId: member.id, name: member.name, text, at } });
  }

  private onMark(member: MemberRow, cell: number, marked: boolean): void {
    const marks = new Set(JSON.parse(member.marks) as number[]);
    if (marked) marks.add(cell);
    else marks.delete(cell);
    const list = [...marks].sort((a, b) => a - b);
    this.sql.exec('UPDATE members SET marks = ? WHERE id = ?', JSON.stringify(list), member.id);
    // Echo to every tab this member has open.
    for (const sock of this.ctx.getWebSockets(member.id)) this.send(sock, { t: 'marks', marks: list });
  }

  private onClaim(ws: WebSocket, member: MemberRow, kind: ClaimKind): void {
    const existing = this.sql
      .exec('SELECT 1 FROM claims WHERE member_id = ? AND kind = ?', member.id, kind)
      .toArray();
    if (existing.length > 0) {
      this.send(ws, { t: 'error', code: 'already_claimed' });
      return;
    }
    const marks = JSON.parse(member.marks) as number[];
    if (!isValidClaim(kind, marks)) {
      this.send(ws, { t: 'error', code: 'bad_claim' });
      return;
    }
    const first = this.sql.exec('SELECT 1 FROM claims WHERE kind = ?', kind).toArray().length === 0;
    const at = Date.now();
    this.sql.exec(
      'INSERT INTO claims (member_id, kind, name, card, marks, first, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      member.id,
      kind,
      member.name,
      member.card,
      member.marks,
      first ? 1 : 0,
      at,
    );
    const claim: Claim = {
      memberId: member.id,
      name: member.name,
      kind,
      card: JSON.parse(member.card) as number[],
      marks,
      first,
      at,
    };
    this.broadcast({ t: 'claim', claim });
  }

  private onKick(host: MemberRow, targetId: string): void {
    if (targetId === host.id) return;
    const target = this.member(targetId);
    if (!target || target.banned) return;
    this.sql.exec('UPDATE members SET banned = 1 WHERE id = ?', targetId);
    for (const sock of this.ctx.getWebSockets(targetId)) {
      this.send(sock, { t: 'closed', reason: 'kicked' });
      this.safeClose(sock, CLOSE_KICKED, 'kicked');
    }
    this.broadcast({ t: 'system', kind: 'kick', name: target.name, at: Date.now() });
    this.broadcastMembers();
  }

  private onLock(meta: Meta, locked: boolean): void {
    if (meta.locked === locked) return;
    const next = { ...meta, locked };
    this.setMeta(next);
    this.broadcast({ t: 'room', room: this.roomState(next) });
    this.broadcast({ t: 'system', kind: locked ? 'lock' : 'unlock', at: Date.now() });
  }

  private onFilter(meta: Meta, filter: boolean): void {
    if (meta.filter === filter) return;
    const next = { ...meta, filter };
    this.setMeta(next);
    this.broadcast({ t: 'room', room: this.roomState(next) });
    this.broadcast({ t: 'system', kind: 'filter', at: Date.now() });
  }

  private async onRotate(meta: Meta): Promise<void> {
    const code = await this.claimFreshCode(meta.closesAt);
    await this.env.KV.delete(codeKey(meta.code));
    // Re-read: other messages may have changed meta while we awaited KV.
    const current = this.meta();
    if (!current) return;
    const next = { ...current, code };
    this.setMeta(next);
    this.broadcast({ t: 'room', room: this.roomState(next) });
    this.broadcast({ t: 'system', kind: 'rotate', at: Date.now() });
  }

  // ---------------------------------------------------------------- end of room

  override async alarm(): Promise<void> {
    const meta = this.meta();
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { t: 'closed', reason: 'ended' });
      this.safeClose(ws, CLOSE_ENDED, 'ended');
    }
    if (meta) await this.env.KV.delete(codeKey(meta.code));
    // Wipes every table, the meta key and the alarm itself: nothing about the room remains.
    await this.ctx.storage.deleteAll();
    log('room.wiped');
  }

  // ---------------------------------------------------------------- helpers

  private member(id: string): MemberRow | undefined {
    return this.sql
      .exec<MemberRow>('SELECT id, name, host, card, marks, banned FROM members WHERE id = ?', id)
      .toArray()[0];
  }

  private members(exclude?: WebSocket): Member[] {
    return this.sql
      .exec<{ id: string; name: string; host: number }>(
        'SELECT id, name, host FROM members WHERE banned = 0 ORDER BY joined_at',
      )
      .toArray()
      .map((m) => ({
        id: m.id,
        name: m.name,
        host: m.host === 1,
        online: this.ctx.getWebSockets(m.id).some((ws) => ws !== exclude && ws.readyState === WebSocket.OPEN),
      }));
  }

  private chatHistory(): ChatEntry[] {
    return this.sql
      .exec<{ id: number; member_id: string; name: string; text: string; at: number }>(
        'SELECT id, member_id, name, text, at FROM chat ORDER BY id',
      )
      .toArray()
      .map((r) => ({ id: r.id, memberId: r.member_id, name: r.name, text: r.text, at: r.at }));
  }

  private claims(): Claim[] {
    return this.sql
      .exec<{
        member_id: string;
        kind: string;
        name: string;
        card: string;
        marks: string;
        first: number;
        at: number;
      }>('SELECT member_id, kind, name, card, marks, first, at FROM claims ORDER BY at')
      .toArray()
      .map((r) => ({
        memberId: r.member_id,
        kind: r.kind as ClaimKind,
        name: r.name,
        card: JSON.parse(r.card) as number[],
        marks: JSON.parse(r.marks) as number[],
        first: r.first === 1,
        at: r.at,
      }));
  }

  private broadcastMembers(exclude?: WebSocket): void {
    this.broadcast({ t: 'members', members: this.members(exclude) });
  }

  private broadcast(msg: ServerMessage): void {
    const frame = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(frame);
      } catch {
        // socket already gone; webSocketClose will tidy up
      }
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // ignore: socket closed
    }
  }

  private safeClose(ws: WebSocket, code: number, reason: string): void {
    try {
      ws.close(code, reason);
    } catch {
      // already closed
    }
  }
}
