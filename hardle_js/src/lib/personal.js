// Personal bests on this device: every Freestyle win, plus solved Daily games.
import { computeScore } from './score';
import { isTestWord, dateForDaily } from './daily';

// Test-mode games (TEST_WORD in daily.js) are kept apart so they don't mix
// with real personal bests.
const FREESTYLE_KEY = isTestWord ? 'hardle-personal-freestyle-test' : 'hardle-personal-freestyle';
const LIMIT = 10;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

// Called once per Freestyle win.
export function recordFreestyleWin({ word, guesses, timeMs }) {
  const entry = {
    word,
    guesses,
    time_ms: Math.round(timeMs),
    score: computeScore(guesses, timeMs),
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(FREESTYLE_KEY, JSON.stringify([...read(FREESTYLE_KEY), entry]));
  } catch {
    // Storage blocked: personal bests just won't be kept.
  }
}

function dailyWins() {
  const wins = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^hardle-daily-(\d+)$/.exec(localStorage.key(i));
      if (!m) continue;
      const r = JSON.parse(localStorage.getItem(m[0]));
      if (!r || !r.solved) continue;
      const day = Number(m[1]);
      wins.push({
        day,
        word: r.word,
        guesses: r.guesses,
        time_ms: Math.round(r.timeMs),
        score: computeScore(r.guesses, r.timeMs),
        at: dateForDaily(day).toISOString(),
      });
    }
  } catch {
    // Storage blocked: no Daily history.
  }
  return wins;
}

function sortGames(games, kind) {
  return [...games].sort((a, b) =>
    kind === 'speed'
      ? a.time_ms - b.time_ms || a.guesses - b.guesses
      : b.score - a.score || a.time_ms - b.time_ms
  );
}

function bests(games) {
  if (!games.length) return null;
  return {
    played: games.length,
    bestScore: Math.max(...games.map((g) => g.score)),
    fastest: Math.min(...games.map((g) => g.time_ms)),
    fewest: Math.min(...games.map((g) => g.guesses)),
  };
}

// { freestyle: { bests, top }, daily: { bests, top } }, sorted by 'score' or 'speed'.
export function getPersonalBoards(kind) {
  const freestyle = read(FREESTYLE_KEY);
  const daily = dailyWins();
  return {
    freestyle: { bests: bests(freestyle), top: sortGames(freestyle, kind).slice(0, LIMIT) },
    daily: { bests: bests(daily), top: sortGames(daily, kind).slice(0, LIMIT) },
  };
}
