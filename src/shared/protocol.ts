// Every message crossing the network is defined here and validated on both sides.
// Objects are strict: unknown keys are rejected.
import { z } from './zod';
import { CELLS } from './bingo';
import { cleanText, textLength } from './sanitize';
import { CONTESTANT_MAX, LINEUP_MAX, QUESTION_IDS } from './predictions';
import { SHOW_SLUGS } from './shows';
import { EpisodeSchema } from './window';

export const PROTOCOL = 'watchtogether.v1';
export const MAX_FRAME_BYTES = 2048;
export const NAME_MAX = 24;
export const CHAT_MAX = 280;
export const MAX_MEMBERS = 20;
export const CHAT_HISTORY = 100;

/** Untrusted user text: cleaned, then length-checked in code points. */
const userText = (max: number) =>
  z
    .string()
    .max(max * 8)
    .transform(cleanText)
    .refine((s) => textLength(s) >= 1 && textLength(s) <= max, `must be 1-${max} characters`);

export const Name = userText(NAME_MAX);
export const ChatText = userText(CHAT_MAX);
export const Show = z.enum(SHOW_SLUGS as [string, ...string[]]);
export const MemberId = z.string().regex(/^[A-Za-z0-9_-]{16}$/);
export const RoomId = z.string().regex(/^[0-9a-f]{64}$/);
const Cell = z
  .number()
  .int()
  .min(0)
  .max(CELLS - 1);
const ClaimKind = z.enum(['line', 'house']);
export const Question = z.enum(QUESTION_IDS);
export const Contestant = userText(CONTESTANT_MAX);

// ---------- HTTP ----------

export const CreateRoomRequest = z.strictObject({ show: Show, name: Name });
export const JoinRoomRequest = z.strictObject({ code: z.string().max(32), name: Name });

export const SessionResponse = z.strictObject({
  roomId: RoomId,
  token: z.string(),
  code: z.string(),
  show: Show,
});
export type SessionResponse = z.infer<typeof SessionResponse>;

export const ErrorResponse = z.strictObject({ error: z.string().max(64) });

export const ScheduleResponse = z.strictObject({
  show: Show,
  episodes: z.array(EpisodeSchema).max(200),
  updatedAt: z.number(),
});
export type ScheduleResponse = z.infer<typeof ScheduleResponse>;

// ---------- WebSocket: client -> server ----------

export const ClientMessage = z.discriminatedUnion('t', [
  z.strictObject({ t: z.literal('chat'), text: ChatText }),
  z.strictObject({ t: z.literal('mark'), cell: Cell, marked: z.boolean() }),
  z.strictObject({ t: z.literal('claim'), kind: ClaimKind }),
  /** Your prediction for a question; null takes it back. */
  z.strictObject({ t: z.literal('pick'), q: Question, name: Contestant.nullable() }),
  /** Host: what actually happened (null reopens the question). */
  z.strictObject({ t: z.literal('verdict'), q: Question, name: Contestant.nullable() }),
  /** Host: fix the line-up when the curated list is behind. */
  z.strictObject({ t: z.literal('lineup'), op: z.enum(['add', 'remove']), name: Contestant }),
  z.strictObject({ t: z.literal('kick'), memberId: MemberId }),
  z.strictObject({ t: z.literal('lock'), locked: z.boolean() }),
  z.strictObject({ t: z.literal('filter'), enabled: z.boolean() }),
  z.strictObject({ t: z.literal('rotate') }),
  z.strictObject({ t: z.literal('ping') }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

// ---------- WebSocket: server -> client ----------

const Member = z.strictObject({
  id: MemberId,
  name: z.string(),
  host: z.boolean(),
  online: z.boolean(),
  /** Progress counts only (never which squares), for telly mode's leaderboard. */
  marked: z
    .number()
    .int()
    .min(0)
    .max(CELLS - 1),
  /** Most squares marked in any one line, counting the free centre (1-5). */
  best: z.number().int().min(1).max(5),
});
export type Member = z.infer<typeof Member>;

const ChatEntry = z.strictObject({
  id: z.number().int(),
  memberId: MemberId,
  name: z.string(),
  text: z.string(),
  at: z.number(),
});
export type ChatEntry = z.infer<typeof ChatEntry>;

const Claim = z.strictObject({
  memberId: MemberId,
  name: z.string(),
  kind: ClaimKind,
  card: z.array(z.number().int()).length(CELLS),
  marks: z.array(Cell),
  first: z.boolean(),
  at: z.number(),
});
export type Claim = z.infer<typeof Claim>;

const Predictions = z.strictObject({
  /** Who can be picked, in display order. */
  lineup: z.array(z.string()).max(LINEUP_MAX),
  picks: z.array(z.strictObject({ memberId: MemberId, q: Question, name: z.string() })),
  verdicts: z.array(z.strictObject({ q: Question, name: z.string() })),
});
export type Predictions = z.infer<typeof Predictions>;

const RoomState = z.strictObject({
  show: Show,
  episode: EpisodeSchema,
  closesAt: z.number(),
  code: z.string(),
  locked: z.boolean(),
  filter: z.boolean(),
});
export type RoomState = z.infer<typeof RoomState>;

export const SystemKind = z.enum(['join', 'leave', 'kick', 'lock', 'unlock', 'rotate', 'filter', 'verdict']);

export const ServerMessage = z.discriminatedUnion('t', [
  z.strictObject({
    t: z.literal('welcome'),
    you: z.strictObject({ id: MemberId, name: z.string(), host: z.boolean() }),
    room: RoomState,
    card: z.array(z.number().int()).length(CELLS),
    marks: z.array(Cell),
    members: z.array(Member),
    chat: z.array(ChatEntry),
    claims: z.array(Claim),
    predictions: Predictions,
  }),
  z.strictObject({ t: z.literal('room'), room: RoomState }),
  z.strictObject({ t: z.literal('members'), members: z.array(Member) }),
  z.strictObject({ t: z.literal('chat'), entry: ChatEntry }),
  z.strictObject({
    t: z.literal('system'),
    kind: SystemKind,
    name: z.string().optional(),
    /** With kind 'verdict': which question was answered (`name` is who). */
    q: Question.optional(),
    at: z.number(),
  }),
  z.strictObject({ t: z.literal('predictions'), predictions: Predictions }),
  z.strictObject({ t: z.literal('marks'), marks: z.array(Cell) }),
  z.strictObject({ t: z.literal('claim'), claim: Claim }),
  z.strictObject({ t: z.literal('closed'), reason: z.enum(['ended', 'kicked']) }),
  z.strictObject({
    t: z.literal('error'),
    code: z.enum(['invalid', 'rate_limited', 'forbidden', 'already_claimed', 'bad_claim']),
  }),
  z.strictObject({ t: z.literal('pong') }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;

/** Upper bound for server frames (the welcome message carries the chat history). */
export const MAX_SERVER_FRAME_BYTES = 256 * 1024;

/** Parse a raw frame into a validated message, or null. Never throws. */
export function parseFrame<T extends z.ZodType>(
  schema: T,
  raw: unknown,
  maxBytes: number = MAX_FRAME_BYTES,
): z.infer<T> | null {
  // Each UTF-16 unit encodes to at least one UTF-8 byte, so this cheap check is a safe early exit.
  if (typeof raw !== 'string' || raw.length > maxBytes) return null;
  if (new TextEncoder().encode(raw).byteLength > maxBytes) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
