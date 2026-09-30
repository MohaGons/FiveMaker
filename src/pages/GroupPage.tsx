import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Copy, Crown, LogOut, MessageCircle, RefreshCw, Shield, Trash2, UserMinus } from 'lucide-react';
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
import { CreateGroupForm } from '../features/groups/components/CreateGroupForm';
import { useCurrentGroup, useGroups } from '../features/groups/hooks/useGroups';
import type { GroupMember, GroupRole } from '../features/groups/types';
import { usePlayers } from '../features/players/hooks/usePlayers';
import type { Player } from '../features/players/types';
import { getWhatsAppShareUrl } from '../features/teams/utils/shareMessage';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_LABELS: Record<GroupRole, string> = { owner: 'Créateur', admin: 'Admin', member: 'Membre' };

const JOINED_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function RoleBadge({ role }: { role: GroupRole }) {
  const Icon = role === 'owner' ? Crown : role === 'admin' ? Shield : null;
  return (
    <Badge variant={role === 'member' ? 'secondary' : 'default'}>
      {Icon && <Icon data-icon="inline-start" />}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

/** Valeur du menu pour « aucune fiche » (les valeurs sont des identifiants de fiche). */
const NO_PLAYER = '';

interface PlayerLinkSelectProps {
  member: GroupMember;
  players: Player[];
  onChange: (playerId: string | null) => void;
}

/** Créateur : choisir la fiche joueur d'un membre, parmi les fiches libres (ou la sienne actuelle). */
function PlayerLinkSelect({ member, players, onChange }: PlayerLinkSelectProps) {
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

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function GroupPage() {
  const { session } = useAuth();
  const { groups, selectGroup, refreshGroups } = useGroups();
  const { group, canEdit, isOwner } = useCurrentGroup();
  const { players, linkPlayerToMember, forgetMemberLink } = usePlayers();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [groupName, setGroupName] = useState(group.name);
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

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

  async function handleCopyInvite() {
    if (!inviteUrl) return;
    await run(async () => {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    }, 'Copie impossible.');
  }

  function handleShareInvite() {
    if (!inviteUrl) return;
    const message = `⚽ Rejoins le groupe *${group.name}* sur FiveMaker :\n${inviteUrl}`;
    window.open(getWhatsAppShareUrl(message), '_blank', 'noopener,noreferrer');
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
          <Card className="p-5">
            <div>
              <h2 className="font-semibold text-foreground">Inviter des membres</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Toute personne qui ouvre ce lien et se connecte rejoint le groupe en tant que membre.
              </p>
            </div>
            {inviteUrl ? (
              <>
                <Input value={inviteUrl} readOnly onFocus={(event) => event.target.select()} aria-label="Lien d'invitation" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleShareInvite}
                    className="rounded-full bg-[#25D366] text-[#0b3d1f] hover:bg-[#1ebe5b]"
                  >
                    <MessageCircle />
                    WhatsApp
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCopyInvite} className="rounded-full">
                    {copied ? <Check /> : <Copy />}
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleRegenerateInvite} className="rounded-full">
                    <RefreshCw />
                    Nouveau lien
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chargement du lien...</p>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="font-semibold text-foreground">
            Membres {!isLoadingMembers && <span className="font-normal text-muted-foreground">({members.length})</span>}
          </h2>
          {isLoadingMembers ? (
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
                        onChange={(playerId) => handleLinkPlayer(member, playerId)}
                      />
                    )}
                    <RoleBadge role={member.role} />
                    {canManage && (
                      <div className="flex gap-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleToggleAdmin(member)}>
                          {member.role === 'admin' ? 'Retirer admin' : 'Nommer admin'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemove(member)}
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
