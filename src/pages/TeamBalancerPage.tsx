import { useState } from 'react';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { PlayerSelector } from '../features/teams/components/PlayerSelector';
import { TeamColumn } from '../features/teams/components/TeamColumn';
import type { Team } from '../features/teams/types';
import { balanceTeams } from '../features/teams/utils/balanceTeams';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import type { ID } from '../shared/types/common';

export function TeamBalancerPage() {
  const { players, isLoading, error } = usePlayers();
  // null = pas encore touché par l'utilisateur -> tous les joueurs chargés sont présents par défaut.
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<ID> | null>(null);
  const [teams, setTeams] = useState<[Team, Team] | null>(null);

  const selectedIds = customSelectedIds ?? new Set(players.map((player) => player.id));

  function toggleSelection(id: ID) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCustomSelectedIds(next);
  }

  function handleBalance() {
    const selectedPlayers = players.filter((player) => selectedIds.has(player.id));
    setTeams(balanceTeams(selectedPlayers));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Équilibrer les équipes</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Sélectionne les joueurs présents, puis génère deux équipes équilibrées.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div>
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
              Joueurs présents ({selectedIds.size})
            </h2>

            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des joueurs...</p>
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : players.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajoute des joueurs avant de pouvoir équilibrer les équipes.
              </p>
            ) : (
              <PlayerSelector players={players} selectedIds={selectedIds} onToggle={toggleSelection} />
            )}

            <button
              type="button"
              onClick={handleBalance}
              disabled={selectedIds.size < 2}
              className="mt-4 w-full rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Équilibrer les équipes
            </button>
          </div>

          <div>
            {teams ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <TeamColumn team={teams[0]} accent="purple" />
                <TeamColumn team={teams[1]} accent="orange" />
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Les équipes générées s'afficheront ici.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
