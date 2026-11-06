// Freestyle leaderboard.
//
// If REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY are set (see
// SUPABASE_SETUP.md), Freestyle runs on Supabase: the database picks the word,
// checks every guess, keeps the clock, and only it can write to the shared board.
// The browser never sees the word until the game is over.
//
// Otherwise everything runs in this browser and scores are kept on this device.
import { computeScore } from './score';
import { isTestWord } from './daily';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
// The publishable key (sb_publishable_...) is meant to be public. The older
// "anon" key works too.
const SUPABASE_KEY =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isShared = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Freestyle uses the shared board unless we're in local test mode (see TEST_WORD
// in daily.js), where test scores stay on this device.
export const boardIsShared = isShared && !isTestWord;

// How many scores the global board shows.
export const GLOBAL_LIMIT = 100;
const LIMIT = GLOBAL_LIMIT;
const LOCAL_KEY = 'hardle-leaderboard';

// kind: 'score' (highest combined score) or 'speed' (fastest solve).
const ORDER = {
  score: 'score.desc,time_ms.asc,created_at.asc',
  speed: 'time_ms.asc,guesses.asc,created_at.asc',
};

function headers() {
  const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  // Legacy anon keys are JWTs and also go in Authorization. New publishable keys
  // aren't JWTs and must only be sent as `apikey`.
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function sortEntries(entries, kind) {
  const byTime = (a, b) => a.time_ms - b.time_ms;
  const byDate = (a, b) => a.created_at.localeCompare(b.created_at);
  return [...entries].sort((a, b) =>
    kind === 'speed'
      ? byTime(a, b) || a.guesses - b.guesses || byDate(a, b)
      : b.score - a.score || byTime(a, b) || byDate(a, b)
  );
}

export async function fetchTop(kind) {
  if (!boardIsShared) {
    return sortEntries(readLocal(), kind).slice(0, LIMIT);
  }
  const url =
    `${SUPABASE_URL}/rest/v1/scores?select=id,name,word,guesses,time_ms,score,created_at` +
    `&order=${ORDER[kind]}&limit=${LIMIT}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`Leaderboard load failed (${res.status})`);
  return res.json();
}

// Local mode only: saves a solved game on this device. Returns the saved entry
// (with id) so it can be highlighted.
export async function submitScore({ name, word, guesses, timeMs }) {
  const saved = {
    id: `local-${Date.now()}`,
    name,
    word,
    guesses,
    time_ms: Math.round(timeMs),
    score: computeScore(guesses, timeMs),
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...readLocal(), saved]));
  } catch {
    // Storage blocked: entry shows this session only.
  }
  return saved;
}

// ---------- Shared (Supabase) Freestyle games ----------

async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(args),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && body.message) || `Server error (${res.status})`);
  }
  return body;
}

// Starts a game on the server. Returns its id; the word stays on the server.
export const startServerGame = () => rpc('start_game', {});

// Sends one guess. Returns { yellow, green, finished } and, once the game is
// over, { solved, word, guesses, time_ms } with the server's official time.
export const submitServerGuess = (gameId, guess) =>
  rpc('submit_guess', { p_game: gameId, p_guess: guess.toLowerCase() });

// Puts a solved server game on the board under 3-letter initials.
export const claimScore = (gameId, name) =>
  rpc('claim_score', { p_game: gameId, p_name: name });

// ---------- Daily percentiles ----------

// Records a finished Daily and returns { id, players, guesses, time, score },
// where each percentile is the % of other players you beat (null if you're first).
export const submitDaily = ({ day, solved, guesses, timeMs }) =>
  rpc('submit_daily', { p_day: day, p_solved: solved, p_guesses: guesses, p_time_ms: Math.round(timeMs) });

// Same comparison without recording anything. Pass excludeId (your own saved
// result) to avoid being compared with yourself.
export const fetchDailyPercentiles = ({ day, solved, guesses, timeMs, excludeId = null }) =>
  rpc('daily_percentiles', {
    p_day: day, p_solved: solved, p_guesses: guesses, p_time_ms: Math.round(timeMs), p_exclude: excludeId,
  });
