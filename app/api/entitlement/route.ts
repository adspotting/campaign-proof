import { requireViewer } from "@/lib/auth";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try { const viewer = await requireViewer(request); const rows = await supabaseRest<Array<{ status: string; current_period_end: string | null }>>(`subscriptions?user_id=eq.${encodeURIComponent(viewer.userId)}&status=in.(active,trialing)&select=status,current_period_end&limit=1`); return Response.json({ pro: Boolean(rows[0]), subscription: rows[0] ?? null }); }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Paid access could not be verified." }, { status: 503 }); }
}
