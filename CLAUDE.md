# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FiveMaker : appli web (React 19 + TypeScript + Vite + Tailwind 4 + Supabase) pour former des équipes
équilibrées de five, suivre les matchs, buteurs, notes et l'évolution du niveau des joueurs.

## Commandes

```bash
npm run dev       # serveur de dev (http://localhost:5173)
npm run build     # tsc -b puis vite build : c'est la vérification de types du projet
npm run lint      # oxlint
npm test          # vitest run (npm run test:watch pour le mode watch)
npx vitest run src/features/teams/utils/balanceTeams.test.ts   # un seul fichier
npx vitest run -t "nom du test"                                 # un seul test
```

Les tests (Vitest) couvrent la logique métier pure dans `features/*/utils/`, placés à côté du fichier testé
(`*.test.ts`). Les fabriques de données (`makePlayer`, `makeMatch`, `makeConstraint`) sont dans
`src/test/factories.ts`. Pas de tests de composants ni d'appels Supabase. Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être
dans `.env` (voir `.env.example`), sinon `src/shared/lib/supabaseClient.ts` lève une erreur au démarrage.

## Conventions

- Tout le texte de l'interface, les commentaires et les routes (`/joueurs`, `/equipes`, `/historique`,
  `/statistiques`, `/groupe`, `/rejoindre/:token`) sont **en français**. Les identifiants de code sont en anglais.
- Pas de gardien fixe : tout le monde tourne dans les cages. Les postes sont uniquement défenseur, milieu,
  attaquant ; ne jamais ajouter de poste ou rôle « gardien ».
- `tsconfig` active `noUnusedLocals`, `noUnusedParameters` et `erasableSyntaxOnly` (pas d'`enum` ni de
  propriétés de paramètres de constructeur). Utiliser `import type` (`verbatimModuleSyntax`).
- Composants UI : shadcn/ui basé sur **Base UI** (pas Radix), dans `src/components/ui`, importés via
  l'alias `@/components/ui/...`. Le reste du code utilise des imports relatifs.

## Architecture

Code organisé par fonctionnalité dans `src/features/<feature>/` avec les sous-dossiers `api/`
(appels Supabase), `hooks/`, `components/`, `context/`, `utils/` (logique métier pure) et `types.ts`.
`src/pages/` assemble une page par route ; `src/app/` contient le routeur et les gardes.

### Flux de données
- Pas de librairie de cache (pas de React Query) : chaque hook (`usePlayers`, `useMatches`, `useLineupDraft`…)
  charge ses données dans un `useEffect` et garde l'état local, mis à jour après chaque écriture réussie.
- Les fichiers `api/*Api.ts` font le mapping entre lignes snake_case de Postgres et types camelCase
  (`toPlayer` / `toRow`). Toute nouvelle colonne doit être ajoutée à la liste des colonnes sélectionnées
  **et** aux deux fonctions de mapping.
- Providers imbriqués dans `src/app/router.tsx` : `AuthProvider` → `GroupProvider` → routes. Le groupe
  courant est mémorisé dans `localStorage` (`current-group-id`).
- `RequireGroup` rend `<Outlet key={currentGroup.id} />` : changer de groupe **remonte** toutes les pages,
  donc les hooks n'ont pas à gérer le changement de `groupId`. Ils lisent le groupe via `useCurrentGroup()`.
- Pages derrière `ProtectedRoute` / `RequireGroup` chargées en lazy (`React.lazy`).

### Logique métier (fonctions pures, calculées côté client)
- `features/teams/utils/teamSplits.ts` + `balanceTeams.ts` : énumère toutes les répartitions en deux équipes,
  minimise l'écart de niveau moyen, puis départage sur la répartition des postes ; les conditions
  « ensemble / contre » sont des contraintes dures. « Remélanger » tire parmi les répartitions quasi optimales.
- `features/teams/utils/planRecruits.ts` : profils (niveau, poste) conseillés pour les places libres.
- `features/matches/utils/playerLevels.ts` : niveau dynamique façon Elo, **recalculé à partir de tout
  l'historique des matchs** (rien n'est stocké en base). 1 niveau = 100 points, K = 20, borné entre 1 et 5.
- `features/matches/utils/matchRatings.ts` : homme du match = meilleure moyenne parmi les joueurs assez notés.
- `duoStats.ts`, `playerStats.ts` : statistiques des onglets.

### Base Supabase (`supabase/schema.sql`)
- Fichier unique **idempotent**, relancé tel quel par l'utilisateur dans le SQL Editor : pas de migrations.
  Toute évolution s'écrit en `create ... if not exists`, `alter table ... add column if not exists`,
  `create or replace function`, `drop policy if exists` + `create policy`, pour fonctionner sur une base
  neuve comme sur une base existante.
- Tables : `groups`, `group_members` (rôle `owner` / `admin` / `member`), `group_invites`, `players`,
  `matches`, `lineup_drafts` (une compo en cours par groupe), `match_ratings`, plus le bucket `avatars`.
- Les compositions d'un match sont des **instantanés JSONB** (`team_a_players`, `team_b_players`),
  indépendants des fiches joueurs actuelles ; buts et passes dans `player_stats` (jsonb indexé par id joueur).
- Les droits sont appliqués par la **RLS** via les helpers `group_role`, `is_group_member`, `can_edit_group`,
  `is_group_owner`. Les opérations sensibles passent par des fonctions RPC `security definer`
  (`create_group`, `join_group`, `regenerate_invite`, `claim_player`, `link_player`, `rate_players`,
  `get_rating_averages`…). Un nouveau droit doit être appliqué côté base, pas seulement masqué dans l'UI.
- Notation : fenêtre de 3 jours après le match, réservée aux joueurs du match ayant relié leur compte à
  leur fiche (`players.account_user_id`), pas d'auto-notation.
