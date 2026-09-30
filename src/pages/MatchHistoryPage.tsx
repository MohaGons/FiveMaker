import { useState } from 'react';
import { EditMatchForm } from '../features/matches/components/EditMatchForm';
import { MatchCard } from '../features/matches/components/MatchCard';
import { MatchResultForm } from '../features/matches/components/MatchResultForm';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MatchUpdate } from '../features/matches/hooks/useMatches';
import type { Match } from '../features/matches/types';
import { ShareTeamsButtons } from '../features/teams/components/ShareTeamsButtons';
import { formatTeamsMessage } from '../features/teams/utils/shareMessage';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function MatchHistoryPage() {
  const { matches, isLoading, error, updateMatch, removeMatch } = useMatches();
  const [actionError, setActionError] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Le prochain match en premier ; les matchs passés restent du plus récent au plus ancien.
  const upcomingMatches = matches
    .filter((match) => match.status === 'scheduled')
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
  const pastMatches = matches.filter((match) => match.status !== 'scheduled');

  async function handleDelete(match: Match) {
    if (!window.confirm('Supprimer ce match de l\'historique ?')) return;

    setActionError(null);
    try {
      await removeMatch(match.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  async function handleCancel(match: Match) {
    if (!window.confirm('Annuler ce match ?')) return;

    setActionError(null);
    try {
      await updateMatch(match.id, { status: 'cancelled' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Annulation impossible.');
    }
  }

  function openEditForm(match: Match) {
    setActionError(null);
    setEditingMatch(match);
  }

  /** Enregistre la saisie du score ou la modification du match ouvert dans la modale. */
  async function handleSubmitUpdate(match: Match, update: MatchUpdate) {
    setIsSaving(true);
    setActionError(null);
    try {
      await updateMatch(match.id, update);
      setScoringMatch(null);
      setEditingMatch(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Matchs</h1>
        <p className="mt-2 text-muted-foreground">
          Tes prochains matchs, puis les compositions et les scores de tes matchs passés.
        </p>

        {actionError && !scoringMatch && !editingMatch && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        )}

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des matchs...</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              Aucun match pour l'instant. Équilibre des équipes puis enregistre ou programme le match
              pour le retrouver ici.
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {upcomingMatches.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-semibold text-foreground">À venir</h2>
                  <div className="flex flex-col gap-4">
                    {upcomingMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onEdit={openEditForm}
                        onDelete={handleDelete}
                        actions={
                          <>
                            <ShareTeamsButtons size="sm" getMessage={() => formatTeamsMessage(match.teams, match)} />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleCancel(match)}
                              className="rounded-full"
                            >
                              Annuler le match
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setScoringMatch(match);
                              }}
                              className="rounded-full"
                            >
                              Saisir le score
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-4 text-xl font-semibold text-foreground">Matchs passés</h2>
                {pastMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun match joué pour l'instant. Saisis le score d'un match à venir une fois
                    qu'il est terminé.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {pastMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onEdit={openEditForm}
                        onDelete={handleDelete}
                        actions={
                          match.status === 'completed' && (
                            <ShareTeamsButtons size="sm" getMessage={() => formatTeamsMessage(match.teams, match)} />
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <Dialog open={scoringMatch !== null} onOpenChange={(open) => !open && setScoringMatch(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Score du match</DialogTitle>
          </DialogHeader>
          {scoringMatch && (
            <MatchResultForm
              match={scoringMatch}
              isSubmitting={isSaving}
              onCancel={() => setScoringMatch(null)}
              onSubmit={(update) => handleSubmitUpdate(scoringMatch, update)}
            />
          )}
          {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={editingMatch !== null} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le match</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <EditMatchForm
              key={editingMatch.id}
              match={editingMatch}
              isSubmitting={isSaving}
              onCancel={() => setEditingMatch(null)}
              onSubmit={(update) => handleSubmitUpdate(editingMatch, update)}
            />
          )}
          {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
