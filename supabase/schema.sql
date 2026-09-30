-- À exécuter dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor).
-- Le script peut être relancé sans risque : il ne recrée que ce qui manque et migre les anciennes données.

-- =====================================================================================================
-- Groupes : les joueurs, matchs et compositions appartiennent à un groupe partagé entre plusieurs comptes.
-- Rôles : "owner" (créateur : gère les membres), "admin" (modifie les données), "member" (lecture seule).
-- =====================================================================================================

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 50),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  -- E-mail au moment de l'adhésion : auth.users n'est pas lisible depuis l'appli.
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Lien d'invitation : un jeton par groupe, régénérable pour invalider l'ancien lien.
create table if not exists public.group_invites (
  group_id uuid primary key references public.groups (id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  updated_at timestamptz not null default now()
);

-- Fonctions de droits utilisées par les policies. "security definer" : elles lisent group_members sans
-- repasser par ses propres policies (sinon récursion infinie).
create or replace function public.group_role(gid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.group_members where group_id = gid and user_id = auth.uid()
$$;

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.group_role(gid) is not null
$$;

create or replace function public.can_edit_group(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.group_role(gid) in ('owner', 'admin'), false)
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.group_role(gid) = 'owner', false)
$$;

-- =====================================================================================================
-- Joueurs
-- =====================================================================================================

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  -- Auteur de la fiche (informatif) : la supprimer avec son compte viderait le groupe.
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
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

alter table public.players add column if not exists group_id uuid references public.groups (id) on delete cascade;

-- =====================================================================================================
-- Matchs
-- =====================================================================================================

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
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

-- Colonnes ajoutées après coup : "add column" pour les bases existantes.
alter table public.matches add column if not exists group_id uuid references public.groups (id) on delete cascade;
-- Couleurs de maillot/chasuble (ex. "#16a34a").
alter table public.matches add column if not exists team_a_color text;
alter table public.matches add column if not exists team_b_color text;
-- Buts et passes décisives par joueur ({ "<id joueur>": { "goals": 2, "assists": 1 } }) et homme du match.
alter table public.matches add column if not exists player_stats jsonb not null default '{}'::jsonb;
alter table public.matches add column if not exists mvp_player_id text;

-- Anciennes bases : l'auteur était obligatoire et supprimé avec son compte.
alter table public.players alter column user_id drop not null;
alter table public.players drop constraint if exists players_user_id_fkey;
alter table public.players add constraint players_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;
alter table public.matches alter column user_id drop not null;
alter table public.matches drop constraint if exists matches_user_id_fkey;
alter table public.matches add constraint matches_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- =====================================================================================================
-- Composition en cours du prochain match (une par groupe) : joueurs confirmés au fil de l'eau
-- et conditions "ensemble" / "séparés".
-- =====================================================================================================

create table if not exists public.lineup_drafts (
  group_id uuid primary key references public.groups (id) on delete cascade,
  player_ids jsonb not null default '[]'::jsonb,
  pairing_constraints jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lineup_drafts add column if not exists group_id uuid references public.groups (id) on delete cascade;

-- =====================================================================================================
-- Migration : avant les groupes, chaque compte avait ses propres données. On crée pour chacun
-- un groupe "Mon five" dont il est le créateur, et on y range ses joueurs, matchs et composition.
-- =====================================================================================================

-- Anciennes policies "une personne = ses données" : à retirer avant la migration, car celle des
-- compositions dépend de la colonne user_id supprimée ci-dessous.
drop policy if exists "Players are managed by their owner" on public.players;
drop policy if exists "Matches are managed by their owner" on public.matches;
drop policy if exists "Lineup drafts are managed by their owner" on public.lineup_drafts;

do $$
declare
  legacy_owner record;
  gid uuid;
  has_legacy_drafts boolean;
begin
  has_legacy_drafts := exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lineup_drafts' and column_name = 'user_id'
  );

  for legacy_owner in
    select user_id from public.players where group_id is null and user_id is not null
    union
    select user_id from public.matches where group_id is null and user_id is not null
  loop
    select id into gid from public.groups where owner_id = legacy_owner.user_id order by created_at limit 1;

    if gid is null then
      insert into public.groups (name, owner_id) values ('Mon five', legacy_owner.user_id) returning id into gid;
      insert into public.group_members (group_id, user_id, role, display_name)
      values (gid, legacy_owner.user_id, 'owner', (select email from auth.users where id = legacy_owner.user_id));
      insert into public.group_invites (group_id) values (gid);
    end if;

    update public.players set group_id = gid where user_id = legacy_owner.user_id and group_id is null;
    update public.matches set group_id = gid where user_id = legacy_owner.user_id and group_id is null;
  end loop;

  -- Ancienne composition "une par compte" -> "une par groupe".
  if has_legacy_drafts then
    execute 'update public.lineup_drafts d set group_id = g.id
             from public.groups g where g.owner_id = d.user_id and d.group_id is null';
    execute 'delete from public.lineup_drafts where group_id is null';
    execute 'alter table public.lineup_drafts drop constraint if exists lineup_drafts_pkey';
    execute 'alter table public.lineup_drafts drop column user_id';
    execute 'alter table public.lineup_drafts add primary key (group_id)';
  end if;
end $$;

-- Données orphelines (sans auteur ni groupe) : impossibles à rattacher, donc invisibles de toute façon.
delete from public.players where group_id is null;
delete from public.matches where group_id is null;

alter table public.players alter column group_id set not null;
alter table public.matches alter column group_id set not null;

create index if not exists players_group_id_idx on public.players (group_id);
create index if not exists matches_group_id_idx on public.matches (group_id);

-- =====================================================================================================
-- Policies (RLS) : les membres lisent, le créateur et les admins écrivent.
-- =====================================================================================================

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.lineup_drafts enable row level security;

drop policy if exists "Groups are visible to their members" on public.groups;
create policy "Groups are visible to their members"
  on public.groups for select
  using (public.is_group_member(id));

drop policy if exists "Groups are renamed by their owner" on public.groups;
create policy "Groups are renamed by their owner"
  on public.groups for update
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

drop policy if exists "Groups are deleted by their owner" on public.groups;
create policy "Groups are deleted by their owner"
  on public.groups for delete
  using (public.is_group_owner(id));

drop policy if exists "Members see each other" on public.group_members;
create policy "Members see each other"
  on public.group_members for select
  using (public.is_group_member(group_id));

-- Le créateur nomme ou retire les admins, sans jamais toucher à son propre rôle.
drop policy if exists "Owner manages member roles" on public.group_members;
create policy "Owner manages member roles"
  on public.group_members for update
  using (public.is_group_owner(group_id) and role <> 'owner')
  with check (public.is_group_owner(group_id) and role in ('admin', 'member'));

-- Le créateur exclut n'importe qui sauf lui-même ; chacun peut quitter un groupe dont il n'est pas le créateur.
drop policy if exists "Members leave or are removed by the owner" on public.group_members;
create policy "Members leave or are removed by the owner"
  on public.group_members for delete
  using (role <> 'owner' and (public.is_group_owner(group_id) or user_id = auth.uid()));

drop policy if exists "Invites are visible to editors" on public.group_invites;
create policy "Invites are visible to editors"
  on public.group_invites for select
  using (public.can_edit_group(group_id));

drop policy if exists "Group members read players" on public.players;
create policy "Group members read players"
  on public.players for select
  using (public.is_group_member(group_id));

drop policy if exists "Group editors write players" on public.players;
create policy "Group editors write players"
  on public.players for all
  using (public.can_edit_group(group_id))
  with check (public.can_edit_group(group_id));

drop policy if exists "Group members read matches" on public.matches;
create policy "Group members read matches"
  on public.matches for select
  using (public.is_group_member(group_id));

drop policy if exists "Group editors write matches" on public.matches;
create policy "Group editors write matches"
  on public.matches for all
  using (public.can_edit_group(group_id))
  with check (public.can_edit_group(group_id));

drop policy if exists "Group members read lineup drafts" on public.lineup_drafts;
create policy "Group members read lineup drafts"
  on public.lineup_drafts for select
  using (public.is_group_member(group_id));

drop policy if exists "Group editors write lineup drafts" on public.lineup_drafts;
create policy "Group editors write lineup drafts"
  on public.lineup_drafts for all
  using (public.can_edit_group(group_id))
  with check (public.can_edit_group(group_id));

-- =====================================================================================================
-- Fonctions appelées par l'appli (créer, rejoindre, inviter). "security definer" : elles font ce que
-- les policies interdisent au client (ex. s'ajouter comme membre), après leurs propres vérifications.
-- =====================================================================================================

create or replace function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise.';
  end if;

  insert into public.groups (name, owner_id) values (trim(group_name), auth.uid()) returning id into gid;
  insert into public.group_members (group_id, user_id, role, display_name)
  values (gid, auth.uid(), 'owner', auth.jwt() ->> 'email');
  insert into public.group_invites (group_id) values (gid);
  return gid;
end;
$$;

-- Aperçu d'une invitation (nom du groupe) avant de la rejoindre. Accessible sans être connecté, pour que
-- la page d'invitation dise quel groupe on rejoint avant de créer un compte : il faut le jeton pour l'appeler.
create or replace function public.get_invite_info(invite_token text)
returns table (group_id uuid, group_name text, member_count bigint, is_member boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    (select count(*) from public.group_members m where m.group_id = g.id),
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid())
  from public.group_invites i
  join public.groups g on g.id = i.group_id
  where i.token = invite_token
$$;

create or replace function public.join_group(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise.';
  end if;

  select group_id into gid from public.group_invites where token = invite_token;
  if gid is null then
    raise exception 'Lien d''invitation invalide ou expiré.';
  end if;

  insert into public.group_members (group_id, user_id, role, display_name)
  values (gid, auth.uid(), 'member', auth.jwt() ->> 'email')
  on conflict (group_id, user_id) do nothing;
  return gid;
end;
$$;

-- Nouveau lien : l'ancien ne fonctionne plus (ex. après avoir exclu quelqu'un).
create or replace function public.regenerate_invite(gid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  if not public.can_edit_group(gid) then
    raise exception 'Seuls le créateur et les admins peuvent inviter.';
  end if;

  update public.group_invites
  set token = replace(gen_random_uuid()::text, '-', ''), updated_at = now()
  where group_id = gid
  returning token into new_token;
  return new_token;
end;
$$;

-- Réservées aux comptes connectés (par défaut, toute fonction est exécutable par "public", donc "anon"),
-- sauf l'aperçu d'invitation.
revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
revoke execute on function public.regenerate_invite(uuid) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.get_invite_info(text) to anon, authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;

-- =====================================================================================================
-- Fiche joueur de chaque compte : "c'est moi". Sert à savoir qui vote (et à ne pas se noter soi-même).
-- Une fiche par compte et par groupe, modifiable seulement via les fonctions ci-dessous : un admin qui
-- édite les fiches ne peut pas s'attribuer celle d'un autre.
-- =====================================================================================================

alter table public.players add column if not exists account_user_id uuid references auth.users (id) on delete set null;
create unique index if not exists players_account_per_group
  on public.players (group_id, account_user_id) where account_user_id is not null;

create or replace function public.guard_player_link()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT' and new.account_user_id is not null)
     or (tg_op = 'UPDATE' and new.account_user_id is distinct from old.account_user_id) then
    if coalesce(current_setting('app.allow_player_link', true), '') <> 'on' then
      raise exception 'Utilise « C''est moi » pour associer une fiche à un compte.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_player_link on public.players;
create trigger guard_player_link
  before insert or update on public.players
  for each row execute function public.guard_player_link();

-- "C'est moi" : relie le compte connecté à une fiche libre de son groupe (et libère l'ancienne).
create or replace function public.claim_player(pid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.players%rowtype;
begin
  select * into target from public.players where id = pid;
  if not found or not public.is_group_member(target.group_id) then
    raise exception 'Fiche introuvable.';
  end if;
  if target.account_user_id is not null and target.account_user_id <> auth.uid() then
    raise exception 'Cette fiche est déjà associée à un autre membre.';
  end if;

  perform set_config('app.allow_player_link', 'on', true);
  update public.players set account_user_id = null
  where group_id = target.group_id and account_user_id = auth.uid() and id <> pid;
  update public.players set account_user_id = auth.uid() where id = pid;
end;
$$;

-- "Ce n'est pas moi" : le compte connecté n'a plus de fiche dans ce groupe.
create or replace function public.release_player(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_player_link', 'on', true);
  update public.players set account_user_id = null where group_id = gid and account_user_id = auth.uid();
end;
$$;

-- Le créateur corrige les associations : relie une fiche à un membre (ou la libère avec uid = null).
create or replace function public.link_player(pid uuid, uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  select group_id into gid from public.players where id = pid;
  if gid is null or not public.is_group_owner(gid) then
    raise exception 'Seul le créateur du groupe peut associer les fiches des autres.';
  end if;
  if uid is not null and not exists (select 1 from public.group_members where group_id = gid and user_id = uid) then
    raise exception 'Ce compte ne fait pas partie du groupe.';
  end if;

  perform set_config('app.allow_player_link', 'on', true);
  if uid is not null then
    update public.players set account_user_id = null where group_id = gid and account_user_id = uid and id <> pid;
  end if;
  update public.players set account_user_id = uid where id = pid;
end;
$$;

-- Un membre qui quitte le groupe (ou en est exclu) libère sa fiche.
create or replace function public.release_player_on_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_player_link', 'on', true);
  update public.players set account_user_id = null where group_id = old.group_id and account_user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists release_player_on_leave on public.group_members;
create trigger release_player_on_leave
  after delete on public.group_members
  for each row execute function public.release_player_on_leave();

-- =====================================================================================================
-- Notes des joueurs après un match : chaque joueur présent (relié à un compte) note les autres de 1 à 5,
-- pendant 3 jours après la saisie du résultat. Les notes individuelles restent privées : on ne lit que
-- ses propres notes, et les moyennes n'apparaissent qu'à la clôture des votes.
-- =====================================================================================================

alter table public.matches add column if not exists ratings_close_at timestamptz;

-- Ouvre les votes quand un match passe en "joué" ; la date n'est jamais modifiable par l'appli.
create or replace function public.set_ratings_window()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.ratings_close_at := now() + interval '3 days';
  elsif tg_op = 'UPDATE' then
    new.ratings_close_at := old.ratings_close_at;
  else
    new.ratings_close_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_ratings_window on public.matches;
create trigger set_ratings_window
  before insert or update on public.matches
  for each row execute function public.set_ratings_window();

create table if not exists public.match_ratings (
  match_id uuid not null references public.matches (id) on delete cascade,
  rater_user_id uuid not null references auth.users (id) on delete cascade,
  rater_player_id uuid not null,
  ratee_player_id uuid not null,
  score smallint not null check (score between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (match_id, rater_user_id, ratee_player_id)
);

alter table public.match_ratings enable row level security;

-- Lecture de ses propres notes uniquement ; l'écriture passe par rate_players.
drop policy if exists "Raters read their own ratings" on public.match_ratings;
create policy "Raters read their own ratings"
  on public.match_ratings for select
  using (rater_user_id = auth.uid());

-- ratings : [{ "player_id": "...", "score": 1..5 }] ; un score null retire la note.
create or replace function public.rate_players(mid uuid, ratings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.matches%rowtype;
  my_player uuid;
  participants text[];
  rating record;
begin
  select * into target from public.matches where id = mid;
  if not found or not public.is_group_member(target.group_id) then
    raise exception 'Match introuvable.';
  end if;
  if target.status <> 'completed' or target.ratings_close_at is null or target.ratings_close_at < now() then
    raise exception 'Les votes sont fermés pour ce match.';
  end if;

  select id into my_player from public.players
  where group_id = target.group_id and account_user_id = auth.uid();
  if my_player is null then
    raise exception 'Indique quelle fiche joueur est la tienne pour pouvoir voter.';
  end if;

  participants := array(
    select player ->> 'id' from jsonb_array_elements(target.team_a_players || target.team_b_players) as player
  );
  if not (my_player::text = any (participants)) then
    raise exception 'Seuls les joueurs de ce match peuvent voter.';
  end if;

  for rating in select * from jsonb_to_recordset(ratings) as r (player_id uuid, score int) loop
    if rating.player_id = my_player then
      raise exception 'Tu ne peux pas te noter toi-même.';
    end if;
    if not (rating.player_id::text = any (participants)) then
      raise exception 'Ce joueur n''a pas joué ce match.';
    end if;

    if rating.score is null then
      delete from public.match_ratings
      where match_id = mid and rater_user_id = auth.uid() and ratee_player_id = rating.player_id;
    elsif rating.score between 1 and 5 then
      insert into public.match_ratings (match_id, rater_user_id, rater_player_id, ratee_player_id, score)
      values (mid, auth.uid(), my_player, rating.player_id, rating.score)
      on conflict (match_id, rater_user_id, ratee_player_id)
      do update set score = excluded.score, rater_player_id = excluded.rater_player_id, updated_at = now();
    else
      raise exception 'Les notes vont de 1 à 5.';
    end if;
  end loop;
end;
$$;

-- Moyennes par joueur et par match, uniquement pour les votes clos.
create or replace function public.get_rating_averages(gid uuid)
returns table (match_id uuid, player_id uuid, average numeric, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.match_id, r.ratee_player_id, avg(r.score), count(*)
  from public.match_ratings r
  join public.matches m on m.id = r.match_id
  where m.group_id = gid and public.is_group_member(gid) and m.ratings_close_at <= now()
  group by r.match_id, r.ratee_player_id
$$;

-- Nombre de votants des matchs dont les votes sont encore ouverts (sans rien dévoiler des notes).
create or replace function public.get_open_vote_counts(gid uuid)
returns table (match_id uuid, voters bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.match_id, count(distinct r.rater_user_id)
  from public.match_ratings r
  join public.matches m on m.id = r.match_id
  where m.group_id = gid and public.is_group_member(gid) and m.ratings_close_at > now()
  group by r.match_id
$$;

revoke execute on function public.claim_player(uuid) from public, anon;
revoke execute on function public.release_player(uuid) from public, anon;
revoke execute on function public.link_player(uuid, uuid) from public, anon;
revoke execute on function public.rate_players(uuid, jsonb) from public, anon;
revoke execute on function public.get_rating_averages(uuid) from public, anon;
revoke execute on function public.get_open_vote_counts(uuid) from public, anon;
grant execute on function public.claim_player(uuid) to authenticated;
grant execute on function public.release_player(uuid) to authenticated;
grant execute on function public.link_player(uuid, uuid) to authenticated;
grant execute on function public.rate_players(uuid, jsonb) to authenticated;
grant execute on function public.get_rating_averages(uuid) to authenticated;
grant execute on function public.get_open_vote_counts(uuid) to authenticated;

-- =====================================================================================================
-- Photos des joueurs : bucket public en lecture. On écrit dans "<id du groupe>/..." si on peut modifier
-- le groupe (ou dans "<id du compte>/...", l'emplacement des photos d'avant les groupes).
-- =====================================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.can_write_avatar_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select folder = auth.uid()::text
    or exists (
      select 1 from public.group_members
      where group_id::text = folder and user_id = auth.uid() and role in ('owner', 'admin')
    )
$$;

drop policy if exists "Avatars are uploaded by their owner" on storage.objects;
create policy "Avatars are uploaded by their owner"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and public.can_write_avatar_folder((storage.foldername(name))[1]));

drop policy if exists "Avatars are deleted by their owner" on storage.objects;
create policy "Avatars are deleted by their owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and public.can_write_avatar_folder((storage.foldername(name))[1]));

-- La suppression via l'API Storage exige aussi le droit de lecture sur l'objet.
drop policy if exists "Avatars are listed by their owner" on storage.objects;
create policy "Avatars are listed by their owner"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars' and public.can_write_avatar_folder((storage.foldername(name))[1]));
