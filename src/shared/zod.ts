// Import `z` from here, never from 'zod' directly (enforced by ESLint).
// jitless stops zod from probing for / using `new Function`, which our CSP and Trusted Types forbid in
// browsers (and Workers disallow). Zod reads this flag when schemas are *constructed*, so it has to be
// set in a module that is evaluated before any schema module, which ES import order guarantees here.
import { z } from 'zod';

z.config({ jitless: true });

export { z };
