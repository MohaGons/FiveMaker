import { Check, CloudOff, Loader2 } from 'lucide-react';
import type { DraftSaveStatus } from '../hooks/useLineupDraft';

export function DraftSaveIndicator({ status }: { status: DraftSaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement...
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3" /> Enregistré
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <CloudOff className="h-3 w-3" /> Non enregistré
      </span>
    );
  }
  return null;
}
