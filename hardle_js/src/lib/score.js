// Freestyle arcade score. Only solved games get a score.
//
//   guess points: (11 - guesses) * 100            -> 1 guess = 1000, 10 guesses = 100
//   speed points: 600 * 300 / (300 + seconds)     -> instant = 600, 5 min = 300,
//                                                    10 min = 200, 20 min = 120
//
// Speed points shrink gradually and never hit zero, so a faster solve always
// scores higher, even in long games.
// If you change this, change the matching `score` column in supabase/schema.sql
// too, then rerun supabase/build-setup.py.
export function computeScore(guesses, timeMs) {
  const seconds = Math.floor(timeMs / 1000);
  return (11 - guesses) * 100 + Math.round((600 * 300) / (300 + seconds));
}
