import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { PlayerCard } from '../features/players/components/PlayerCard';
import { useCurrentGroup } from '../features/groups/hooks/useGroups';
import { PlayerForm } from '../features/players/components/PlayerForm';
import { usePlayers } from '../features/players/hooks/usePlayers';
import type { Player } from '../features/players/types';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PlayersPage() {
  const { players, myPlayer, isLoading, error, addPlayer, updatePlayer, removePlayer, claimMyPlayer, releaseMyPlayer } =
    usePlayers();
  const { canEdit } = useCurrentGroup();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openAddForm() {
    setEditingPlayer(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(player: Player) {
    setEditingPlayer(player);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  async function handleDelete(player: Player) {
    if (!window.confirm(`Supprimer ${player.name} de la liste ?`)) return;

    setActionError(null);
    try {
      await removePlayer(player.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  async function handleClaim(player: Player) {
    setActionError(null);
    try {
      await claimMyPlayer(player.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Association impossible.');
    }
  }

  async function handleRelease() {
    if (!window.confirm("Ce n'est pas ta fiche ? Tu pourras en choisir une autre.")) return;
    setActionError(null);
    try {
      await releaseMyPlayer();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Opération impossible.');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Joueurs</h1>
            <p className="mt-2 text-muted-foreground">
              {players.length} joueur{players.length > 1 ? 's' : ''} dans ton groupe.
              {!canEdit && ' Seuls le créateur et les admins peuvent les modifier.'}
            </p>
          </div>
          {canEdit && (
            <Button type="button" onClick={openAddForm} size="lg" className="shrink-0 rounded-full">
              + Ajouter un joueur
            </Button>
          )}
        </div>

        {actionError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        )}

        {!isLoading && !error && players.length > 0 && !myPlayer && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium">Quelle fiche est la tienne ?</span> Clique sur « C'est moi » sur ta
              fiche pour pouvoir noter les joueurs après les matchs. Pas de fiche à ton nom ? Demande au créateur
              du groupe ou à un admin de la créer.
            </p>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des joueurs...</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            {canEdit
              ? 'Aucun joueur pour l\'instant. Ajoute ton premier joueur pour commencer.'
              : 'Aucun joueur pour l\'instant.'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onEdit={canEdit ? openEditForm : undefined}
                onDelete={canEdit ? handleDelete : undefined}
                isMe={player.id === myPlayer?.id}
                footerAction={
                  player.id === myPlayer?.id ? (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRelease}>
                      Ce n'est pas moi
                    </Button>
                  ) : !myPlayer && !player.accountUserId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleClaim(player)}
                      className="rounded-full"
                    >
                      C'est moi
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}</DialogTitle>
          </DialogHeader>
          <PlayerForm
            key={editingPlayer?.id ?? 'new'}
            initialPlayer={editingPlayer ?? undefined}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
            onSubmit={async (details, avatar) => {
              setIsSubmitting(true);
              setFormError(null);
              try {
                if (editingPlayer) {
                  await updatePlayer(editingPlayer.id, details, avatar);
                } else {
                  await addPlayer(details, avatar);
                }
                closeForm();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Enregistrement impossible.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
