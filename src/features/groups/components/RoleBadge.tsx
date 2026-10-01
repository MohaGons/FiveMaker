import { Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { GroupRole } from '../types';

const ROLE_LABELS: Record<GroupRole, string> = { owner: 'Créateur', admin: 'Admin', member: 'Membre' };

export function RoleBadge({ role }: { role: GroupRole }) {
  const Icon = role === 'owner' ? Crown : role === 'admin' ? Shield : null;
  return (
    <Badge variant={role === 'member' ? 'secondary' : 'default'}>
      {Icon && <Icon data-icon="inline-start" />}
      {ROLE_LABELS[role]}
    </Badge>
  );
}
