-- Seed de test : une quinzaine de joueurs fictifs pour peupler public.players.
-- À exécuter dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor),
-- après avoir exécuté schema.sql.
--
-- Remplace target_user_id ci-dessous par l'UID du compte auquel rattacher ces joueurs
-- (Authentication > Users > colonne "UID"). Le SQL Editor s'exécute avec des droits
-- qui contournent la RLS, donc l'insertion fonctionne même si ce n'est pas ton propre uid.

do $$
declare
  target_user_id uuid := '1141d8ef-8c67-4a98-9f51-18102b53edfc'; -- <-- à remplacer
begin
  insert into public.players (user_id, name, skill_level, preferred_position, is_guest)
  values
    (target_user_id, 'Karim Benali', 4, 'forward', false),
    (target_user_id, 'Lucas Moreau', 3, 'midfielder', false),
    (target_user_id, 'Yanis Haddad', 5, 'defender', false),
    (target_user_id, 'Thomas Girard', 2, 'defender', false),
    (target_user_id, 'Mehdi Ouarab', 3, 'forward', false),
    (target_user_id, 'Antoine Petit', 4, 'midfielder', false),
    (target_user_id, 'Bilal Chikh', 3, 'defender', false),
    (target_user_id, 'Nicolas Faure', 2, 'midfielder', false),
    (target_user_id, 'Rayan Boukhalfa', 5, 'forward', false),
    (target_user_id, 'Julien Marchand', 2, 'midfielder', false),
    (target_user_id, 'Sofiane Kaci', 4, 'defender', false),
    (target_user_id, 'Maxime Rousseau', 5, 'midfielder', false),
    (target_user_id, 'Amine Zeroual', 2, 'forward', false),
    (target_user_id, 'Hugo Lefevre', 3, 'defender', false),
    (target_user_id, 'Ismael Tounsi', 4, 'forward', false);
end $$;
