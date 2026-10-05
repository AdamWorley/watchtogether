import { env, exports } from 'cloudflare:workers';
import { PROTOCOL, ServerMessage, type SessionResponse } from '../../src/shared/protocol';
import type { ShowSlug } from '../../src/shared/shows';
import type { Episode } from '../../src/shared/window';

export const ORIGIN = 'https://watchtogether.uk';

let ipCounter = 0;
/** Each call gets a fresh client IP so the per-IP rate limiters don't interfere between tests. */
export const freshIp = () => `203.0.113.${(ipCounter++ % 250) + 1}`;

export function episodeAiring(offsetMin = -10, id = 1): Episode {
  return {
    id,
    name: 'Test episode',
    season: 1,
    number: id,
    airstamp: new Date(Date.now() + offsetMin * 60_000).toISOString(),
    runtime: 60,
  };
}

export async function seedSchedule(show: ShowSlug, episodes: Episode[]): Promise<void> {
  await env.KV.put(`schedule:${show}`, JSON.stringify({ episodes, updatedAt: Date.now() }));
}

export function post(path: string, body: unknown, init: { origin?: string | null; ip?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'CF-Connecting-IP': init.ip ?? freshIp(),
  };
  if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
  return exports.default.fetch(`${ORIGIN}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

export async function createRoom(show: ShowSlug = 'traitors', name = 'Host'): Promise<SessionResponse> {
  await seedSchedule(show, [episodeAiring()]);
  const res = await post('/api/rooms', { show, name });
  if (res.status !== 201) throw new Error(`create failed: ${res.status} ${await res.text()}`);
  return res.json<SessionResponse>();
}

export async function joinRoom(code: string, name: string): Promise<SessionResponse> {
  const res = await post('/api/rooms/join', { code, name });
  if (res.status !== 200) throw new Error(`join failed: ${res.status} ${await res.text()}`);
  return res.json<SessionResponse>();
}

export function upgrade(roomId: string, protocols: string, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { Upgrade: 'websocket', 'Sec-WebSocket-Protocol': protocols };
  if (origin) headers.Origin = origin;
  return exports.default.fetch(`${ORIGIN}/api/rooms/${roomId}/ws`, { headers });
}

export interface Client {
  ws: WebSocket;
  messages: ServerMessage[];
  send(msg: unknown): void;
  /** Resolve with the first message (seen or future) matching `pred`, consuming it. */
  next<T extends ServerMessage['t']>(
    t: T,
    pred?: (m: Extract<ServerMessage, { t: T }>) => boolean,
  ): Promise<Extract<ServerMessage, { t: T }>>;
  closed: Promise<{ code: number }>;
}

export async function connect(session: Pick<SessionResponse, 'roomId' | 'token'>): Promise<Client> {
  const res = await upgrade(session.roomId, `${PROTOCOL}, ${session.token}`);
  const ws = res.webSocket;
  if (res.status !== 101 || !ws) throw new Error(`upgrade failed: ${res.status}`);
  if (res.headers.get('Sec-WebSocket-Protocol') !== PROTOCOL) throw new Error('protocol not echoed');
  ws.accept();

  const messages: ServerMessage[] = [];
  const waiters: (() => void)[] = [];
  ws.addEventListener('message', (event) => {
    const parsed = ServerMessage.safeParse(JSON.parse(event.data as string));
    if (!parsed.success) throw new Error(`server sent invalid message: ${String(event.data)}`);
    messages.push(parsed.data);
    waiters.splice(0).forEach((w) => w());
  });
  const closed = new Promise<{ code: number }>((resolve) =>
    ws.addEventListener('close', (event) => resolve({ code: event.code })),
  );

  const client: Client = {
    ws,
    messages,
    closed,
    send: (msg) => ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)),
    next(t, pred) {
      type M = Extract<ServerMessage, { t: typeof t }>;
      return new Promise<M>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out waiting for ${t}`)), 2000);
        const check = () => {
          const i = messages.findIndex((m) => m.t === t && (!pred || pred(m as M)));
          if (i === -1) return waiters.push(check);
          clearTimeout(timer);
          resolve(messages.splice(i, 1)[0] as M);
        };
        check();
      });
    },
  };
  return client;
}
