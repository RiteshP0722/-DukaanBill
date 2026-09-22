import { supabase } from '@/lib/supabase';
import { useQuery } from '@/hooks/useQuery';
import type { Profile, StaffInvite } from '@/types';

export interface StaffList {
  members: Profile[];
  pending: StaffInvite[];
}

export async function fetchStaff(): Promise<StaffList> {
  const [members, pending] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'staff').order('created_at'),
    supabase.from('staff_invites').select('*').order('created_at'),
  ]);
  if (members.error) throw members.error;
  if (pending.error) throw pending.error;
  return { members: members.data as Profile[], pending: pending.data as StaffInvite[] };
}

export async function addStaffInvite(shopId: string, name: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('staff_invites')
    .insert({ shop_id: shopId, name: name.trim(), phone });
  if (error) throw error;
}

export async function removeStaffInvite(id: string): Promise<void> {
  const { error } = await supabase.from('staff_invites').delete().eq('id', id);
  if (error) throw error;
}

export async function removeStaffMember(profileId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw error;
}

export const useStaff = () => useQuery(fetchStaff, []);
