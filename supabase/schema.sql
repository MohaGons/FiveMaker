-- À exécuter dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor).

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  skill_level smallint not null check (skill_level between 1 and 5),
  preferred_position text not null check (
    preferred_position in ('defender', 'midfielder', 'forward')
  ),
  is_guest boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Pas de gardien fixe en five : tout le monde passe dans les cages.
-- Migration des bases créées avec l'ancien poste "goalkeeper".
update public.players set preferred_position = 'defender' where preferred_position = 'goalkeeper';
alter table public.players drop constraint if exists players_preferred_position_check;
alter table public.players add constraint players_preferred_position_check check (
  preferred_position in ('defender', 'midfielder', 'forward')
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

-- Couleurs de maillot/chasuble (ex. "#16a34a"), ajoutées après coup : "add column" pour les bases existantes.
alter table public.matches add column if not exists team_a_color text;
alter table public.matches add column if not exists team_b_color text;

alter table public.matches enable row level security;

drop policy if exists "Matches are managed by their owner" on public.matches;
create policy "Matches are managed by their owner"
  on public.matches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Photos des joueurs : bucket public en lecture, chaque utilisateur n'écrit que dans son dossier "<uid>/...".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Avatars are uploaded by their owner" on storage.objects;
create policy "Avatars are uploaded by their owner"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatars are deleted by their owner" on storage.objects;
create policy "Avatars are deleted by their owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- La suppression via l'API Storage exige aussi le droit de lecture sur l'objet.
drop policy if exists "Avatars are listed by their owner" on storage.objects;
create policy "Avatars are listed by their owner"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
