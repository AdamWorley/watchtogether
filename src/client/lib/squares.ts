import type { ShowSlug } from '../../shared/shows';

// Each show's bingo pool is its own lazily loaded chunk, so the lobby never ships every show's squares.
const LOADERS: Record<ShowSlug, () => Promise<readonly string[]>> = {
  'celebrity-traitors': () =>
    import('../../shared/content/celebrity-traitors').then((m) => m.CELEBRITY_TRAITORS_SQUARES),
  traitors: () => import('../../shared/content/traitors').then((m) => m.TRAITORS_SQUARES),
  strictly: () => import('../../shared/content/strictly').then((m) => m.STRICTLY_SQUARES),
  'im-a-celeb': () => import('../../shared/content/im-a-celeb').then((m) => m.IM_A_CELEB_SQUARES),
  'bake-off': () => import('../../shared/content/bake-off').then((m) => m.BAKE_OFF_SQUARES),
  'dancing-on-ice': () => import('../../shared/content/dancing-on-ice').then((m) => m.DANCING_ON_ICE_SQUARES),
};

export const loadSquares = (show: ShowSlug): Promise<readonly string[]> => LOADERS[show]();
