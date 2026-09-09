import { requireViewer } from "@/lib/auth";
import { providerConfigured } from "@/lib/runtime";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const [connections, runs] = await Promise.all([
      supabaseRest(`crm_connections?user_id=eq.${encodeURIComponent(viewer.userId)}&select=id,provider,display_name,status,last_synced_at&order=created_at.asc`),
      supabaseRest(`sync_runs?user_id=eq.${encodeURIComponent(viewer.userId)}&select=id,provider,status,records_seen,records_imported,started_at,completed_at&order=started_at.desc&limit=25`),
    ]);
    return Response.json({ connections, runs, configured: { hubspot: providerConfigured("hubspot"), salesforce: providerConfigured("salesforce") } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Could not load integrations." }, { status: 500 });
  }
}
