-- Seed de test : une quinzaine de joueurs fictifs pour peupler public.players.
-- À exécuter dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor),
-- après avoir exécuté schema.sql.
--
-- Remplace target_user_id ci-dessous par l'UID du compte auquel rattacher ces joueurs
-- (Authentication > Users > colonne "UID"). Les joueurs vont dans le premier groupe créé par ce compte
-- (créé s'il n'en a pas). Le SQL Editor s'exécute avec des droits qui contournent la RLS.

do $$
declare
  target_user_id uuid := '1141d8ef-8c67-4a98-9f51-18102b53edfc'; -- <-- à remplacer
  target_group_id uuid;
begin
  select id into target_group_id from public.groups where owner_id = target_user_id order by created_at limit 1;

  if target_group_id is null then
    insert into public.groups (name, owner_id) values ('Mon five', target_user_id) returning id into target_group_id;
    insert into public.group_members (group_id, user_id, role, display_name)
    values (target_group_id, target_user_id, 'owner', (select email from auth.users where id = target_user_id));
    insert into public.group_invites (group_id) values (target_group_id);
  end if;

  insert into public.players (group_id, user_id, name, skill_level, preferred_position, is_guest)
  values
    (target_group_id, target_user_id, 'Karim Benali', 4, 'forward', false),
    (target_group_id, target_user_id, 'Lucas Moreau', 3, 'midfielder', false),
    (target_group_id, target_user_id, 'Yanis Haddad', 5, 'defender', false),
    (target_group_id, target_user_id, 'Thomas Girard', 2, 'defender', false),
    (target_group_id, target_user_id, 'Mehdi Ouarab', 3, 'forward', false),
    (target_group_id, target_user_id, 'Antoine Petit', 4, 'midfielder', false),
    (target_group_id, target_user_id, 'Bilal Chikh', 3, 'defender', false),
    (target_group_id, target_user_id, 'Nicolas Faure', 2, 'midfielder', false),
    (target_group_id, target_user_id, 'Rayan Boukhalfa', 5, 'forward', false),
    (target_group_id, target_user_id, 'Julien Marchand', 2, 'midfielder', false),
    (target_group_id, target_user_id, 'Sofiane Kaci', 4, 'defender', false),
    (target_group_id, target_user_id, 'Maxime Rousseau', 5, 'midfielder', false),
    (target_group_id, target_user_id, 'Amine Zeroual', 2, 'forward', false),
    (target_group_id, target_user_id, 'Hugo Lefevre', 3, 'defender', false),
    (target_group_id, target_user_id, 'Ismael Tounsi', 4, 'forward', false);
end $$;
