import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/joueurs', label: 'Joueurs' },
  { to: '/equipes', label: 'Équipes' },
  { to: '/historique', label: 'Historique' },
];

export function SiteHeader() {
  const location = useLocation();
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Five<span className="text-purple-600">Maker</span>
        </Link>

        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-8 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={
                    isActive
                      ? 'text-purple-600'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {session ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => supabase.auth.signOut()}
            >
              Se déconnecter
            </Button>
          ) : (
            <Button render={<Link to="/connexion" />} className="rounded-full">
              Se connecter
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
