import { useState } from 'react';
import { PlayerCard } from '../features/players/components/PlayerCard';
import { PlayerForm } from '../features/players/components/PlayerForm';
import { usePlayers } from '../features/players/hooks/usePlayers';
import type { Player } from '../features/players/types';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Modal } from '../shared/components/ui/Modal';

export function PlayersPage() {
  const { players, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  function openAddForm() {
    setEditingPlayer(null);
    setIsFormOpen(true);
  }

  function openEditForm(player: Player) {
    setEditingPlayer(player);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function handleDelete(player: Player) {
    if (window.confirm(`Supprimer ${player.name} de la liste ?`)) {
      removePlayer(player.id);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Joueurs</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {players.length} joueur{players.length > 1 ? 's' : ''} dans ton groupe.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="shrink-0 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
          >
            + Ajouter un joueur
          </button>
        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
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

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}
      >
        <PlayerForm
          key={editingPlayer?.id ?? 'new'}
          initialPlayer={editingPlayer ?? undefined}
          onCancel={closeForm}
          onSubmit={(input) => {
            if (editingPlayer) {
              updatePlayer(editingPlayer.id, input);
            } else {
              addPlayer(input);
            }
            closeForm();
          }}
        />
      </Modal>
    </div>
  );
}
