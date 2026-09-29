import { computePlayerStats } from '../features/matches/utils/playerStats';
import { useMatches } from '../features/matches/hooks/useMatches';
import { PlayerPodium } from '../features/matches/components/PlayerPodium';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function PlayerStatsPage() {
  const { matches, isLoading, error } = useMatches();
  const stats = computePlayerStats(matches);
  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Statistiques des joueurs</h1>
        <p className="mt-2 text-muted-foreground">
          Victoires, défaites et matchs nuls calculés à partir des matchs enregistrés avec un score.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des statistiques...</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : stats.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              Aucune statistique pour l'instant. Enregistre des matchs avec un score pour les voir
              apparaître ici.
            </div>
          ) : (
            <>
              <PlayerPodium top3={top3} />

              {rest.length > 0 && (
                <Table className="mt-10">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Joueur</TableHead>
                      <TableHead className="text-center">Matchs</TableHead>
                      <TableHead className="text-center">V</TableHead>
                      <TableHead className="text-center">N</TableHead>
                      <TableHead className="text-center">D</TableHead>
                      <TableHead className="text-right">% victoires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rest.map((player, index) => (
                      <TableRow key={player.playerId}>
                        <TableCell className="text-center text-muted-foreground">{index + 4}</TableCell>
                        <TableCell className="font-medium text-foreground">{player.name}</TableCell>
                        <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                        <TableCell className="text-center">{player.wins}</TableCell>
                        <TableCell className="text-center">{player.draws}</TableCell>
                        <TableCell className="text-center">{player.losses}</TableCell>
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
