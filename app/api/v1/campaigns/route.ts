import { apiKeyViewer } from "@/lib/auth";
import { modelCampaign, normalizeCampaign } from "@/lib/campaign-model";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const viewer = await apiKeyViewer(request);
    if (!viewer) return Response.json({ error: "A valid Campaign Proof API key is required." }, { status: 401 });
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
    const campaigns = await supabaseRest(`campaigns?user_id=eq.${encodeURIComponent(viewer.userId)}&select=id,source,external_id,name,campaign_type,spend,opportunities,average_deal_value,sales_cycle_days,attribution_window_days,metrics,methodology_version,occurred_at,created_at,updated_at&order=updated_at.desc&limit=${limit}`);
    return Response.json({ data: campaigns });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load campaigns." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await apiKeyViewer(request);
    if (!viewer) return Response.json({ error: "A valid Campaign Proof API key is required." }, { status: 401 });
    const input = normalizeCampaign(await request.json());
    const modeled = modelCampaign(input);
    const record = {
      user_id: viewer.userId, source: input.source, external_id: input.external_id, name: input.name,
      campaign_type: input.campaign_type ?? null, spend: input.spend ?? null, impressions: input.impressions ?? null,
      clicks: input.clicks ?? null, registrations: input.registrations ?? null, leads: input.leads ?? null,
      opportunities: input.opportunities ?? null, average_deal_value: input.average_deal_value ?? null,
      entered_pipeline: input.entered_pipeline ?? null, sales_cycle_days: input.sales_cycle_days ?? 90,
      attribution_window_days: input.attribution_window_days ?? 90, occurred_at: input.occurred_at ?? null,
      metrics: modeled, methodology_version: modeled.methodology_version, updated_at: new Date().toISOString(),
    };
    const existing = await supabaseRest<Array<{ id: number }>>(`campaigns?user_id=eq.${encodeURIComponent(viewer.userId)}&source=eq.${encodeURIComponent(input.source)}&external_id=eq.${encodeURIComponent(input.external_id)}&select=id&limit=1`);
    const rows = await supabaseRest<Array<{ id: number }>>("campaigns?on_conflict=user_id,source,external_id&select=id", {
      method: "POST", body: JSON.stringify(record), headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    });
    const campaignId = rows[0]?.id;
    if (!campaignId) throw new Error("Campaign record was not saved.");
    await Promise.all([
      supabaseRest("evidence_snapshots", { method: "POST", body: JSON.stringify({ user_id: viewer.userId, campaign_id: campaignId, source: input.source, external_id: input.external_id, payload: input.raw ?? input, metrics: modeled, methodology_version: modeled.methodology_version }), headers: { Prefer: "return=minimal" } }),
      supabaseRest("source_records?on_conflict=user_id,provider,object_type,external_id", { method: "POST", body: JSON.stringify({ user_id: viewer.userId, provider: input.source, object_type: "campaign", external_id: input.external_id, occurred_at: input.occurred_at ?? null, payload: input.raw ?? input, synced_at: new Date().toISOString() }), headers: { Prefer: "resolution=merge-duplicates,return=minimal" } }),
    ]);
    return Response.json({ id: campaignId, status: existing.length ? "updated" : "created", ...modeled }, { status: existing.length ? 200 : 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    const message = error instanceof Error ? error.message : "Campaign import failed.";
    return Response.json({ error: message }, { status: /required|must be|invalid/iu.test(message) ? 400 : 500 });
  }
}
