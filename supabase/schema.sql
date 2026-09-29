-- À exécuter dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor).

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  skill_level smallint not null check (skill_level between 1 and 5),
  preferred_position text not null check (
    preferred_position in ('goalkeeper', 'defender', 'midfielder', 'forward')
  ),
  is_guest boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

drop policy if exists "Players are managed by their owner" on public.players;
create policy "Players are managed by their owner"
  on public.players
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  played_at timestamptz not null default now(),
  location text,
  status text not null default 'completed' check (
    status in ('scheduled', 'completed', 'cancelled')
  ),
  score_team_a smallint,
  score_team_b smallint,
  -- Instantanés des compositions au moment du match (indépendants des joueurs actuels).
  team_a_name text not null default 'Équipe A',
  team_a_players jsonb not null default '[]'::jsonb,
  team_b_name text not null default 'Équipe B',
  team_b_players jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

drop policy if exists "Matches are managed by their owner" on public.matches;
create policy "Matches are managed by their owner"
  on public.matches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
