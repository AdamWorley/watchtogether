import type { ShowSlug } from '../shows';
import { BAKE_OFF_SQUARES } from './bake-off';
import { CELEBRITY_TRAITORS_SQUARES } from './celebrity-traitors';
import { DANCING_ON_ICE_SQUARES } from './dancing-on-ice';
import { IM_A_CELEB_SQUARES } from './im-a-celeb';
import { STRICTLY_SQUARES } from './strictly';
import { TRAITORS_SQUARES } from './traitors';

export const SQUARE_MAX = 48;

export const SQUARES: Record<ShowSlug, readonly string[]> = {
  'celebrity-traitors': CELEBRITY_TRAITORS_SQUARES,
  traitors: TRAITORS_SQUARES,
  strictly: STRICTLY_SQUARES,
  'im-a-celeb': IM_A_CELEB_SQUARES,
  'bake-off': BAKE_OFF_SQUARES,
  'dancing-on-ice': DANCING_ON_ICE_SQUARES,
};
