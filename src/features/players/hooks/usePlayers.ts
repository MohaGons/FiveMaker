import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { deletePlayerRow, fetchPlayers, insertPlayer, updatePlayerRow } from '../api/playersApi';
import type { Player } from '../types';

export type PlayerInput = Omit<Player, 'id'>;

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchPlayers()
      .then((data) => {
        if (isMounted) setPlayers(data);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function addPlayer(input: PlayerInput): Promise<void> {
    const player = await insertPlayer(input);
    setPlayers((current) => [...current, player]);
  }

  async function updatePlayer(id: ID, input: PlayerInput): Promise<void> {
    const player = await updatePlayerRow(id, input);
    setPlayers((current) => current.map((existing) => (existing.id === id ? player : existing)));
  }

  async function removePlayer(id: ID): Promise<void> {
    await deletePlayerRow(id);
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  return { players, isLoading, error, addPlayer, updatePlayer, removePlayer };
}
