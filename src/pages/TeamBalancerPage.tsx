import { useState } from 'react';
import { Check, CloudOff, Loader2, Shuffle, TriangleAlert } from 'lucide-react';
import { SaveMatchForm } from '../features/matches/components/SaveMatchForm';
import { useMatches } from '../features/matches/hooks/useMatches';
import type { MatchInput } from '../features/matches/hooks/useMatches';
import { computePlayerLevels } from '../features/matches/utils/playerLevels';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { PairingConstraintsPanel } from '../features/teams/components/PairingConstraintsPanel';
import { PlayerSelector } from '../features/teams/components/PlayerSelector';
import { ProvisionalLineup } from '../features/teams/components/ProvisionalLineup';
import { ShareTeamsButtons } from '../features/teams/components/ShareTeamsButtons';
import { TeamsBoard } from '../features/teams/components/TeamsBoard';
import { useLineupDraft } from '../features/teams/hooks/useLineupDraft';
import type { DraftSaveStatus } from '../features/teams/hooks/useLineupDraft';
import { useTeamLabels } from '../features/teams/hooks/useTeamLabels';
import type { Team } from '../features/teams/types';
import { balanceTeams, findViolatedConstraints } from '../features/teams/utils/balanceTeams';
import type { GetLevel } from '../features/teams/utils/balanceTeams';
import { planRecruits } from '../features/teams/utils/planRecruits';
import { formatTeamsMessage } from '../features/teams/utils/shareMessage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import type { ID } from '../shared/types/common';

/** Un five oppose deux équipes de 5 joueurs maximum. */
const MAX_PLAYERS = 10;

function DraftSaveIndicator({ status }: { status: DraftSaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement...
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3" /> Enregistré
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <CloudOff className="h-3 w-3" /> Non enregistré
      </span>
    );
  }
  return null;
}

export function TeamBalancerPage() {
  const { players, isLoading: isLoadingPlayers, error } = usePlayers();
  const { matches, addMatch } = useMatches();
  const draft = useLineupDraft();
  const { constraints, addConstraint, removeConstraint } = draft;
  const { labels, updateLabel, getTeamName } = useTeamLabels();
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [useAdjustedLevels, setUseAdjustedLevels] = useState(true);
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isLoading = isLoadingPlayers || draft.isLoading;
  // Un joueur supprimé depuis peut encore figurer dans le brouillon : on ne garde que les joueurs existants.
  const selectedPlayers = players.filter((player) => draft.selectedIds.has(player.id));
  const selectedIds = new Set(selectedPlayers.map((player) => player.id));
  const isSelectionLimitReached = selectedIds.size >= MAX_PLAYERS;

  const playerLevels = computePlayerLevels(matches, players);
  const ratedMatchCount = matches.filter((match) => match.status === 'completed' && match.score).length;
  // Sans match avec score, le niveau ajusté est identique à celui de la fiche : inutile de proposer l'option.
  const getLevel: GetLevel | undefined =
    useAdjustedLevels && ratedMatchCount > 0
      ? (player) => playerLevels.get(player.id)?.level ?? player.skillLevel
      : undefined;

  const levelOf = getLevel ?? ((player) => player.skillLevel);
  // Niveau habituel du groupe : là où l'on recrute les joueurs manquants.
  const referenceLevel =
    players.length > 0 ? players.reduce((sum, player) => sum + levelOf(player), 0) / players.length : 3;
  const recruitPlan =
    !teams && selectedPlayers.length > 0 && selectedPlayers.length < MAX_PLAYERS
      ? planRecruits(selectedPlayers, constraints, referenceLevel, getLevel)
      : null;

  const playersById = new Map(players.map((player) => [player.id, player]));
  const violatedConstraints = teams ? findViolatedConstraints(teams, constraints) : [];

  // Noms et couleurs choisis par l'utilisateur, conservés quand on remélange.
  const displayedTeams: [Team, Team] | null = teams && [
    { ...teams[0], name: getTeamName(0), color: labels[0].color },
    { ...teams[1], name: getTeamName(1), color: labels[1].color },
  ];

  // Les équipes générées ne correspondent plus à la sélection : on revient à la composition provisoire.
  function resetGeneratedTeams() {
    setTeams(null);
    setBalanceError(null);
    setSaveSuccess(null);
  }

  function toggleSelection(id: ID) {
    draft.togglePlayer(id, MAX_PLAYERS);
    resetGeneratedTeams();
  }

  function handleClearSelection() {
    if (!window.confirm('Retirer tous les joueurs de la composition ? Les conditions sont conservées.')) return;
    draft.clearPlayers();
    resetGeneratedTeams();
  }

  function handleBalance(shuffle: boolean) {
    const result = balanceTeams(selectedPlayers, constraints, {
      shuffle,
      exclude: shuffle ? (teams ?? undefined) : undefined,
      getLevel,
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

  function handleTeamsChange(next: [Team, Team]) {
    setTeams(next);
    setBalanceError(null);
    setSaveSuccess(null);
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
          Coche les joueurs au fur et à mesure qu'ils confirment : la composition est enregistrée, et l'appli te
          dit quels profils recruter pour les places restantes.
        </p>
        {draft.loadError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            La composition ne peut pas être enregistrée ({draft.loadError}). As-tu relancé supabase/schema.sql ?
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">
                Joueurs présents ({selectedIds.size}/{MAX_PLAYERS})
              </h2>
              <div className="flex items-center gap-2">
                <DraftSaveIndicator status={draft.saveStatus} />
                {selectedIds.size > 0 && (
                  <Button type="button" variant="ghost" size="xs" onClick={handleClearSelection}>
                    Vider
                  </Button>
                )}
              </div>
            </div>

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
                  getLevel={getLevel}
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
                {ratedMatchCount > 0 && (
                  <Label className="mt-6 flex items-start gap-2 text-sm font-normal">
                    <Checkbox
                      checked={useAdjustedLevels}
                      onCheckedChange={(checked) => setUseAdjustedLevels(checked === true)}
                      className="mt-0.5"
                    />
                    <span>
                      Ajuster les niveaux selon les résultats
                      <span className="block text-xs text-muted-foreground">
                        Calculé à partir de {ratedMatchCount} match{ratedMatchCount > 1 ? 's' : ''} avec score.
                      </span>
                    </span>
                  </Label>
                )}
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
            {selectedIds.size > 0 && selectedIds.size < MAX_PLAYERS && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Tu peux déjà équilibrer, ou attendre que les {MAX_PLAYERS} joueurs soient là.
              </p>
            )}
            {balanceError && !teams && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{balanceError}</p>
            )}
          </div>

          <div>
            {displayedTeams ? (
              <>
                <TeamsBoard
                  teams={displayedTeams}
                  labels={labels}
                  getLevel={getLevel}
                  onTeamsChange={handleTeamsChange}
                  onLabelChange={updateLabel}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Glisse un joueur vers l'autre équipe pour le déplacer, ou sur un joueur pour les échanger
                  (appui long sur mobile).
                </p>

                {violatedConstraints.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <ul>
                      {violatedConstraints.map((constraint) => {
                        const [a, b] = constraint.playerIds.map((id) => playersById.get(id)?.name);
                        return (
                          <li key={constraint.id}>
                            Condition non respectée : {a} {constraint.rule === 'together' ? 'avec' : 'contre'} {b}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

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
                  <ShareTeamsButtons getMessage={() => formatTeamsMessage(displayedTeams)} />
                  {balanceError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{balanceError}</p>
                  )}
                  {saveSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">{saveSuccess}</p>
                  )}
                </div>
              </>
            ) : recruitPlan ? (
              recruitPlan.ok ? (
                <ProvisionalLineup
                  plan={recruitPlan.plan}
                  teamNames={[getTeamName(0), getTeamName(1)]}
                  teamColors={[labels[0].color, labels[1].color]}
                  getLevel={getLevel}
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed p-12 text-center text-sm text-red-600 dark:text-red-400">
                  {recruitPlan.reason}
                </div>
              )
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                {selectedIds.size === MAX_PLAYERS
                  ? 'Tout le monde est là ! Clique sur « Équilibrer les équipes ».'
                  : 'Coche les joueurs qui ont confirmé : les équipes provisoires et les profils à recruter s\'afficheront ici.'}
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
