-- Hardle shared Freestyle leaderboard.
--
-- Paste this whole file into Supabase's SQL Editor and click Run (once).
-- It's safe to run again: it skips anything that already exists.
--
-- How cheating is prevented:
--   * The database picks the word. The browser never sees it until the game ends.
--   * Every guess is checked and scored here, so clues can't be faked.
--   * The clock runs here: time = from start_game to the winning guess.
--   * Scores can only be written by claim_score, once, for a game solved here.
--   * Visitors can read the leaderboard but can't read games, words, or edit scores.

-- ---------- Tables ----------

create table if not exists public.answers (word text primary key);        -- possible secret words
create table if not exists public.allowed_words (word text primary key);  -- every valid guess

create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  word        text not null,
  started_at  timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  guesses     int not null default 0,
  solved      boolean not null default false,
  claimed     boolean not null default false
);
create index if not exists games_started_idx on public.games (started_at);

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  game_id    uuid unique references public.games (id) on delete set null,
  name       text not null check (name ~ '^[A-Z]{3}$'),
  word       text,                       -- the word they solved
  guesses    int  not null check (guesses between 1 and 10),
  time_ms    int  not null check (time_ms >= 0),
  -- Must match src/lib/score.js
  score      int  generated always as (
               (11 - guesses) * 100 + round(180000.0 / (300 + time_ms / 1000))::int
             ) stored,
  created_at timestamptz not null default now()
);
alter table public.scores add column if not exists word text;

create index if not exists scores_score_idx on public.scores (score desc, time_ms asc);
create index if not exists scores_speed_idx on public.scores (time_ms asc, guesses asc);

-- ---------- Access rules ----------

alter table public.answers       enable row level security;
alter table public.allowed_words enable row level security;
alter table public.games         enable row level security;
alter table public.scores        enable row level security;

revoke all on public.answers, public.allowed_words, public.games, public.scores from anon, authenticated;
grant select on public.scores to anon, authenticated;

drop policy if exists "Anyone can read scores" on public.scores;
create policy "Anyone can read scores" on public.scores for select to anon, authenticated using (true);

-- ---------- Game logic ----------

-- Clue for one guess. Must match src/lib/feedback.js.
create or replace function public.hardle_counts(guess text, answer text, out yellow int, out green int)
language plpgsql immutable
set search_path = public
as $$
declare
  i int;
  c text;
begin
  yellow := 0;
  green := 0;
  for i in 1..5 loop
    c := substr(guess, i, 1);
    if c = substr(answer, i, 1) then
      green := green + 1;
    elsif strpos(answer, c) > 0
      and (length(guess) - length(replace(guess, c, '')))
       <= (length(answer) - length(replace(answer, c, ''))) then
      yellow := yellow + 1;
    end if;
  end loop;
end;
$$;

-- Starts a game with a random word. Returns only the game id.
create or replace function public.start_game()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  -- Tidy up: forget games older than 2 days (saved scores are kept).
  delete from games where started_at < now() - interval '2 days';

  insert into games (word)
  select word from answers order by random() limit 1
  returning id into gid;

  if gid is null then
    raise exception 'No answer words loaded';
  end if;
  return gid;
end;
$$;

-- Checks one guess. Returns the clue counts; once the game ends it also returns
-- the word, whether it was solved, the guess count, and the official time.
create or replace function public.submit_guess(p_game uuid, p_guess text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  g games%rowtype;
  w text := lower(coalesce(p_guess, ''));
  y int;
  gr int;
  now_ts timestamptz := clock_timestamp();
  done boolean;
begin
  select * into g from games where id = p_game for update;
  if not found then
    raise exception 'Game not found';
  end if;
  if g.finished_at is not null then
    raise exception 'This game is already over';
  end if;
  if w !~ '^[a-z]{5}$' or not exists (select 1 from allowed_words where word = w) then
    raise exception 'Not a word. Try Again.';
  end if;

  select c.yellow, c.green into y, gr from hardle_counts(w, g.word) c;
  g.guesses := g.guesses + 1;
  done := (w = g.word) or g.guesses >= 10;

  update games
     set guesses = g.guesses,
         solved = (w = g.word),
         finished_at = case when done then now_ts end
   where id = p_game;

  if not done then
    return json_build_object('yellow', y, 'green', gr, 'finished', false);
  end if;

  return json_build_object(
    'yellow', y,
    'green', gr,
    'finished', true,
    'solved', w = g.word,
    'word', g.word,
    'guesses', g.guesses,
    'time_ms', floor(extract(epoch from (now_ts - g.started_at)) * 1000)::int
  );
end;
$$;

-- Puts a solved game on the leaderboard under 3-letter initials. Once per game.
create or replace function public.claim_score(p_game uuid, p_name text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  g games%rowtype;
  s scores%rowtype;
  n text := upper(coalesce(p_name, ''));
begin
  if n !~ '^[A-Z]{3}$' then
    raise exception 'Initials must be exactly 3 letters';
  end if;

  select * into g from games where id = p_game for update;
  if not found or not g.solved then
    raise exception 'No solved game to save';
  end if;
  if g.claimed then
    raise exception 'This score is already on the board';
  end if;

  update games set claimed = true where id = p_game;

  insert into scores (game_id, name, word, guesses, time_ms)
  values (p_game, n, g.word, g.guesses,
          floor(extract(epoch from (g.finished_at - g.started_at)) * 1000)::int)
  returning * into s;

  return row_to_json(s);
end;
$$;

-- ---------- Daily results & percentiles ----------
--
-- Every finished Daily is recorded (anonymously) so players can see how they
-- did compared with everyone else that day. Daily runs in the browser, so these
-- numbers are for fun, not a referee'd leaderboard.

-- Score formula shared with Freestyle. Must match src/lib/score.js.
create or replace function public.hardle_score(guesses int, time_ms int)
returns int
language sql immutable
as $$
  select (11 - guesses) * 100 + round(180000.0 / (300 + time_ms / 1000))::int
$$;

-- Today's Daily number (1 = November 6, 2026), using UTC.
create or replace function public.hardle_day()
returns int
language sql stable
as $$
  select (current_date - date '2026-11-06') + 1
$$;

create table if not exists public.daily_results (
  id         bigint generated always as identity primary key,
  day        int not null,
  solved     boolean not null,
  guesses    int not null check (guesses between 1 and 10),
  time_ms    int not null check (time_ms between 0 and 86400000),
  score      int generated always as (
               case when solved then public.hardle_score(guesses, time_ms) else 0 end
             ) stored,
  created_at timestamptz not null default now()
);
create index if not exists daily_results_day_idx on public.daily_results (day);

alter table public.daily_results enable row level security;
revoke all on public.daily_results from anon, authenticated;

-- How a result compares with everyone else's that day (excluding one row, so
-- you aren't compared with yourself). Each percentile is the share of other
-- players you did strictly better than. Unsolved games rank last.
create or replace function public.daily_percentiles(
  p_day int, p_solved boolean, p_guesses int, p_time_ms int, p_exclude bigint default null
)
returns json
language sql stable security definer
set search_path = public
as $$
  with me as (
    select
      case when p_solved then p_guesses else 11 end as g,
      case when p_solved then p_time_ms else 2147483647 end as t,
      case when p_solved then hardle_score(p_guesses, p_time_ms) else 0 end as sc
  ),
  others as (
    select
      case when solved then guesses else 11 end as g,
      case when solved then time_ms else 2147483647 end as t,
      score as sc
    from daily_results
    where day = p_day and id is distinct from p_exclude
  )
  select json_build_object(
    'players', (select count(*) from others) + 1,
    'guesses', (select case when count(*) = 0 then null
                  else round(100.0 * count(*) filter (where o.g > me.g) / count(*))::int end
                from others o, me),
    'time',    (select case when count(*) = 0 then null
                  else round(100.0 * count(*) filter (where o.t > me.t) / count(*))::int end
                from others o, me),
    'score',   (select case when count(*) = 0 then null
                  else round(100.0 * count(*) filter (where o.sc < me.sc) / count(*))::int end
                from others o, me),
    -- Players per number of guesses, you included: [1, 2, ..., 10, misses]
    'distribution', (select json_agg(x.c order by x.b) from (
                       select b, (select count(*) from others o where o.g = b)
                                 + case when me.g = b then 1 else 0 end as c
                       from generate_series(1, 11) b, me
                     ) x)
  )
$$;

-- Records a finished Daily and returns { id, players, guesses, time, score, distribution }.
create or replace function public.submit_daily(
  p_day int, p_solved boolean, p_guesses int, p_time_ms int
)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  rid bigint;
begin
  -- Allow a day either side for time zones.
  if p_day not between hardle_day() - 1 and hardle_day() + 1 then
    raise exception 'That Daily is not open';
  end if;
  insert into daily_results (day, solved, guesses, time_ms)
  values (p_day, p_solved, p_guesses, p_time_ms)
  returning id into rid;
  return (daily_percentiles(p_day, p_solved, p_guesses, p_time_ms, rid)::jsonb
          || jsonb_build_object('id', rid))::json;
end;
$$;

-- Only the game calls are open to visitors.
revoke all on function public.hardle_counts(text, text)  from public, anon, authenticated;
revoke all on function public.hardle_score(int, int)     from public, anon, authenticated;
revoke all on function public.hardle_day()               from public, anon, authenticated;
revoke all on function public.daily_percentiles(int, boolean, int, int, bigint) from public;
revoke all on function public.submit_daily(int, boolean, int, int)              from public;
grant execute on function public.daily_percentiles(int, boolean, int, int, bigint) to anon, authenticated;
grant execute on function public.submit_daily(int, boolean, int, int)              to anon, authenticated;
revoke all on function public.start_game()              from public;
revoke all on function public.submit_guess(uuid, text)  from public;
revoke all on function public.claim_score(uuid, text)   from public;
grant execute on function public.start_game()             to anon, authenticated;
grant execute on function public.submit_guess(uuid, text) to anon, authenticated;
grant execute on function public.claim_score(uuid, text)  to anon, authenticated;
