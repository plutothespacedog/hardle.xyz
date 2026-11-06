// Daily puzzle: everyone gets the same word on the same (local) calendar day.

// Day 1 of Hardle's daily puzzle.
const FIRST_DAY = new Date(2026, 10, 6); // November 6, 2026

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Puzzle number for a given date (1 = the first day). Uses local midnight so the
// word changes at midnight wherever the player is, like Wordle.
export function getDailyNumber(date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - FIRST_DAY) / MS_PER_DAY) + 1;
}

// The calendar date of a Daily puzzle number.
export function dateForDaily(n) {
  return new Date(FIRST_DAY.getFullYear(), FIRST_DAY.getMonth(), FIRST_DAY.getDate() + n - 1);
}

// Small deterministic PRNG so the daily order is shuffled but identical for everyone.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick today's word from the answer list. The list is shuffled with a fixed seed
// (so the order isn't alphabetical), then walked through one word per day.
// TESTING: force the answer for both Daily and Freestyle while running locally
// with `npm start`. Ignored in production builds (`npm run deploy`), so it can't
// leak to the live site. Set to null to go back to real words.
//
// While it's on, nothing is written to the shared database: Daily games only
// read today's stats, and Freestyle runs in the browser with a leaderboard saved
// on this device, so test games can't skew real players' numbers.
const TEST_WORD = 'green';

export const isTestWord = Boolean(TEST_WORD) && process.env.NODE_ENV === 'development';
export const testWord = isTestWord ? TEST_WORD : null;

export function pickDailyWord(words, dailyNumber) {
  if (isTestWord) {
    return TEST_WORD;
  }
  const shuffled = [...words].sort();
  const rand = mulberry32(20261106);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const index = (((dailyNumber - 1) % shuffled.length) + shuffled.length) % shuffled.length;
  return shuffled[index];
}

// Remember today's daily result on this device so it can't be replayed.
const dailyKey = (n) => `hardle-daily-${n}`;

export function loadDailyResult(n) {
  try {
    const raw = localStorage.getItem(dailyKey(n));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDailyResult(n, result) {
  try {
    localStorage.setItem(dailyKey(n), JSON.stringify(result));
  } catch {
    // Storage blocked (e.g. private mode): the result just won't be remembered.
  }
}

// A Daily game in progress, so leaving or refreshing resumes it instead of
// starting over. The clock keeps running while you're away.
const progressKey = (n) => `hardle-daily-progress-${n}`;

export function loadDailyProgress(n) {
  try {
    const raw = localStorage.getItem(progressKey(n));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDailyProgress(n, progress) {
  try {
    localStorage.setItem(progressKey(n), JSON.stringify(progress));
  } catch {
    // Storage blocked: progress just won't survive leaving the page.
  }
}

export function clearDailyProgress(n) {
  try {
    localStorage.removeItem(progressKey(n));
  } catch {
    // Nothing to clear.
  }
}

// Personal Daily history on this device: played, win %, current and best streak.
// Pass `todayResult` to count a game that just ended but may not be saved yet.
export function getDailyHistory(today, todayResult = null) {
  const results = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^hardle-daily-(\d+)$/.exec(localStorage.key(i));
      if (m) results[Number(m[1])] = JSON.parse(localStorage.getItem(m[0]));
    }
  } catch {
    // Storage blocked: no history.
  }
  if (todayResult) results[today] = todayResult;
  const days = Object.keys(results).map(Number).sort((a, b) => a - b);
  const wins = days.filter((d) => results[d] && results[d].solved).length;

  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = results[d].solved && prev === d - 1 ? run + 1 : results[d].solved ? 1 : 0;
    best = Math.max(best, run);
    prev = d;
  }

  // Current streak: consecutive solved days ending today (or yesterday, if today isn't played yet).
  let current = 0;
  let d = results[today] ? today : today - 1;
  while (results[d] && results[d].solved) {
    current++;
    d--;
  }

  return {
    played: days.length,
    winPct: days.length ? Math.round((100 * wins) / days.length) : 0,
    current,
    best,
  };
}

// Testing only: forget everything about Daily games on this device.
export function resetDailyOnThisDevice() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('hardle-daily-'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Nothing to reset.
  }
}
