import type { z } from '../../shared/zod';
import { ErrorResponse, ScheduleResponse, SessionResponse } from '../../shared/protocol';
import type { ShowSlug } from '../../shared/shows';

export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: RequestInit,
): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'omit',
      cache: init?.method === 'POST' ? 'no-store' : 'default',
    });
  } catch {
    throw new ApiError('network');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(ErrorResponse.safeParse(data).data?.error ?? `http_${res.status}`);
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError('bad_response');
  return parsed.data;
}

const postJson = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const getSchedule = (show: ShowSlug) => request(`/api/schedule/${show}`, ScheduleResponse);
export const createRoom = (show: ShowSlug, name: string) =>
  request('/api/rooms', SessionResponse, postJson({ show, name }));
export const joinRoom = (code: string, name: string) =>
  request('/api/rooms/join', SessionResponse, postJson({ code, name }));

// Errors block someone from joining, so they stay plain in every show: what happened, then what to do.
const MESSAGES: Record<string, string> = {
  network: 'Couldn’t reach WatchTogether. Check your connection and try again.',
  rate_limited: 'Too many tries in a row. Wait a minute, then try again.',
  not_live: 'There’s no episode on right now. Rooms open 30 minutes before it airs.',
  not_found: 'That code doesn’t match an open room. Check it, or ask for a fresh invite link.',
  locked: 'The host has locked this room, so no one new can join. Ask them to unlock it.',
  full: 'This room is full (20 people). Ask the host to make space, or start your own room.',
  closed: 'This room has closed. Rooms close an hour after the episode ends.',
  invalid: 'Names need 1 to 24 characters. Please check yours and try again.',
};

export function errorMessage(err: unknown): string {
  const code = err instanceof ApiError ? err.code : 'unknown';
  return MESSAGES[code] ?? 'Something went wrong on our side. Please try again.';
}
