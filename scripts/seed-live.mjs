// Local development only: writes fake schedules into the LOCAL KV (.wrangler/state) so every home/show
// state can be exercised. It never touches remote KV (`--local` is hard-coded).
//
//   node scripts/seed-live.mjs                  # both shows on air now
//   node scripts/seed-live.mjs traitors strictly:new   # traitors live, strictly's new series starts in 3 days
//   modes: live (default) · today (next episode in 2 hours) · next (next episode in 2 days) · new (new series in 3 days) · off (no episodes)
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2).length ? process.argv.slice(2) : ['traitors', 'strictly'];
const now = Date.now();
const DAY = 86_400_000;
/** @param {number} ms */
const at = (ms) => new Date(ms).toISOString();

/** @type {Record<string, (i: number) => object[]>} */
const MODES = {
  live: (i) => [
    {
      id: -1 - i,
      name: 'Local test episode',
      season: 1,
      number: 1,
      airstamp: at(now - 10 * 60_000),
      runtime: 60,
    },
    { id: -10 - i, name: 'Next week', season: 1, number: 2, airstamp: at(now + 7 * DAY), runtime: 60 },
  ],
  // Later today (2 hours away, so rooms aren't open yet). After 22:00 UK time this lands tomorrow.
  today: (i) => [
    { id: -40 - i, name: 'Episode 5', season: 1, number: 5, airstamp: at(now + 2 * 3600_000), runtime: 60 },
  ],
  next: (i) => [
    { id: -20 - i, name: 'Episode 4', season: 1, number: 4, airstamp: at(now + 2 * DAY), runtime: 60 },
  ],
  new: (i) => [
    { id: -30 - i, name: 'Launch show', season: 2, number: 1, airstamp: at(now + 3 * DAY), runtime: 90 },
  ],
  off: () => [],
};

for (const [i, arg] of args.entries()) {
  const [show, mode = 'live'] = arg.split(':');
  const build = MODES[mode];
  if (!build) throw new Error(`unknown mode "${mode}"`);
  const value = JSON.stringify({ episodes: build(i), updatedAt: now });
  execFileSync(
    'npx',
    ['wrangler', 'kv', 'key', 'put', '--local', '--binding', 'KV', `schedule:${show}`, value],
    {
      stdio: 'inherit',
    },
  );
}
