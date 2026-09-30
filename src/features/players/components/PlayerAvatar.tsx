import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Photo du joueur, ou ses initiales à défaut. La taille se règle via className (h-12 w-12 par défaut). */
export function PlayerAvatar({ name, avatarUrl, className }: PlayerAvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={cn('h-12 w-12 shrink-0 rounded-full object-cover', className)} />;
  }

  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary',
        className,
      )}
    >
      {getInitials(name) || '?'}
    </div>
  );
}
