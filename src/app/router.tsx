import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { MatchHistoryPage } from '../pages/MatchHistoryPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlayerStatsPage } from '../pages/PlayerStatsPage';
import { PlayersPage } from '../pages/PlayersPage';
import { TeamBalancerPage } from '../pages/TeamBalancerPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/joueurs" element={<PlayersPage />} />
            <Route path="/equipes" element={<TeamBalancerPage />} />
            <Route path="/historique" element={<MatchHistoryPage />} />
            <Route path="/statistiques" element={<PlayerStatsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
