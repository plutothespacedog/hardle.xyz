import { formatTime } from '../components/Timer';

// Hardle is hard: a win in under 3 guesses, or faster than the time limit
// below, looks a bit too good, so we call it out (just for fun).
const FEW_GUESSES = 3;

// "Suspiciously fast" limit for each mode.
const FAST_MS = {
  daily: 30 * 1000,          // 30 seconds
  freestyle: 2 * 60 * 1000,  // 2 minutes
};

const LIMIT_TEXT = {
  daily: '30 seconds',
  freestyle: '2 minutes',
};

const guessWord = (n) => `${n} ${n === 1 ? 'guess' : 'guesses'}`;

function flags(mode, guesses, timeMs) {
  const limit = FAST_MS[mode] ?? FAST_MS.freestyle;
  return { fewGuesses: guesses < FEW_GUESSES, fast: timeMs < limit };
}

// Full call-out for the results popup, or null if the result looks honest.
export function suspicionMessage(mode, won, guesses, timeMs) {
  if (!won) return null;
  const { fewGuesses, fast } = flags(mode, guesses, timeMs);
  if (!fewGuesses && !fast) return null;
  const why = fewGuesses && fast
    ? `${guessWord(guesses)} in ${formatTime(timeMs)}?`
    : fewGuesses
      ? `${guessWord(guesses)}?`
      : `Under ${LIMIT_TEXT[mode] ?? LIMIT_TEXT.freestyle}?`;
  return `${why} Cheater cheater pumpkin eater 🎃`;
}

// One-liner for the menu and share text, or null.
export function suspicionShort(mode, won, guesses, timeMs) {
  if (!won) return null;
  const { fewGuesses, fast } = flags(mode, guesses, timeMs);
  // Non-breaking space keeps 🎃 on the same line.
  return fewGuesses || fast ? 'Cheater cheater pumpkin eater 🎃' : null;
}
