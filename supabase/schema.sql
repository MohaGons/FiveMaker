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

create policy "Players are managed by their owner"
  on public.players
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
