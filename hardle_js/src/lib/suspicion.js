import { formatTime } from '../components/Timer';

// Hardle is hard: solving in under 3 guesses or under 2 minutes looks a bit
// too good, so we call it out (just for fun).
const FEW_GUESSES = 3;
const FAST_MS = 2 * 60 * 1000;

const guessWord = (n) => `${n} ${n === 1 ? 'guess' : 'guesses'}`;

// Full call-out for the results popup, or null if the result looks honest.
export function suspicionMessage(won, guesses, timeMs) {
  if (!won) return null;
  const fewGuesses = guesses < FEW_GUESSES;
  const fast = timeMs < FAST_MS;
  if (!fewGuesses && !fast) return null;
  const why = fewGuesses && fast
    ? `${guessWord(guesses)} in ${formatTime(timeMs)}?`
    : fewGuesses
      ? `${guessWord(guesses)}?`
      : `Under 2 minutes?`;
  return `${why} Cheater cheater pumpkin eater\u00a0🎃`;
}

// One-liner for the menu, or null.
export function suspicionShort(won, guesses, timeMs) {
  if (!won) return null;
  if (guesses < FEW_GUESSES || timeMs < FAST_MS) return 'Cheater cheater pumpkin eater\u00a0🎃'; // non-breaking space keeps 🎃 on the line
  return null;
}
