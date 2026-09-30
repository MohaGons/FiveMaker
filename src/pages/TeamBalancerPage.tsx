import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { SaveMatchForm } from '../features/matches/components/SaveMatchForm';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MatchInput } from '../features/matches/hooks/useMatches';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { PairingConstraintsPanel } from '../features/teams/components/PairingConstraintsPanel';
import { PlayerSelector } from '../features/teams/components/PlayerSelector';
import { TeamColumn } from '../features/teams/components/TeamColumn';
import { usePairingConstraints } from '../features/teams/hooks/usePairingConstraints';
import { useTeamLabels } from '../features/teams/hooks/useTeamLabels';
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
  const { constraints, addConstraint, removeConstraint } = usePairingConstraints();
  const { labels, updateLabel, getTeamName } = useTeamLabels();
  // null = pas encore touché par l'utilisateur -> les premiers joueurs chargés (jusqu'à 10) sont présents par défaut.
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<ID> | null>(null);
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const selectedIds =
    customSelectedIds ?? new Set(players.slice(0, MAX_PLAYERS).map((player) => player.id));
  const isSelectionLimitReached = selectedIds.size >= MAX_PLAYERS;

  // Noms et couleurs choisis par l'utilisateur, conservés quand on remélange.
  const displayedTeams: [Team, Team] | null = teams && [
    { ...teams[0], name: getTeamName(0), color: labels[0].color },
    { ...teams[1], name: getTeamName(1), color: labels[1].color },
  ];

  function toggleSelection(id: ID) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < MAX_PLAYERS) {
      next.add(id);
    }
    setCustomSelectedIds(next);
  }

  function handleBalance(shuffle: boolean) {
    const selectedPlayers = players.filter((player) => selectedIds.has(player.id));
    const result = balanceTeams(selectedPlayers, constraints, {
      shuffle,
      exclude: shuffle ? (teams ?? undefined) : undefined,
    });

    setSaveSuccess(null);
    if (result.ok) {
      setTeams(result.teams);
      setBalanceError(null);
    } else {
      setBalanceError(result.reason);
      // Un remélange impossible laisse les équipes actuelles, qui restent valables.
      if (!shuffle) setTeams(null);
    }
  }

  async function handleSaveMatch(input: MatchInput) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await addMatch(input);
      setIsSaveFormOpen(false);
      setSaveSuccess(
        input.status === 'scheduled' ? 'Match programmé.' : "Match enregistré dans l'historique.",
      );
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
                <PairingConstraintsPanel
                  players={players}
                  selectedIds={selectedIds}
                  constraints={constraints}
                  onAdd={addConstraint}
                  onRemove={removeConstraint}
                />
              </>
            )}

            <Button
              type="button"
              onClick={() => handleBalance(false)}
              disabled={selectedIds.size < 2}
              size="lg"
              className="mt-4 w-full rounded-full"
            >
              Équilibrer les équipes
            </Button>
            {balanceError && !teams && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{balanceError}</p>
            )}
          </div>

          <div>
            {displayedTeams ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  {([0, 1] as const).map((index) => (
                    <TeamColumn
                      key={index}
                      team={displayedTeams[index]}
                      nameInput={labels[index].name}
                      onNameChange={(name) => updateLabel(index, { name })}
                      onColorChange={(color) => updateLabel(index, { color })}
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleBalance(true)}
                    className="rounded-full"
                  >
                    <Shuffle />
                    Remélanger
                  </Button>
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
                  {balanceError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{balanceError}</p>
                  )}
                  {saveSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">{saveSuccess}</p>
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

      {displayedTeams && (
        <Dialog open={isSaveFormOpen} onOpenChange={setIsSaveFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer ce match</DialogTitle>
            </DialogHeader>
            <SaveMatchForm
              teams={displayedTeams}
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
