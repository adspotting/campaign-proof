import { requireViewer } from "@/lib/auth";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const rows = await supabaseRest<Array<Record<string, unknown>>>(`report_previews?user_id=eq.${encodeURIComponent(viewer.userId)}&select=*&limit=1`);
    return Response.json({ preview: rows[0] ?? null });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Your free preview could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const value = await request.json() as { name?: unknown; report_data?: unknown };
    const name = typeof value.name === "string" ? value.name.trim().slice(0, 160) : "Campaign analysis";
    const reportData = value.report_data && typeof value.report_data === "object" ? value.report_data : null;
    if (!reportData || JSON.stringify(reportData).length > 50_000) return Response.json({ error: "This campaign preview is invalid." }, { status: 400 });
    const rows = await supabaseRest<Array<Record<string, unknown>>>("report_previews?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ user_id: viewer.userId, name, report_data: reportData, methodology_version: "cp-2026.09", updated_at: new Date().toISOString() }),
    });
    return Response.json({ preview: rows[0] ?? null });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Your free preview could not be saved." }, { status: 503 });
  }
}
