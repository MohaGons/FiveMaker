import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Player } from '../../players/types';
import type { GroupMember } from '../types';

/** Valeur du menu pour « aucune fiche » (les valeurs sont des identifiants de fiche). */
const NO_PLAYER = '';

interface PlayerLinkSelectProps {
  member: GroupMember;
  players: Player[];
  onChange: (playerId: string | null) => void;
}

/** Créateur : choisir la fiche joueur d'un membre, parmi les fiches libres (ou la sienne actuelle). */
export function PlayerLinkSelect({ member, players, onChange }: PlayerLinkSelectProps) {
  const current = players.find((player) => player.accountUserId === member.userId);
  const options = players.filter((player) => !player.accountUserId || player.accountUserId === member.userId);
  const items = [
    { value: NO_PLAYER, label: 'Aucune fiche' },
    ...options.map((player) => ({ value: player.id, label: player.name })),
  ];

  return (
    <Select
      value={current?.id ?? NO_PLAYER}
      onValueChange={(value) => onChange(value ? (value as string) : null)}
      items={items}
    >
      <SelectTrigger size="sm" aria-label={`Fiche joueur de ${member.displayName}`} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
