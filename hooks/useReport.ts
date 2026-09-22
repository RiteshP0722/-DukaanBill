import { supabase } from '@/lib/supabase';
import { useQuery } from '@/hooks/useQuery';
import { toDateKey } from '@/lib/format';
import type { DailyReport } from '@/types';

export async function fetchDailyReport(dateKey: string): Promise<DailyReport> {
  const { data, error } = await supabase.rpc('daily_report', { p_date: dateKey });
  if (error) throw error;
  return data as DailyReport;
}

/** `enabled` is false for staff, so they never even ask for the report. */
export const useDailyReport = (date: Date, enabled = true) => {
  const key = toDateKey(date);
  return useQuery(async () => (enabled ? fetchDailyReport(key) : undefined), [key, enabled]);
};
