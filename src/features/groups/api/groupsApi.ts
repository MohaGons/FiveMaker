import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import type { Group, GroupMember, GroupRole, InviteInfo } from '../types';

async function getCurrentUserId(): Promise<ID> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('Connexion requise.');
  return userId;
}

interface MembershipRow {
  role: GroupRole;
  groups: { id: string; name: string } | null;
}

/** Les groupes de l'utilisateur connecté, par ordre d'adhésion. */
export async function fetchMyGroups(): Promise<Group[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('group_members')
    .select('role, groups(id, name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as MembershipRow[])
    .filter((row) => row.groups)
    .map((row) => ({ id: row.groups!.id, name: row.groups!.name, role: row.role }));
}

export async function createGroup(name: string): Promise<ID> {
  const { data, error } = await supabase.rpc('create_group', { group_name: name });
  if (error) throw error;
  return data as ID;
}

export async function renameGroup(groupId: ID, name: string): Promise<void> {
  const { error } = await supabase.from('groups').update({ name }).eq('id', groupId);
  if (error) throw error;
}

export async function deleteGroup(groupId: ID): Promise<void> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}

interface MemberRow {
  user_id: string;
  role: GroupRole;
  display_name: string | null;
  joined_at: string;
}

const ROLE_ORDER: Record<GroupRole, number> = { owner: 0, admin: 1, member: 2 };

export async function fetchMembers(groupId: ID): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, role, display_name, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data as MemberRow[])
    .map((row) => ({
      userId: row.user_id,
      role: row.role,
      displayName: row.display_name ?? 'Membre',
      joinedAt: new Date(row.joined_at),
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
}

export async function updateMemberRole(groupId: ID, userId: ID, role: 'admin' | 'member'): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Exclure un membre (créateur) ou quitter le groupe (soi-même). */
export async function removeMember(groupId: ID, userId: ID): Promise<void> {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

export async function leaveGroup(groupId: ID): Promise<void> {
  await removeMember(groupId, await getCurrentUserId());
}

/** Jeton du lien d'invitation (visible par le créateur et les admins uniquement). */
export async function fetchInviteToken(groupId: ID): Promise<string | null> {
  const { data, error } = await supabase
    .from('group_invites')
    .select('token')
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) throw error;
  return (data as { token: string } | null)?.token ?? null;
}

export async function regenerateInviteToken(groupId: ID): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite', { gid: groupId });
  if (error) throw error;
  return data as string;
}

interface InviteInfoRow {
  group_id: string;
  group_name: string;
  member_count: number;
  is_member: boolean;
}

/** null si le lien est invalide ou a été régénéré. */
export async function fetchInviteInfo(token: string): Promise<InviteInfo | null> {
  const { data, error } = await supabase.rpc('get_invite_info', { invite_token: token });
  if (error) throw error;

  const row = (data as InviteInfoRow[])[0];
  if (!row) return null;
  return {
    groupId: row.group_id,
    groupName: row.group_name,
    memberCount: Number(row.member_count),
    isMember: row.is_member,
  };
}

export async function joinGroup(token: string): Promise<ID> {
  const { data, error } = await supabase.rpc('join_group', { invite_token: token });
  if (error) throw error;
  return data as ID;
}

export function getInviteUrl(token: string): string {
  return `${window.location.origin}/rejoindre/${token}`;
}
