import { englishDataset, englishRecommendedTransformers, RegExpMatcher, TextCensor } from 'obscenity';

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
const censor = new TextCensor();

/** Mask profanity for display only; the original text is never modified server-side. */
export function mask(text: string): string {
  const matches = matcher.getAllMatches(text);
  return matches.length ? censor.applyTo(text, matches) : text;
}
