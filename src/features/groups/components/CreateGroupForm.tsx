import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ID } from '../../../shared/types/common';
import { createGroup } from '../api/groupsApi';
import { useGroups } from '../hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateGroupFormProps {
  onCreated?: (groupId: ID) => void;
}

/** Crée un groupe dont l'utilisateur devient le créateur, puis l'affiche. */
export function CreateGroupForm({ onCreated }: CreateGroupFormProps) {
  const { refreshGroups, selectGroup } = useGroups();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const groupId = await createGroup(trimmedName);
      await refreshGroups();
      selectGroup(groupId);
      setName('');
      onCreated?.(groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="group-name">Nom du groupe</Label>
      <div className="flex gap-2">
        <Input
          id="group-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Five du jeudi"
          maxLength={50}
          required
        />
        <Button type="submit" disabled={isSubmitting || !name.trim()} className="shrink-0 rounded-full">
          {isSubmitting ? 'Création...' : 'Créer'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
