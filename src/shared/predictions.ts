// Predictions: everyone in a room picks who they think goes (or wins) tonight; the host records what happened.
import { SHOWS, type ShowSlug, type WorldSlug } from './shows';

export const QUESTION_IDS = ['murdered', 'banished', 'star', 'leaves'] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

/** What each world asks, in the order it happens on screen. Wording lives in the client's voice. */
const WORLD_QUESTIONS: Record<WorldSlug, readonly QuestionId[]> = {
  traitors: ['murdered', 'banished'],
  strictly: ['leaves'],
  jungle: ['leaves'],
  bakeoff: ['star', 'leaves'],
  ice: ['leaves'],
};

export function questionsFor(show: ShowSlug): readonly QuestionId[] {
  return WORLD_QUESTIONS[SHOWS[show].world];
}

/** Longest contestant name a host can add. */
export const CONTESTANT_MAX = 40;
/** Most names a room's line-up can hold. */
export const LINEUP_MAX = 40;

/** Case-insensitive name match, so "maya jama" and "Maya Jama" are one person. */
export const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();
