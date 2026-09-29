import { useState } from 'react';
import { PlayerCard } from '../features/players/components/PlayerCard';
import { PlayerForm } from '../features/players/components/PlayerForm';
import { usePlayers } from '../features/players/hooks/usePlayers';
import type { Player } from '../features/players/types';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PlayersPage() {
  const { players, isLoading, error, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

    setDeleteError(null);
    try {
      await removePlayer(player.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Joueurs</h1>
            <p className="mt-2 text-muted-foreground">
              {players.length} joueur{players.length > 1 ? 's' : ''} dans ton groupe.
            </p>
          </div>
          <Button type="button" onClick={openAddForm} size="lg" className="shrink-0 rounded-full">
            + Ajouter un joueur
          </Button>
        </div>

        {deleteError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des joueurs...</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            Aucun joueur pour l'instant. Ajoute ton premier joueur pour commencer.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onEdit={openEditForm}
                onDelete={handleDelete}
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
            onSubmit={async (input) => {
              setIsSubmitting(true);
              setFormError(null);
              try {
                if (editingPlayer) {
                  await updatePlayer(editingPlayer.id, input);
                } else {
                  await addPlayer(input);
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
