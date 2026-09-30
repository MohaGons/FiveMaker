import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { GroupProvider } from '../features/groups/context/GroupProvider';
import { GroupPage } from '../pages/GroupPage';
import { HomePage } from '../pages/HomePage';
import { JoinGroupPage } from '../pages/JoinGroupPage';
import { LoginPage } from '../pages/LoginPage';
import { MatchHistoryPage } from '../pages/MatchHistoryPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlayerStatsPage } from '../pages/PlayerStatsPage';
import { PlayersPage } from '../pages/PlayersPage';
import { TeamBalancerPage } from '../pages/TeamBalancerPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireGroup } from './RequireGroup';

export function AppRouter() {
  return (
    <AuthProvider>
      <GroupProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </GroupProvider>
    </AuthProvider>
  );
}
