"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, LockKeyhole } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PreviewData = {
  fields: { spend: number; impressions: number; clicks: number; registrations: number; leads: number; opportunities: number; averageDealValue: number; salesCycleDays: number };
  result: { attributable_value: number; modeled_opportunity_value: number; modeled_roi: number | null; methodology_version: string };
  rates: { ctr: number; registration: number; lead: number; opportunity: number };
};
type PreviewRow = { name?: string; report_data?: PreviewData };

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function FreeReportPreview() {
  const [preview, setPreview] = useState<PreviewRow | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const client = supabaseBrowser();
      const session = client ? (await client.auth.getSession()).data.session : null;
      if (!session) { window.location.replace("/account?return_to=/preview"); return; }
      setToken(session.access_token);
      const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
      const pending = localStorage.getItem("campaign-proof-pending-analysis");
      let pendingData: unknown = null;
      try { pendingData = pending ? JSON.parse(pending) : null; } catch { localStorage.removeItem("campaign-proof-pending-analysis"); }
      const response = await fetch("/api/report-preview", pendingData ? { method: "POST", headers, body: JSON.stringify({ name: "Campaign analysis", report_data: pendingData }) } : { headers });
      const payload = await response.json() as { preview?: PreviewRow; error?: string };
      if (!response.ok || !payload.preview) setError(payload.error ?? "Run a free analysis before creating your preview.");
      else { setPreview(payload.preview); if (pendingData) localStorage.removeItem("campaign-proof-pending-analysis"); }
      setLoading(false);
    };
    void run();
  }, []);

  async function checkout() {
    if (!token) return;
    setBusy(true); setError(null);
    const response = await fetch("/api/checkout", { method: "POST", headers: { authorization: `Bearer ${token}` } });
    const payload = await response.json() as { url?: string; error?: string };
    if (payload.url) window.location.assign(payload.url);
    else { setError(payload.error ?? "Checkout is unavailable."); setBusy(false); }
  }

  if (loading) return <div className="empty-state"><Loader2 className="animate-spin" /><p>Preparing your saved preview…</p></div>;
  const data = preview?.report_data;
  if (!data) return <div className="empty-state"><LockKeyhole size={26} /><h3>No analysis is ready yet</h3><p>{error}</p><a className="button" href="/#calculator">Analyze a campaign free</a></div>;
  const cycleAdjustment = Math.round(Math.min(90 / Math.max(data.fields.salesCycleDays, 1), 1) * 100);
  return <div className="preview-conversion"><article className="report-preview free-report" aria-label="Watermarked free campaign report preview"><div className="preview-watermark">FREE PREVIEW · CAMPAIGN PROOF</div><header><span className="report-logo">CP↗</span><div><strong>Your organization</strong><span>Campaign performance report</span></div></header><p className="kicker">90-day attribution view</p><h1>{preview?.name ?? "Campaign analysis"}</h1><div className="report-hero-metric"><span>90-day attributable value</span><strong>{money.format(data.result.attributable_value)}</strong><small>{data.result.modeled_roi?.toFixed(1) ?? "—"}× modeled ROI</small></div><p className="report-narrative">This preview shows the commercial story behind your campaign using deal-cycle-aware attribution. Pro unlocks editing, vertical benchmarks, branding, export, history, and connected data.</p><div className="report-grid"><div><span>Investment</span><strong>{money.format(data.fields.spend)}</strong></div><div><span>Opportunity value</span><strong>{money.format(data.result.modeled_opportunity_value)}</strong></div><div><span>Cycle adjustment</span><strong>{cycleAdjustment}%</strong></div><div><span>Opportunities</span><strong>{data.fields.opportunities}</strong></div></div><footer><span>Methodology {data.result.methodology_version}</span><span>General B2B preview</span><span>90-day window</span></footer></article><aside className="preview-upgrade"><p className="kicker">You have seen the proof</p><h2>Make the report yours.</h2><p>Upgrade only when you are ready to turn this preview into a reusable reporting workflow.</p><ul>{["Remove the Campaign Proof watermark","Add your logo, colors, and narrative","Apply industry-specific benchmarks","Export PDFs and save campaign history","Connect HubSpot, Salesforce, or the API"].map((item) => <li key={item}><Check size={15}/>{item}</li>)}</ul><div className="paywall-price"><strong>$39</strong><span>/ month</span></div><button className="button" onClick={() => void checkout()} disabled={busy}>{busy && <Loader2 className="animate-spin" size={16}/>}Start Pro <ArrowRight size={16}/></button>{error && <p className="message message-error">{error}</p>}<small>Cancel anytime. Secure checkout through Stripe.</small></aside></div>;
}
