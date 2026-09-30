import { Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useGroups } from '../../../features/groups/hooks/useGroups';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/joueurs', label: 'Joueurs' },
  { to: '/equipes', label: 'Équipes' },
  { to: '/historique', label: 'Matchs' },
  { to: '/statistiques', label: 'Stats' },
  { to: '/groupe', label: 'Groupe' },
];

function BallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-primary">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8.2l3.1 2.25-1.2 3.65H10.1L8.9 10.45 12 8.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M12 8.2V4.5M15.1 10.45l3.5-1.2M13.9 14.1l2.2 3M8.9 10.45l-3.5-1.2M10.1 14.1l-2.2 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const location = useLocation();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { groups, currentGroup, selectGroup } = useGroups();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <BallIcon />
          Five<span className="text-primary">Maker</span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-8 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Sélecteur affiché seulement quand il y a un choix à faire. */}
          {session && currentGroup && groups.length > 1 && (
            <Select
              value={currentGroup.id}
              onValueChange={(value) => value && selectGroup(value as string)}
              items={groups.map((group) => ({ value: group.id, label: group.name }))}
            >
              <SelectTrigger size="sm" aria-label="Groupe affiché" className="max-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>

          {session ? (
            <Button type="button" variant="ghost" onClick={() => supabase.auth.signOut()}>
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
