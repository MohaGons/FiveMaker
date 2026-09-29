import { useState } from 'react';
import { SaveMatchForm } from '../features/matches/components/SaveMatchForm';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MatchInput } from '../features/matches/hooks/useMatches';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { PlayerSelector } from '../features/teams/components/PlayerSelector';
import { TeamColumn } from '../features/teams/components/TeamColumn';
import type { Team } from '../features/teams/types';
import { balanceTeams } from '../features/teams/utils/balanceTeams';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import type { ID } from '../shared/types/common';

/** Un five oppose deux équipes de 5 joueurs maximum. */
const MAX_PLAYERS = 10;

export function TeamBalancerPage() {
  const { players, isLoading, error } = usePlayers();
  const { addMatch } = useMatches();
  // null = pas encore touché par l'utilisateur -> les premiers joueurs chargés (jusqu'à 10) sont présents par défaut.
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<ID> | null>(null);
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedIds =
    customSelectedIds ?? new Set(players.slice(0, MAX_PLAYERS).map((player) => player.id));
  const isSelectionLimitReached = selectedIds.size >= MAX_PLAYERS;

  function toggleSelection(id: ID) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < MAX_PLAYERS) {
      next.add(id);
    }
    setCustomSelectedIds(next);
  }

  function handleBalance() {
    const selectedPlayers = players.filter((player) => selectedIds.has(player.id));
    setTeams(balanceTeams(selectedPlayers));
    setSaveSuccess(false);
  }

  async function handleSaveMatch(input: MatchInput) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await addMatch(input);
      setIsSaveFormOpen(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Équilibrer les équipes</h1>
        <p className="mt-2 text-muted-foreground">
          Sélectionne les joueurs présents, puis génère deux équipes équilibrées.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div>
            <h2 className="mb-3 font-semibold text-foreground">
              Joueurs présents ({selectedIds.size}/{MAX_PLAYERS})
            </h2>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des joueurs...</p>
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : players.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ajoute des joueurs avant de pouvoir équilibrer les équipes.
              </p>
            ) : (
              <>
                <PlayerSelector
                  players={players}
                  selectedIds={selectedIds}
                  onToggle={toggleSelection}
                  selectionLimitReached={isSelectionLimitReached}
                />
                {isSelectionLimitReached && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Maximum atteint pour un five (10 joueurs, 2 équipes de 5).
                  </p>
                )}
              </>
            )}

            <Button
              type="button"
              onClick={handleBalance}
              disabled={selectedIds.size < 2}
              size="lg"
              className="mt-4 w-full rounded-full"
            >
              Équilibrer les équipes
            </Button>
          </div>

          <div>
            {teams ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <TeamColumn team={teams[0]} accent="green" />
                  <TeamColumn team={teams[1]} accent="orange" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSaveError(null);
                      setIsSaveFormOpen(true);
                    }}
                    className="rounded-full"
                  >
                    Enregistrer ce match
                  </Button>
                  {saveSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Match enregistré dans l'historique.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                Les équipes générées s'afficheront ici.
              </div>
            )}
          </div>
        </div>
      </main>

      {teams && (
        <Dialog open={isSaveFormOpen} onOpenChange={setIsSaveFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer ce match</DialogTitle>
            </DialogHeader>
            <SaveMatchForm
              teams={teams}
              isSubmitting={isSaving}
              onCancel={() => setIsSaveFormOpen(false)}
              onSubmit={handleSaveMatch}
            />
            {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
