import { useState } from 'react';
import { MatchCard } from '../features/matches/components/MatchCard';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { Match } from '../features/matches/types';
import { SiteHeader } from '../shared/components/layout/SiteHeader';

export function MatchHistoryPage() {
  const { matches, isLoading, error, removeMatch } = useMatches();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(match: Match) {
    if (!window.confirm('Supprimer ce match de l\'historique ?')) return;

    setDeleteError(null);
    try {
      await removeMatch(match.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Historique des matchs</h1>
        <p className="mt-2 text-muted-foreground">
          Retrouve les compositions et les scores de tes matchs passés.
        </p>

        {deleteError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        )}

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des matchs...</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              Aucun match enregistré pour l'instant. Équilibre des équipes puis enregistre le match
              pour le retrouver ici.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
