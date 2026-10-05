# WatchTogether

Live, ephemeral watch-party rooms for **The Celebrity Traitors** and **Strictly Come Dancing**: a unique bingo
card per person and a live chat. Rooms open 30 minutes before an episode airs, close one hour after it ends, and
are then permanently deleted. There are no accounts, cookies or analytics.

Production: <https://watchtogether.uk> · Each PR gets its own preview URL.

## How it works

```
Browser (Svelte 5 SPA) ── static assets (hashed, immutable, CDN) ──┐
        │                                                          │  one Cloudflare Worker
        ├── /api/schedule/:show  → KV (TVmaze cache, edge-cached)  │  (src/worker/index.ts)
        ├── POST /api/rooms      → new Room Durable Object         │
        ├── POST /api/rooms/join → code → room (KV, expires)       │
        └── WSS /api/rooms/:id/ws → Room DO (src/worker/room.ts) ──┘
Cron (every 30 min) → TVmaze → KV
```

- **Room Durable Object.** One per room, using SQLite storage and the WebSocket Hibernation API. It holds the
  members, cards, marks, the last 100 chat messages, claims and host settings. An alarm at the end of the
  window closes every socket and calls `deleteAll()`.
- **Access.** A 10-character code (about 50 bits) is shown as `XXXXX-XXXXX`. Share links put it in the URL
  fragment (`/traitors/room#CODE`), so it never reaches server logs. Joining returns a 256-bit session token.
  The browser sends it as a WebSocket subprotocol and the server stores only its SHA-256 hash.
- **Schedule.** Air times come from TVmaze ([CC BY-SA](https://www.tvmaze.com/api), credited in the footer).
  Fix wrong listings in `src/shared/schedule-overrides.ts`.
- **Bingo.** Cards are generated server-side (an unbiased crypto shuffle, unique within the room). Players mark
  their own squares. A claim is checked against those marks and announced to the room along with the card.

## Security

- **Rendering.** All user text is rendered via Svelte text interpolation. ESLint fails the build on `{@html}`,
  `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `eval`.
- **Message validation.** Every HTTP and WebSocket message is validated with strict zod schemas, on both
  server and client (`src/shared/protocol.ts`). Frames are capped at 2 KB. Text is NFC-normalised, with
  control, zero-width and bidi characters stripped.
- **Headers.** A strict CSP (`script-src 'self'`, no inline scripts or styles) and Trusted Types are enforced
  (`public/_headers`). HSTS, `nosniff`, `frame-ancestors 'none'` and `no-referrer` are also set. Zod runs in
  `jitless` mode so nothing needs `eval`.
- **Origin checks.** All state-changing requests and WebSocket upgrades must be same-origin. This blocks CSRF
  and cross-site WebSocket hijacking.
- **Rate limits.**
  - Room creation: 3 per minute per IP.
  - Joins: 10 per minute per IP.
  - Per-socket limits on messages and chat.
  - At most 20 people per room.
- **Host powers are enforced server-side.** The host can remove someone (which bans their token), lock the
  room, rotate the code (old links stop working) and toggle the display-only profanity filter.
- **Supply chain.**
  - Dependabot.
  - CodeQL.
  - `npm audit` in CI.
  - Actions pinned to commit SHAs.
  - npm install scripts allow-listed (`allowScripts`).
  - A guard that fails CI on invisible or bidi characters in source (`scripts/check-unicode.mjs`).

## Development

Requires Node 24 (see `.nvmrc`).

```sh
npm ci
npm run seed:live      # fake an episode "on now" in local KV so you can create rooms
npm run dev            # Vite + the Worker in workerd, http://localhost:5173
```

| Command              | What it does                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `npm run lint`       | ESLint (including XSS rules), Prettier, invisible-character guard    |
| `npm run check`      | svelte-check and `tsc` for every project                             |
| `npm test`           | Unit tests, plus Worker/DO tests in the real Workers runtime         |
| `npm run test:e2e`   | Playwright (desktop and mobile) against a production build           |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` after editing wrangler config |

**Bingo content** lives in `src/shared/content/*.ts`. Cards reference squares by index, so while rooms are live
only append or edit in place. Reorder between episodes.

## Deployment

GitHub Actions does everything:

- **`ci.yml`** runs on every PR:
  - npm audit
  - type-generation drift check
  - lint
  - type-check
  - tests with coverage
  - build
  - JS size budget (60 KB gzip)
  - `wrangler deploy --dry-run`
  - Playwright
  - once all of that passes, a **Worker Preview** (`wrangler preview --name pr-<n>`), smoke-tested, with its
    URL on the PR's "View deployment" button and in the job summary. Pushing to the branch updates it.
- **`preview-cleanup.yml`** deletes the PR's Preview when the PR is merged or closed.
- **`deploy.yml`** runs on every push to `main`. It reruns CI, deploys to production and runs a smoke test.
- **`codeql.yml`** runs on PRs, on pushes to `main`, and weekly.

There is no staging environment: the PR Preview is where you check a change before merging. Each Preview gets
its own Durable Object storage, so rooms opened there never mix with production. All Previews share one
preview-only KV namespace (TVmaze cache and room codes). Previews don't run the cron; they fetch the schedule
from TVmaze on first request, so a room can only be opened on a Preview while a show is actually on air.
PRs from forks and Dependabot get no Preview, because they don't receive secrets.

### One-time setup

1. **Cloudflare API token** (My Profile → API Tokens), scoped to this account only, with these permissions:
   Account › Workers Scripts: Edit, Account › Workers KV Storage: Edit, Zone › Workers Routes: Edit
   (zone `watchtogether.uk`) and Zone › DNS: Edit (for the custom domains).
2. **GitHub → Settings → Environments.** Create `preview` and `production`, each with the secrets
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Restrict `production` to the `main` branch. Required
   reviewers on `production` are optional now that merging is the release step.
3. **GitHub → Settings → Branches.** Protect `main`: require a PR, and require the status checks
   _Lint, type-check, test, build_, _End-to-end (Playwright)_ and _CodeQL / analyze_.
4. The first deploy creates the KV namespaces, the Durable Object class and the custom domains
   (`watchtogether.uk`). After that, in the Cloudflare dashboard:
   - Add a redirect rule from `www.watchtogether.uk` to the apex.
   - Turn on Always Use HTTPS.
   - Set minimum TLS to 1.2.
   - Once you're happy, submit the domain to <https://hstspreload.org>.
   - Optional: Previews are public `workers.dev` URLs. To keep them private, turn on Cloudflare Access for
     this Worker's Previews (Worker → Settings → Domains).
