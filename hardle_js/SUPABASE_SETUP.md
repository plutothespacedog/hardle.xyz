# Shared Freestyle leaderboard (Supabase)

Until this is set up, Freestyle runs entirely in the browser and each device keeps its own leaderboard.
Once it's set up, everyone shares one board, and the database referees every game so scores can't simply be made up.
Setup takes about 5 minutes, and Supabase's free tier is enough.

## How it stops cheating

When Supabase is connected, Freestyle runs like this:

1. **Play** asks the database to start a game. The database picks the word and starts the clock, then sends back only a game id.
2. **Each guess** goes to the database, which checks that it's a real word and replies with only the two numbers (yellow and green).
3. **The winning guess** stops the clock in the database. Only then does the database reveal the word and the official time.
4. **Saving your initials** asks the database to put that game on the board. It only accepts a game it watched you solve, and only once.

The browser never has the word during play, so there's nothing to peek at.
Visitors can read the leaderboard but can't read games or word lists, and they can't add, edit or delete scores directly.

What it can't stop: a script that plays honestly but very fast, such as a solver bot.
If one shows up, you can delete its rows in Supabase's **Table Editor**.

## 1. Create the project

1. Sign up at https://supabase.com and click **New project** (any name, e.g. `hardle`).
2. Wait for it to finish setting up.

## 2. Load the database

1. Open [`supabase/setup.sql`](supabase/setup.sql) in a text editor, select everything, and copy it.
   It's about 100 KB because it includes both word lists.
2. In Supabase, open **SQL Editor** in the left sidebar, paste, and click **Run**.

It's safe to run again if something goes wrong partway.

## 3. Connect the game

1. In Supabase, open **Project Settings → API Keys** and copy the **Publishable key** (`sb_publishable_…`).
   Don't use the **Secret key**: it must never go in the website.
2. Get your **Project URL**. Click the green **Connect** button at the top, or open **Project Settings → Data API**.
   It looks like `https://abcdefghijkl.supabase.co`.
3. In `hardle_js/`, create a file called `.env.local`:

   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. Restart `npm start`. The leaderboard no longer says "saved on this device".

`.env.local` is git-ignored, but `npm run deploy` builds on your machine, so the live site picks up the keys.
The publishable key is meant to be public, since it ships inside the website. The database rules above limit what it can do.

## Changing things later

- **Clue logic:** it lives in `src/lib/feedback.js` and `hardle_counts` in `supabase/schema.sql`. Change both, run `python3 supabase/build-setup.py`, and paste the new `setup.sql` into the SQL Editor.
- **Word lists:** edit the files in `src/`, run `python3 supabase/build-setup.py`, and paste the new `setup.sql` into the SQL Editor. New words are added; removed words stay in the database.
- **Scoring formula:** it lives in `src/lib/score.js` and in the `score` column in `supabase/schema.sql`. Change both.
  Re-running `setup.sql` won't update an existing table, so also run this in the SQL Editor, using your new formula. Every existing score is recalculated:

  ```sql
  alter table public.scores drop column score;
  alter table public.scores add column score int generated always as (
    (11 - guesses) * 100 + round(180000.0 / (300 + time_ms / 1000))::int
  ) stored;
  create index if not exists scores_score_idx on public.scores (score desc, time_ms asc);
  ```

Daily mode still runs in the browser and has no leaderboard, so it doesn't use Supabase.
