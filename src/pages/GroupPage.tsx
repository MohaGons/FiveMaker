import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  deleteGroup,
  fetchInviteToken,
  fetchMembers,
  getInviteUrl,
  leaveGroup,
  regenerateInviteToken,
  removeMember,
  renameGroup,
  updateMemberRole,
} from '../features/groups/api/groupsApi';
import { InviteLinkCard } from '../features/groups/components/InviteLinkCard';
import { MemberList } from '../features/groups/components/MemberList';
import { MyGroupsCard } from '../features/groups/components/MyGroupsCard';
import { RoleBadge } from '../features/groups/components/RoleBadge';
import { useCurrentGroup, useGroups } from '../features/groups/hooks/useGroups';
import type { GroupMember } from '../features/groups/types';
import { usePlayers } from '../features/players/hooks/usePlayers';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function GroupPage() {
  const { session } = useAuth();
  const { refreshGroups } = useGroups();
  const { group, canEdit, isOwner } = useCurrentGroup();
  const { players, linkPlayerToMember, forgetMemberLink } = usePlayers();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [groupName, setGroupName] = useState(group.name);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentUserId = session?.user.id;
  const inviteUrl = inviteToken ? getInviteUrl(inviteToken) : null;

  useEffect(() => {
    let isMounted = true;

    fetchMembers(group.id)
      .then((data) => {
        if (isMounted) setMembers(data);
      })
      .catch((err: Error) => {
        if (isMounted) setActionError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMembers(false);
      });

    // Le lien n'est lisible que par le créateur et les admins.
    if (canEdit) {
      fetchInviteToken(group.id)
        .then((token) => {
          if (isMounted) setInviteToken(token);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [group.id, canEdit]);

  /** Exécute une action et affiche son erreur éventuelle. */
  async function run(action: () => Promise<void>, fallback: string) {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(errorMessage(err, fallback));
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    if (!name || name === group.name) return;
    await run(async () => {
      await renameGroup(group.id, name);
      await refreshGroups();
    }, 'Renommage impossible.');
  }

  async function handleRegenerateInvite() {
    if (!window.confirm("Créer un nouveau lien ? L'ancien ne fonctionnera plus.")) return;
    await run(async () => setInviteToken(await regenerateInviteToken(group.id)), 'Impossible de créer un lien.');
  }

  async function handleToggleAdmin(member: GroupMember) {
    const role = member.role === 'admin' ? 'member' : 'admin';
    await run(async () => {
      await updateMemberRole(group.id, member.userId, role);
      setMembers((current) => current.map((m) => (m.userId === member.userId ? { ...m, role } : m)));
    }, 'Changement de rôle impossible.');
  }

  async function handleLinkPlayer(member: GroupMember, playerId: string | null) {
    await run(async () => {
      if (playerId) {
        await linkPlayerToMember(playerId, member.userId);
      } else {
        const current = players.find((player) => player.accountUserId === member.userId);
        if (current) await linkPlayerToMember(current.id, null);
      }
    }, 'Association impossible.');
  }

  async function handleRemove(member: GroupMember) {
    if (!window.confirm(`Exclure ${member.displayName} du groupe ?`)) return;
    await run(async () => {
      await removeMember(group.id, member.userId);
      setMembers((current) => current.filter((m) => m.userId !== member.userId));
      forgetMemberLink(member.userId);
      // Sans nouveau lien, la personne exclue pourrait revenir avec l'ancien.
      setInviteToken(await regenerateInviteToken(group.id));
    }, 'Exclusion impossible.');
  }

  async function handleLeave() {
    if (!window.confirm(`Quitter le groupe « ${group.name} » ? Tu n'auras plus accès à ses données.`)) return;
    await run(async () => {
      await leaveGroup(group.id);
      await refreshGroups();
    }, 'Impossible de quitter le groupe.');
  }

  async function handleDelete() {
    const typed = window.prompt(
      `Supprimer définitivement « ${group.name} », avec tous ses joueurs et ses matchs ?\nTape le nom du groupe pour confirmer.`,
    );
    if (typed === null) return;
    if (typed.trim() !== group.name) {
      setActionError('Le nom saisi ne correspond pas : le groupe n\'a pas été supprimé.');
      return;
    }
    await run(async () => {
      await deleteGroup(group.id);
      await refreshGroups();
    }, 'Suppression impossible.');
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            <RoleBadge role={group.role} />
          </div>
          <p className="mt-2 text-muted-foreground">
            {isOwner
              ? 'Tu as créé ce groupe : tu gères ses membres et leurs droits.'
              : canEdit
                ? 'Tu es admin : tu peux modifier les joueurs, les matchs et la composition.'
                : 'Tu peux consulter les joueurs, les matchs et les stats. Le créateur peut te donner des droits.'}
          </p>
        </div>

        {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}

        {isOwner && (
          <Card className="p-5">
            <h2 className="font-semibold text-foreground">Nom du groupe</h2>
            <form onSubmit={handleRename} className="flex gap-2">
              <Input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                maxLength={50}
                aria-label="Nom du groupe"
                required
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!groupName.trim() || groupName.trim() === group.name}
                className="shrink-0 rounded-full"
              >
                Renommer
              </Button>
            </form>
          </Card>
        )}

        {canEdit && (
          <InviteLinkCard
            groupName={group.name}
            inviteUrl={inviteUrl}
            onRegenerate={handleRegenerateInvite}
            onError={setActionError}
          />
        )}

        <MemberList
          members={members}
          players={players}
          isLoading={isLoadingMembers}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onToggleAdmin={handleToggleAdmin}
          onRemove={handleRemove}
          onLinkPlayer={handleLinkPlayer}
        />

        <MyGroupsCard />

        <div className="flex justify-end">
          {isOwner ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
              Supprimer le groupe
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={handleLeave} className="rounded-full">
              <LogOut />
              Quitter le groupe
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
