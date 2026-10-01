import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { GroupProvider } from '../features/groups/context/GroupProvider';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireGroup } from './RequireGroup';

// Pages chargées à la demande : l'accueil et la connexion n'embarquent pas l'équilibrage, les stats, etc.
const GroupPage = lazy(() => import('../pages/GroupPage').then((m) => ({ default: m.GroupPage })));
const JoinGroupPage = lazy(() => import('../pages/JoinGroupPage').then((m) => ({ default: m.JoinGroupPage })));
const MatchHistoryPage = lazy(() =>
  import('../pages/MatchHistoryPage').then((m) => ({ default: m.MatchHistoryPage })),
);
const PlayerStatsPage = lazy(() => import('../pages/PlayerStatsPage').then((m) => ({ default: m.PlayerStatsPage })));
const PlayersPage = lazy(() => import('../pages/PlayersPage').then((m) => ({ default: m.PlayersPage })));
const TeamBalancerPage = lazy(() =>
  import('../pages/TeamBalancerPage').then((m) => ({ default: m.TeamBalancerPage })),
);

export function AppRouter() {
  return (
    <AuthProvider>
      <GroupProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/connexion" element={<LoginPage />} />
              {/* Publique : un invité non connecté voit quel groupe il rejoint avant de se connecter. */}
              <Route path="/rejoindre/:token" element={<JoinGroupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<RequireGroup />}>
                  <Route path="/joueurs" element={<PlayersPage />} />
                  <Route path="/equipes" element={<TeamBalancerPage />} />
                  <Route path="/historique" element={<MatchHistoryPage />} />
                  <Route path="/statistiques" element={<PlayerStatsPage />} />
                  <Route path="/groupe" element={<GroupPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GroupProvider>
    </AuthProvider>
  );
}
