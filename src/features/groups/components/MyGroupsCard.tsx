import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentGroup, useGroups } from '../hooks/useGroups';
import { CreateGroupForm } from './CreateGroupForm';
import { RoleBadge } from './RoleBadge';

/** Liste des groupes du compte, pour passer de l'un à l'autre ou en créer un nouveau. */
export function MyGroupsCard() {
  const { groups, selectGroup } = useGroups();
  const { group } = useCurrentGroup();

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground">Mes groupes</h2>
      <ul className="divide-y">
        {groups.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <p className="min-w-0 flex-1 truncate text-foreground">{item.name}</p>
            <RoleBadge role={item.role} />
            {item.id === group.id ? (
              <span className="w-20 text-center text-xs text-muted-foreground">Affiché</span>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => selectGroup(item.id)} className="w-20">
                Ouvrir
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="border-t pt-4">
        <CreateGroupForm />
      </div>
    </Card>
  );
}
