import { Link2 } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { CreateGroupForm } from '../features/groups/components/CreateGroupForm';
import { useGroups } from '../features/groups/hooks/useGroups';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Card } from '@/components/ui/card';

function FullPageMessage({ children }: { children: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

/** Pages de données : il faut appartenir à un groupe. Sinon, on propose d'en créer un ou d'en rejoindre un. */
export function RequireGroup() {
  const { currentGroup, isLoading, error } = useGroups();

  if (isLoading) return <FullPageMessage>Chargement...</FullPageMessage>;

  if (error) {
    return (
      <FullPageMessage>{`Impossible de charger tes groupes (${error}). As-tu relancé supabase/schema.sql ?`}</FullPageMessage>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bienvenue sur FiveMaker</h1>
            <p className="mt-2 text-muted-foreground">
              Les joueurs, les matchs et les stats sont partagés au sein d'un groupe. Crée le tien ou rejoins
              celui de tes potes.
            </p>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold text-foreground">Créer un groupe</h2>
            <p className="-mt-2 text-sm text-muted-foreground">
              Tu en seras le créateur : tu pourras inviter des membres et leur donner des droits.
            </p>
            <CreateGroupForm />
          </Card>

          <Card className="flex-row items-start gap-3 p-5">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="font-semibold text-foreground">Rejoindre un groupe</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Demande le lien d'invitation au créateur du groupe (ou à un admin) et ouvre-le : tu rejoindras
                le groupe en un clic.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Remonter les pages au changement de groupe : leurs données sont rechargées depuis zéro.
  return <Outlet key={currentGroup.id} />;
}
