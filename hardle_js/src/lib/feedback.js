// Hardle's clue for one guess: how many letters are in the right spot (green)
// and how many are in the word but in the wrong spot (yellow).
//
// The shared leaderboard runs this same logic inside Supabase (hardle_counts in
// supabase/setup.sql). Keep the two in sync.
export function getCounts(guess, answer) {
  const g = guess.toUpperCase();
  const a = answer.toUpperCase();
  const count = (word, ch) => word.split(ch).length - 1;

  let green = 0;
  let yellow = 0;
  for (let i = 0; i < 5; i++) {
    const ch = g[i];
    if (ch === a[i]) {
      green++;
    } else if (a.includes(ch) && count(g, ch) <= count(a, ch)) {
      yellow++;
    }
  }
  return { yellow, green };
}
