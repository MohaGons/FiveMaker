import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { EditMatchForm } from '../features/matches/components/EditMatchForm';
import { MatchCard } from '../features/matches/components/MatchCard';
import { MatchRatingForm } from '../features/matches/components/MatchRatingForm';
import { MatchResultForm } from '../features/matches/components/MatchResultForm';
import { useCurrentGroup } from '../features/groups/hooks/useGroups';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MatchUpdate } from '../features/matches/hooks/useMatches';
import type { Match } from '../features/matches/types';
import { areRatingsOpen, getMatchPlayerIds } from '../features/matches/utils/matchRatings';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { ShareTeamsButtons } from '../features/teams/components/ShareTeamsButtons';
import { formatTeamsMessage } from '../features/teams/utils/shareMessage';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function MatchHistoryPage() {
  const { matches, isLoading, error, updateMatch, removeMatch, rateMatch } = useMatches();
  const { myPlayer, isLoading: isLoadingPlayers } = usePlayers();
  const { canEdit } = useCurrentGroup();
  // Lecture seule pour les membres : pas de modification, d'annulation ni de suppression.
  const editHandlers = canEdit ? { onEdit: openEditForm, onDelete: handleDelete } : {};
  const [actionError, setActionError] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [ratingMatch, setRatingMatch] = useState<Match | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Le prochain match en premier ; les matchs passés restent du plus récent au plus ancien.
  const upcomingMatches = matches
    .filter((match) => match.status === 'scheduled')
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
  const pastMatches = matches.filter((match) => match.status !== 'scheduled');

  /** Le compte connecté peut noter ce match : votes ouverts et sa fiche fait partie des joueurs. */
  function canRate(match: Match): boolean {
    return areRatingsOpen(match) && myPlayer !== null && getMatchPlayerIds(match).includes(myPlayer.id);
  }
  // Des votes sont ouverts mais le compte n'a pas encore dit quelle fiche est la sienne.
  const needsPlayerLink = !isLoadingPlayers && myPlayer === null && matches.some((match) => areRatingsOpen(match));

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

        {needsPlayerLink && (
          <p className="mt-4 rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground">
            Des votes sont ouverts. Pour noter les joueurs des matchs auxquels tu as participé, indique
            d'abord quelle fiche est la tienne sur la page{' '}
            <Link to="/joueurs" className="font-medium text-primary underline-offset-4 hover:underline">
              Joueurs
            </Link>{' '}
            (« C'est moi »).
          </p>
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
                        {...editHandlers}
                        actions={
                          <>
                            <ShareTeamsButtons size="sm" getMessage={() => formatTeamsMessage(match.teams, match)} />
                            {canEdit && (
                              <>
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
                            )}
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
                        {...editHandlers}
                        actions={
                          match.status === 'completed' && (
                            <>
                              <ShareTeamsButtons size="sm" getMessage={() => formatTeamsMessage(match.teams, match)} />
                              {canRate(match) && (
                                <Button
                                  type="button"
                                  size="sm"
                                  // Déjà voté : bouton secondaire, pour montrer que c'est fait.
                                  variant={match.myRatingsCount > 0 ? 'outline' : 'default'}
                                  onClick={() => setRatingMatch(match)}
                                  className="rounded-full"
                                >
                                  {match.myRatingsCount > 0 ? <Check /> : <Star />}
                                  {match.myRatingsCount > 0 ? 'Modifier mes notes' : 'Noter les joueurs'}
                                </Button>
                              )}
                            </>
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

      <Dialog open={ratingMatch !== null} onOpenChange={(open) => !open && setRatingMatch(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Noter les joueurs</DialogTitle>
          </DialogHeader>
          {ratingMatch && myPlayer && (
            <MatchRatingForm
              key={ratingMatch.id}
              match={ratingMatch}
              myPlayerId={myPlayer.id}
              onCancel={() => setRatingMatch(null)}
              onSubmit={async (ratings) => {
                await rateMatch(ratingMatch.id, ratings);
                setRatingMatch(null);
              }}
            />
          )}
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
