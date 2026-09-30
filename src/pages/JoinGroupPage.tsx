import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { fetchInviteInfo, joinGroup } from '../features/groups/api/groupsApi';
import { useGroups } from '../features/groups/hooks/useGroups';
import type { InviteInfo } from '../features/groups/types';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type InviteState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'error'; message: string }
  | { status: 'ready'; info: InviteInfo };

export function JoinGroupPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { refreshGroups, selectGroup } = useGroups();
  const [invite, setInvite] = useState<InviteState>({ status: 'loading' });
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchInviteInfo(token)
      .then((info) => {
        if (isMounted) setInvite(info ? { status: 'ready', info } : { status: 'invalid' });
      })
      .catch((err: Error) => {
        if (isMounted) setInvite({ status: 'error', message: err.message });
      });

    return () => {
      isMounted = false;
    };
    // "Déjà membre" dépend du compte : on recharge après connexion.
  }, [token, userId]);

  /** Vers la connexion, avec retour ici ensuite et le nom du groupe rappelé. */
  function goToLogin(signUp: boolean, groupName: string) {
    navigate('/connexion', {
      state: { from: `/rejoindre/${token}`, signUp, inviteGroupName: groupName },
    });
  }

  async function openGroup(groupId: string) {
    await refreshGroups();
    selectGroup(groupId);
    navigate('/joueurs');
  }

  async function handleJoin() {
    setIsJoining(true);
    setJoinError(null);
    try {
      await openGroup(await joinGroup(token));
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Impossible de rejoindre le groupe.');
      setIsJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        {invite.status === 'loading' || isAuthLoading ? (
          <p className="text-sm text-muted-foreground">Chargement de l'invitation...</p>
        ) : invite.status === 'invalid' ? (
          <Card className="p-6">
            <h1 className="text-xl font-bold text-foreground">Lien invalide</h1>
            <p className="text-sm text-muted-foreground">
              Ce lien d'invitation n'existe pas ou a été remplacé. Demande un nouveau lien au créateur du groupe.
            </p>
            <Button render={<Link to="/" />} variant="outline" className="self-start rounded-full">
              Retour à l'accueil
            </Button>
          </Card>
        ) : invite.status === 'error' ? (
          <p className="text-sm text-red-600 dark:text-red-400">{invite.message}</p>
        ) : (
          <Card className="items-center p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tu es invité à rejoindre</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">{invite.info.groupName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {invite.info.memberCount} membre{invite.info.memberCount > 1 ? 's' : ''}
              </p>
            </div>

            {!session ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Pour rejoindre ce groupe, connecte-toi ou crée un compte : tu reviendras ensuite sur cette page.
                </p>
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Button size="lg" onClick={() => goToLogin(true, invite.info.groupName)} className="flex-1 rounded-full">
                    Créer un compte
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => goToLogin(false, invite.info.groupName)}
                    className="flex-1 rounded-full"
                  >
                    Se connecter
                  </Button>
                </div>
              </>
            ) : invite.info.isMember ? (
              <>
                <p className="text-sm text-muted-foreground">Tu fais déjà partie de ce groupe.</p>
                <Button onClick={() => openGroup(invite.info.groupId)} className="rounded-full">
                  Ouvrir le groupe
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Tu verras ses joueurs, ses matchs et ses stats. Le créateur du groupe pourra te donner le droit
                  de les modifier.
                </p>
                <Button onClick={handleJoin} disabled={isJoining} size="lg" className="rounded-full">
                  {isJoining ? 'Connexion au groupe...' : 'Rejoindre le groupe'}
                </Button>
              </>
            )}
            {joinError && <p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>}
          </Card>
        )}
      </main>
    </div>
  );
}
