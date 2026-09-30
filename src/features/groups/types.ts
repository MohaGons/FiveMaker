import type { ID } from '../../shared/types/common';

/** owner : créateur (gère les membres) · admin : modifie les données · member : lecture seule. */
export type GroupRole = 'owner' | 'admin' | 'member';

/** Un groupe dont l'utilisateur connecté fait partie, avec son rôle dedans. */
export interface Group {
  id: ID;
  name: string;
  role: GroupRole;
}

export interface GroupMember {
  userId: ID;
  role: GroupRole;
  /** E-mail au moment de l'adhésion. */
  displayName: string;
  joinedAt: Date;
}

export interface InviteInfo {
  groupId: ID;
  groupName: string;
  memberCount: number;
  isMember: boolean;
}
