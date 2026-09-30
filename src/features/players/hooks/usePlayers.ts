import { useEffect, useState } from 'react';
import type { ID } from '../../../shared/types/common';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCurrentGroup } from '../../groups/hooks/useGroups';
import { deleteAvatar, uploadAvatar } from '../api/avatarsApi';
import {
  claimPlayer,
  deletePlayerRow,
  fetchPlayers,
  insertPlayer,
  linkPlayer,
  releasePlayer,
  updatePlayerRow,
} from '../api/playersApi';
import type { Player } from '../types';

export type PlayerInput = Omit<Player, 'id'>;

/** Champs saisis dans le formulaire ; la photo passe par AvatarChange. */
export type PlayerDetails = Omit<PlayerInput, 'avatarUrl'>;

export type AvatarChange = { type: 'keep' } | { type: 'replace'; file: File } | { type: 'remove' };

/** Nettoyage d'une photo qui n'est plus utilisée : un échec laisse juste un fichier orphelin. */
function discardAvatar(url: string | undefined): void {
  if (url) deleteAvatar(url).catch(() => {});
}

/** Joueurs du groupe courant (la page est remontée quand on change de groupe). */
export function usePlayers() {
  const groupId = useCurrentGroup().group.id;
  const userId = useAuth().session?.user.id ?? null;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchPlayers(groupId)
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
  }, [groupId]);

  async function addPlayer(details: PlayerDetails, avatar: AvatarChange = { type: 'keep' }): Promise<void> {
    const avatarUrl = avatar.type === 'replace' ? await uploadAvatar(groupId, avatar.file) : undefined;
    try {
      const player = await insertPlayer(groupId, { ...details, avatarUrl });
      setPlayers((current) => [...current, player]);
    } catch (err) {
      discardAvatar(avatarUrl);
      throw err;
    }
  }

  async function updatePlayer(id: ID, details: PlayerDetails, avatar: AvatarChange = { type: 'keep' }): Promise<void> {
    const previousUrl = players.find((player) => player.id === id)?.avatarUrl;
    const avatarUrl =
      avatar.type === 'replace'
        ? await uploadAvatar(groupId, avatar.file)
        : avatar.type === 'remove'
          ? undefined
          : previousUrl;

    let player: Player;
    try {
      player = await updatePlayerRow(id, { ...details, avatarUrl });
    } catch (err) {
      if (avatarUrl !== previousUrl) discardAvatar(avatarUrl);
      throw err;
    }

    setPlayers((current) => current.map((existing) => (existing.id === id ? player : existing)));
    if (avatarUrl !== previousUrl) discardAvatar(previousUrl);
  }

  async function removePlayer(id: ID): Promise<void> {
    const avatarUrl = players.find((player) => player.id === id)?.avatarUrl;
    await deletePlayerRow(id);
    setPlayers((current) => current.filter((player) => player.id !== id));
    discardAvatar(avatarUrl);
  }

  /** Relie `accountId` à `playerId` (ou libère la fiche si null), en retirant son ancienne fiche. */
  function applyLink(playerId: ID | null, accountId: ID | null) {
    setPlayers((current) =>
      current.map((player) => {
        if (player.id === playerId) return { ...player, accountUserId: accountId ?? undefined };
        if (accountId && player.accountUserId === accountId) return { ...player, accountUserId: undefined };
        return player;
      }),
    );
  }

  /** "C'est moi". */
  async function claimMyPlayer(playerId: ID): Promise<void> {
    await claimPlayer(playerId);
    applyLink(playerId, userId);
  }

  /** "Ce n'est pas moi". */
  async function releaseMyPlayer(): Promise<void> {
    await releasePlayer(groupId);
    applyLink(null, userId);
  }

  /** Créateur : associe une fiche à un membre, ou la libère. */
  async function linkPlayerToMember(playerId: ID, memberId: ID | null): Promise<void> {
    const previousOwner = players.find((player) => player.id === playerId)?.accountUserId ?? null;
    await linkPlayer(playerId, memberId);
    if (memberId) applyLink(playerId, memberId);
    else if (previousOwner) applyLink(null, previousOwner);
  }

  /** Un membre a quitté le groupe : la base a libéré sa fiche, on fait de même à l'écran. */
  function forgetMemberLink(memberId: ID): void {
    applyLink(null, memberId);
  }

  /** Fiche du compte connecté dans ce groupe. */
  const myPlayer = players.find((player) => userId !== null && player.accountUserId === userId) ?? null;

  return {
    players,
    myPlayer,
    isLoading,
    error,
    addPlayer,
    updatePlayer,
    removePlayer,
    claimMyPlayer,
    releaseMyPlayer,
    linkPlayerToMember,
    forgetMemberLink,
  };
}
