import {
  MAX_SERVER_FRAME_BYTES,
  parseFrame,
  PROTOCOL,
  ServerMessage,
  type ChatEntry,
  type Claim,
  type ClientMessage,
  type Member,
  type RoomState,
} from '../../shared/protocol';
import { personSlot } from './person';
import type { Session } from './session';

export type SystemEvent = 'join' | 'kick' | 'lock' | 'unlock' | 'rotate' | 'filter';

/** Server feedback the UI turns into a short-lived toast. */
export type Notice = 'rate_limited' | 'bad_claim' | 'already_claimed';

export type FeedItem =
  | { kind: 'chat'; key: string; entry: ChatEntry }
  /** Rendered in the show's voice by the UI (lib/voice.ts). `filterOn` is the state after a filter change. */
  | { kind: 'system'; key: string; event: SystemEvent; name?: string; filterOn?: boolean; at: number }
  | { kind: 'claim'; key: string; claim: Claim };

export type Status = 'connecting' | 'open' | 'reconnecting' | 'ended' | 'kicked' | 'unauthorised';

const MAX_FEED = 200;
const PING_MS = 25_000;

/** Live connection to a room. All fields are reactive. */
export class RoomConnection {
  status = $state<Status>('connecting');
  you = $state<{ id: string; name: string; host: boolean } | null>(null);
  room = $state<RoomState | null>(null);
  card = $state<number[]>([]);
  marks = $state<number[]>([]);
  members = $state<Member[]>([]);
  claims = $state<Claim[]>([]);
  feed = $state<FeedItem[]>([]);
  notice = $state<Notice | null>(null);
  latestClaim = $state<Claim | null>(null);

  #ws: WebSocket | null = null;
  #attempts = 0;
  #opened = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #ping: ReturnType<typeof setInterval> | undefined;
  #disposed = false;
  /** The marks the server last confirmed; the optimistic UI falls back to these if a mark is refused. */
  #confirmedMarks: number[] = [];
  readonly #session: Session;

  constructor(session: Session) {
    this.#session = session;
    this.#connect();
  }

  #connect(): void {
    if (this.#disposed) return;
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${scheme}//${location.host}/api/rooms/${encodeURIComponent(this.#session.roomId)}/ws`;
    this.#opened = false;
    const ws = new WebSocket(url, [PROTOCOL, this.#session.token]);
    this.#ws = ws;

    ws.addEventListener('open', () => {
      this.#opened = true;
      this.#attempts = 0;
      this.status = 'open';
      clearInterval(this.#ping);
      this.#ping = setInterval(() => this.send({ t: 'ping' }), PING_MS);
    });
    ws.addEventListener('message', (event) => {
      const msg = parseFrame(ServerMessage, event.data, MAX_SERVER_FRAME_BYTES);
      if (msg) this.#handle(msg);
    });
    ws.addEventListener('close', () => {
      clearInterval(this.#ping);
      if (this.#disposed || this.status === 'ended' || this.status === 'kicked') return;
      // A socket refused before opening (401/410) can't be told apart from a network blip,
      // so give up after a few consecutive failures without ever opening.
      if (!this.#opened && ++this.#attempts >= 4) {
        this.status = 'unauthorised';
        return;
      }
      this.status = 'reconnecting';
      const delay = Math.min(15_000, 500 * 2 ** this.#attempts) + Math.random() * 500;
      this.#timer = setTimeout(() => this.#connect(), delay);
    });
  }

  #push(item: FeedItem): void {
    this.feed.push(item);
    if (this.feed.length > MAX_FEED) this.feed.splice(0, this.feed.length - MAX_FEED);
  }

  #handle(msg: ServerMessage): void {
    switch (msg.t) {
      case 'welcome':
        this.you = msg.you;
        this.room = msg.room;
        this.card = msg.card;
        this.marks = msg.marks;
        this.#confirmedMarks = msg.marks;
        this.members = msg.members;
        this.claims = msg.claims;
        // Rebuild the feed from the server's view so reconnects don't duplicate.
        this.feed = [
          ...msg.chat.map((entry): FeedItem => ({ kind: 'chat', key: `c${entry.id}`, entry })),
          ...msg.claims.map((claim): FeedItem => ({
            kind: 'claim',
            key: `k${claim.memberId}${claim.kind}`,
            claim,
          })),
        ].sort((a, b) => at(a) - at(b));
        break;
      case 'room':
        this.room = msg.room;
        break;
      case 'members':
        this.members = msg.members;
        break;
      case 'chat':
        this.#push({ kind: 'chat', key: `c${msg.entry.id}`, entry: msg.entry });
        break;
      case 'system': {
        if (msg.kind === 'leave') break; // presence dots already show who's here
        const item: FeedItem = { kind: 'system', key: `s${msg.at}${msg.kind}`, event: msg.kind, at: msg.at };
        if (msg.name !== undefined) item.name = msg.name;
        // The 'room' update is sent before its 'system' message, so this is already the new state.
        if (msg.kind === 'filter') item.filterOn = this.room?.filter ?? true;
        this.#push(item);
        break;
      }
      case 'marks':
        this.marks = msg.marks;
        this.#confirmedMarks = msg.marks;
        break;
      case 'claim':
        this.claims.push(msg.claim);
        this.latestClaim = msg.claim;
        this.#push({ kind: 'claim', key: `k${msg.claim.memberId}${msg.claim.kind}`, claim: msg.claim });
        break;
      case 'closed':
        this.status = msg.reason;
        this.#ws?.close();
        break;
      case 'error':
        // A refused (rate-limited) mark must not linger on screen as if it counted.
        if (msg.code === 'rate_limited') this.marks = [...this.#confirmedMarks];
        this.notice =
          msg.code === 'rate_limited' || msg.code === 'bad_claim' || msg.code === 'already_claimed'
            ? msg.code
            : null;
        break;
      case 'pong':
        break;
    }
  }

  send(msg: ClientMessage): boolean {
    if (this.#ws?.readyState !== WebSocket.OPEN) return false;
    this.#ws.send(JSON.stringify(msg));
    return true;
  }

  /**
   * Costume/ink colour slot for a member: join order, so the first six people never share a colour.
   * People no longer in the list (e.g. removed) fall back to a stable hash.
   */
  slot(memberId: string): number {
    const index = this.members.findIndex((m) => m.id === memberId);
    return index >= 0 ? index % 6 : personSlot(memberId);
  }

  toggle(cell: number): void {
    const marked = !this.marks.includes(cell);
    // Optimistic; the server echoes the authoritative list.
    this.marks = marked ? [...this.marks, cell] : this.marks.filter((c) => c !== cell);
    this.send({ t: 'mark', cell, marked });
  }

  dispose(): void {
    this.#disposed = true;
    clearTimeout(this.#timer);
    clearInterval(this.#ping);
    this.#ws?.close();
  }
}

function at(item: FeedItem): number {
  return item.kind === 'chat' ? item.entry.at : item.kind === 'claim' ? item.claim.at : item.at;
}
