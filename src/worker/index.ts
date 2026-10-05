import { normaliseCode } from '../shared/codes';
import {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomId,
  type ScheduleResponse,
  type SessionResponse,
} from '../shared/protocol';
import { isShowSlug } from '../shared/shows';
import { episodeWindow, liveEpisode } from '../shared/window';
import { clientIp, error, isSameOrigin, json, log, readJson } from './http';
import { codeKey, Room } from './room';
import { getSchedule, refreshAll } from './schedule';

export { Room };

const SCHEDULE_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

async function handleSchedule(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  show: string,
): Promise<Response> {
  if (!isShowSlug(show)) return error('not_found', 404);
  const cache = caches.default;
  const cacheKey = new Request(new URL(`/api/schedule/${show}`, request.url).toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const stored = await getSchedule(env, ctx, show);
  const body: ScheduleResponse = { show, episodes: stored.episodes, updatedAt: stored.updatedAt };
  const res = json(body, 200, SCHEDULE_CACHE);
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function handleCreate(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { success } = await env.RL_CREATE.limit({ key: clientIp(request) });
  if (!success) return error('rate_limited', 429);
  const body = await readJson(request, CreateRoomRequest);
  if (!body || !isShowSlug(body.show)) return error('invalid', 400);

  const { episodes } = await getSchedule(env, ctx, body.show);
  const episode = liveEpisode(episodes, Date.now());
  if (!episode) return error('not_live', 409);

  const id = env.ROOM.newUniqueId();
  const result = await env.ROOM.get(id).create({
    show: body.show,
    episode,
    closesAt: episodeWindow(episode).closesAt,
    hostName: body.name,
  });
  log('room.created', { show: body.show });
  const session: SessionResponse = {
    roomId: id.toString(),
    token: result.token,
    code: result.code,
    show: body.show,
  };
  return json(session, 201);
}

async function handleJoin(request: Request, env: Env): Promise<Response> {
  const { success } = await env.RL_JOIN.limit({ key: clientIp(request) });
  if (!success) return error('rate_limited', 429);
  const body = await readJson(request, JoinRoomRequest);
  if (!body) return error('invalid', 400);

  // Bad format and unknown code look identical to callers.
  const code = normaliseCode(body.code);
  const entry = code ? await env.KV.get<{ roomId: string }>(codeKey(code), 'json') : null;
  const roomId = RoomId.safeParse(entry?.roomId);
  if (!code || !roomId.success) return error('not_found', 404);

  const stub = env.ROOM.get(env.ROOM.idFromString(roomId.data));
  const result = await stub.join(body.name);
  if (!result.ok) return error(result.error, result.error === 'closed' ? 410 : 403);
  const session: SessionResponse = { roomId: roomId.data, token: result.token, code, show: result.show };
  return json(session, 200);
}

function handleSocket(request: Request, env: Env, roomId: string): Promise<Response> | Response {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return error('expected_websocket', 426);
  const parsed = RoomId.safeParse(roomId);
  if (!parsed.success) return error('not_found', 404);
  let id: DurableObjectId;
  try {
    id = env.ROOM.idFromString(parsed.data);
  } catch {
    return error('not_found', 404);
  }
  return env.ROOM.get(id).fetch(request);
}

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const schedule = /^\/api\/schedule\/([a-z-]+)$/.exec(path);
  if (schedule && method === 'GET') return handleSchedule(request, env, ctx, schedule[1]!);

  // Everything below changes state: require a same-origin browser request.
  if (path.startsWith('/api/rooms') && !isSameOrigin(request, url)) return error('forbidden', 403);

  if (path === '/api/rooms' && method === 'POST') return handleCreate(request, env, ctx);
  if (path === '/api/rooms/join' && method === 'POST') return handleJoin(request, env);
  const ws = /^\/api\/rooms\/([0-9a-f]{64})\/ws$/.exec(path);
  if (ws && method === 'GET') return handleSocket(request, env, ws[1]!);

  return error('not_found', 404);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      log('request.error', { error: err instanceof Error ? err.name : 'unknown' });
      return error('internal', 500);
    }
  },

  scheduled(_controller, env, ctx): void {
    ctx.waitUntil(refreshAll(env));
  },
} satisfies ExportedHandler<Env>;
