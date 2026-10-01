import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Player } from '../../players/types';
import type { GroupMember } from '../types';
import { PlayerLinkSelect } from './PlayerLinkSelect';
import { RoleBadge } from './RoleBadge';

const JOINED_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

interface MemberListProps {
  members: GroupMember[];
  players: Player[];
  isLoading: boolean;
  currentUserId?: string;
  /** Seul le créateur gère les rôles, les exclusions et les fiches joueurs. */
  isOwner: boolean;
  onToggleAdmin: (member: GroupMember) => void;
  onRemove: (member: GroupMember) => void;
  onLinkPlayer: (member: GroupMember, playerId: string | null) => void;
}

export function MemberList({
  members,
  players,
  isLoading,
  currentUserId,
  isOwner,
  onToggleAdmin,
  onRemove,
  onLinkPlayer,
}: MemberListProps) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground">
        Membres {!isLoading && <span className="font-normal text-muted-foreground">({members.length})</span>}
      </h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des membres...</p>
      ) : (
        <ul className="divide-y">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canManage = isOwner && member.role !== 'owner';

            return (
              <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {member.displayName}
                    {isSelf && <span className="font-normal text-muted-foreground"> (toi)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Membre depuis le {JOINED_FORMATTER.format(member.joinedAt)}
                    {!isOwner &&
                      ` · Fiche : ${players.find((player) => player.accountUserId === member.userId)?.name ?? 'aucune'}`}
                  </p>
                </div>
                {isOwner && (
                  <PlayerLinkSelect
                    member={member}
                    players={players}
                    onChange={(playerId) => onLinkPlayer(member, playerId)}
                  />
                )}
                <RoleBadge role={member.role} />
                {canManage && (
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => onToggleAdmin(member)}>
                      {member.role === 'admin' ? 'Retirer admin' : 'Nommer admin'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(member)}
                      aria-label={`Exclure ${member.displayName}`}
                      title="Exclure du groupe"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <UserMinus />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
