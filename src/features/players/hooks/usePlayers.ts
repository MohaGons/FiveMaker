import { useState } from 'react';
import type { ID } from '../../../shared/types/common';
import type { Player } from '../types';

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Karim Haddad', skillLevel: 5, preferredPosition: 'forward', isGuest: false },
  { id: '2', name: 'Yanis Bouzid', skillLevel: 3, preferredPosition: 'goalkeeper', isGuest: false },
  { id: '3', name: 'Thomas Renard', skillLevel: 2, preferredPosition: 'defender', isGuest: true },
  { id: '4', name: 'Sofiane Amrani', skillLevel: 4, preferredPosition: 'midfielder', isGuest: false },
  { id: '5', name: 'Lucas Petit', skillLevel: 3, preferredPosition: 'defender', isGuest: false },
  { id: '6', name: 'Nordine Cherif', skillLevel: 4, preferredPosition: 'forward', isGuest: true },
];

export type PlayerInput = Omit<Player, 'id'>;

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  function addPlayer(input: PlayerInput): void {
    const player: Player = { ...input, id: crypto.randomUUID() };
    setPlayers((current) => [...current, player]);
  }

  function updatePlayer(id: ID, input: PlayerInput): void {
    setPlayers((current) =>
      current.map((player) => (player.id === id ? { ...input, id } : player)),
    );
  }

  function removePlayer(id: ID): void {
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  return { players, addPlayer, updatePlayer, removePlayer };
}
