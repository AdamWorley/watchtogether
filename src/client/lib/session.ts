import { z } from '../../shared/zod';
import { SessionResponse } from '../../shared/protocol';

// One room per tab. sessionStorage is per-tab and cleared when the tab closes,
// which matches the ephemeral nature of rooms. Access can throw (privacy modes), so guard it.
const KEY = 'wt:session';
const Stored = SessionResponse;
export type Session = z.infer<typeof Stored>;

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (Stored.safeParse(JSON.parse(raw)).data ?? null) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Without storage a refresh just asks for your name again.
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
