import { sameLondonDay } from '../../shared/window';

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});
const dayFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});

export const formatTime = (ms: number) => timeFmt.format(ms);
export const formatDay = (ms: number) => dayFmt.format(ms);

/** "today at 20:00" when it airs today (UK time), otherwise "Tuesday 6 October at 20:00". */
export function formatWhen(ms: number, now: number): string {
  return sameLondonDay(ms, now) ? `today at ${formatTime(ms)}` : formatDay(ms);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
