import { useState } from 'react';
import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { LevelChart } from '../features/matches/components/LevelChart';
import { PlayerPodium } from '../features/matches/components/PlayerPodium';
import { useMatches } from '../features/matches/hooks/useMatches';
import { MIN_MATCHES_TOGETHER, computeDuoStats } from '../features/matches/utils/duoStats';
import { computePlayerLevels } from '../features/matches/utils/playerLevels';
import { computePlayerStats, rankScorers } from '../features/matches/utils/playerStats';
import type { MatchResult } from '../features/matches/utils/playerStats';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import type { ID } from '../shared/types/common';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type StatsTab = 'ranking' | 'scorers' | 'duos' | 'levels';

const TABS: { value: StatsTab; label: string }[] = [
  { value: 'ranking', label: 'Classement' },
  { value: 'scorers', label: 'Buteurs' },
  { value: 'duos', label: 'Duos' },
  { value: 'levels', label: 'Évolution' },
];

/** La lettre porte le résultat ; la couleur ne fait que le souligner. */
const RESULT_BADGES: Record<MatchResult, { letter: string; label: string; className: string }> = {
  win: { letter: 'V', label: 'Victoire', className: 'bg-green-600 text-white' },
  draw: { letter: 'N', label: 'Nul', className: 'bg-muted text-muted-foreground' },
  loss: { letter: 'D', label: 'Défaite', className: 'bg-red-600 text-white' },
};

function FormBadges({ form }: { form: MatchResult[] }) {
  if (form.length === 0) return <span className="text-muted-foreground">–</span>;

  return (
    <div className="flex justify-center gap-0.5" aria-label={`Forme : ${form.map((r) => RESULT_BADGES[r].label).join(', ')}`}>
      {form.map((result, index) => (
        <span
          key={index}
          title={RESULT_BADGES[result].label}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
            RESULT_BADGES[result].className,
          )}
        >
          {RESULT_BADGES[result].letter}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">{children}</div>
  );
}

export function PlayerStatsPage() {
  const { matches, isLoading: isLoadingMatches, error: matchesError } = useMatches();
  const { players, isLoading: isLoadingPlayers, error: playersError } = usePlayers();
  const [tab, setTab] = useState<StatsTab>('ranking');
  const [chartPlayerId, setChartPlayerId] = useState<ID | null>(null);

  const isLoading = isLoadingMatches || isLoadingPlayers;
  const error = matchesError ?? playersError;

  const stats = computePlayerStats(matches);
  const scorers = rankScorers(stats);
  const duos = computeDuoStats(matches).slice(0, 10);
  const levels = computePlayerLevels(matches, players);

  // Joueurs ayant au moins un match avec score, les plus actifs en premier.
  const chartPlayers = players
    .filter((player) => (levels.get(player.id)?.ratedMatches ?? 0) > 0)
    .sort((a, b) => levels.get(b.id)!.ratedMatches - levels.get(a.id)!.ratedMatches);
  const selectedChartPlayer = chartPlayers.find((player) => player.id === chartPlayerId) ?? chartPlayers[0];
  const selectedLevel = selectedChartPlayer ? levels.get(selectedChartPlayer.id) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Statistiques des joueurs</h1>
        <p className="mt-2 text-muted-foreground">Calculées à partir des matchs joués.</p>

        <div role="tablist" aria-label="Statistiques" className="mt-6 grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={tab === option.value}
              onClick={() => setTab(option.value)}
              className={cn(
                'rounded-full px-2 py-1.5 text-sm font-medium transition-colors',
                tab === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-8" role="tabpanel">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des statistiques...</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : stats.length === 0 ? (
            <EmptyState>
              Aucune statistique pour l'instant. Enregistre des matchs avec un score pour les voir apparaître ici.
            </EmptyState>
          ) : tab === 'ranking' ? (
            <>
              <PlayerPodium top3={stats.slice(0, 3)} />

              <Table className="mt-10">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead className="text-center">Matchs</TableHead>
                    <TableHead className="text-center">V</TableHead>
                    <TableHead className="text-center">N</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">Forme</TableHead>
                    <TableHead className="text-center" title="Plus longue série de victoires">
                      Série
                    </TableHead>
                    <TableHead className="text-right">% victoires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {stats.map((player, index) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{player.name}</TableCell>
                      <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center">{player.wins}</TableCell>
                      <TableCell className="text-center">{player.draws}</TableCell>
                      <TableCell className="text-center">{player.losses}</TableCell>
                      <TableCell>
                        <FormBadges form={player.form} />
                      </TableCell>
                      <TableCell className="text-center">{player.bestWinStreak}</TableCell>
                      <TableCell className="text-right">
                        {player.wins + player.draws + player.losses > 0 ? (
                          <Badge variant={player.winRate >= 0.5 ? 'default' : 'secondary'}>
                            {Math.round(player.winRate * 100)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : tab === 'scorers' ? (
            scorers.length === 0 ? (
              <EmptyState>
                Aucun but enregistré. Renseigne les buteurs en saisissant le score d'un match, ou en le
                modifiant depuis la page Matchs.
              </EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead className="text-center">Buts</TableHead>
                    <TableHead className="text-center">Passes</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> Homme du match
                      </span>
                    </TableHead>
                    <TableHead className="text-right" title="Buts par match joué">
                      Buts / match
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {scorers.map((player, index) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{player.name}</TableCell>
                      <TableCell className="text-center font-semibold">{player.goals}</TableCell>
                      <TableCell className="text-center">{player.assists}</TableCell>
                      <TableCell className="text-center">{player.mvpCount}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(player.goals / player.matchesPlayed).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : tab === 'duos' ? (
            duos.length === 0 ? (
              <EmptyState>
                Pas encore de duo : il faut qu'au moins deux joueurs aient joué {MIN_MATCHES_TOGETHER} matchs
                avec score dans la même équipe.
              </EmptyState>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Les paires de coéquipiers qui gagnent le plus ensemble (au moins {MIN_MATCHES_TOGETHER} matchs
                  dans la même équipe).
                </p>
                <div className="flex flex-col gap-3">
                  {duos.map((duo, index) => (
                    <Card key={duo.playerIds.join('|')} className="flex-row items-center gap-4 px-4 py-3">
                      <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                      <p className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {duo.names[0]} <span className="text-muted-foreground">&</span> {duo.names[1]}
                      </p>
                      <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {duo.wins}/{duo.matchesTogether} victoires
                      </p>
                      <Badge variant={duo.winRate >= 0.5 ? 'default' : 'secondary'} className="tabular-nums">
                        {Math.round(duo.winRate * 100)}%
                      </Badge>
                    </Card>
                  ))}
                </div>
              </>
            )
          ) : !selectedChartPlayer || !selectedLevel ? (
            <EmptyState>Aucun match avec score pour tracer l'évolution des niveaux.</EmptyState>
          ) : (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">Évolution du niveau</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Niveau ajusté après chaque match avec score, en partant du niveau de la fiche (
                    {selectedLevel.baseLevel}).
                  </p>
                </div>
                <Select
                  value={selectedChartPlayer.id}
                  onValueChange={(value) => setChartPlayerId(value as ID)}
                  items={chartPlayers.map((player) => ({ value: player.id, label: player.name }))}
                >
                  <SelectTrigger aria-label="Joueur" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <LevelChart history={selectedLevel.history} baseLevel={selectedLevel.baseLevel} />
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
