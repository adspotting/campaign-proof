import { supabaseRest } from "./supabase-rest";

export async function hasProAccess(userId: string) {
  const rows = await supabaseRest<Array<{ id: number }>>(`subscriptions?user_id=eq.${encodeURIComponent(userId)}&status=in.(active,trialing)&select=id&limit=1`);
  return Boolean(rows[0]);
}
