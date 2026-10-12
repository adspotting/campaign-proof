"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, DatabaseZap, LockKeyhole, Mail } from "lucide-react";
import { modelCampaign } from "@/lib/campaign-model";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

type Fields = { spend: number; impressions: number; clicks: number; registrations: number; leads: number; opportunities: number; averageDealValue: number; salesCycleDays: number };
const sample: Fields = { spend: 42000, impressions: 860000, clicks: 13800, registrations: 1620, leads: 390, opportunities: 28, averageDealValue: 28000, salesCycleDays: 120 };

export default function Calculator() {
  const [fields, setFields] = useState(sample);
  const [showSave, setShowSave] = useState(false);
  const [email, setEmail] = useState("");
  const update = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  const result = useMemo(() => modelCampaign({ source: "calculator", external_id: "preview", name: "Campaign preview", spend: fields.spend, impressions: fields.impressions, clicks: fields.clicks, registrations: fields.registrations, leads: fields.leads, opportunities: fields.opportunities, average_deal_value: fields.averageDealValue, sales_cycle_days: fields.salesCycleDays, attribution_window_days: 90 }), [fields]);
  const rates = { ctr: fields.impressions ? fields.clicks / fields.impressions : 0, registration: fields.clicks ? fields.registrations / fields.clicks : 0, lead: fields.registrations ? fields.leads / fields.registrations : 0, opportunity: fields.leads ? fields.opportunities / fields.leads : 0 };
  function savePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem("campaign-proof-pending-analysis", JSON.stringify({ fields, result, rates, saved_at: new Date().toISOString() }));
    const params = new URLSearchParams({ mode: "signup", email, return_to: "/preview" });
    window.location.assign(`/account?${params.toString()}`);
  }
  return <section className="calculator-shell" id="calculator">
    <div className="calculator-heading"><div><p className="kicker">Free campaign calculator</p><h2>Build the business case.</h2></div><p>Enter campaign and deal data manually—or connect a CRM later. Your free result uses the same transparent 90-day attribution logic.</p></div>
    <div className="calculator-grid">
      <form className="metric-form" onSubmit={(event) => event.preventDefault()}>
        <div className="form-section"><span className="form-step">01</span><div><h3>Campaign investment</h3><p>Start with delivery and response.</p></div></div>
        <div className="field-grid">
          <label>Campaign cost ($)<input value={fields.spend} onChange={(e) => update("spend", e.target.value)} type="number" min="0" /></label>
          <label>Impressions<input value={fields.impressions} onChange={(e) => update("impressions", e.target.value)} type="number" min="0" /></label>
          <label>Clicks / visits<input value={fields.clicks} onChange={(e) => update("clicks", e.target.value)} type="number" min="0" /></label>
          <label>Registrations<input value={fields.registrations} onChange={(e) => update("registrations", e.target.value)} type="number" min="0" /></label>
          <label>Qualified leads<input value={fields.leads} onChange={(e) => update("leads", e.target.value)} type="number" min="0" /></label>
          <label>Opportunities<input value={fields.opportunities} onChange={(e) => update("opportunities", e.target.value)} type="number" min="0" /></label>
        </div>
        <div className="form-section commercial-step"><span className="form-step">02</span><div><h3>Commercial context</h3><p>Account for deal value and time-to-close.</p></div></div>
        <div className="field-grid">
          <label>Average deal/customer value ($)<input value={fields.averageDealValue} onChange={(e) => update("averageDealValue", e.target.value)} type="number" min="0" /></label>
          <label>Average deal cycle (days)<input value={fields.salesCycleDays} onChange={(e) => update("salesCycleDays", e.target.value)} type="number" min="1" /></label>
        </div>
        <div className="data-choice"><DatabaseZap size={20} /><div><strong>Prefer not to enter this manually?</strong><p>Pro users can optionally import the same fields from HubSpot, Salesforce, or the Campaign Proof API.</p></div><a href="/integrations">View connections <ArrowRight size={14} /></a></div>
      </form>
      <aside className="result-sheet">
        <div className="result-top"><p className="kicker">90-day view</p><span className="method-stamp">{result.methodology_version}</span></div>
        <p className="result-label">Attributable opportunity value</p><strong className="hero-number">{money.format(result.attributable_value)}</strong>
        <p className="result-explain">{integer.format(fields.opportunities)} opportunities × {money.format(fields.averageDealValue)} × {Math.round(Math.min(90 / Math.max(fields.salesCycleDays, 1), 1) * 100)}% cycle adjustment</p>
        <div className="result-kpis"><div><span>Modeled ROI</span><strong>{result.modeled_roi?.toFixed(1) ?? "—"}×</strong></div><div><span>Full opportunity value</span><strong>{money.format(result.modeled_opportunity_value)}</strong></div></div>
        <div className="funnel-preview"><h3>Funnel efficiency</h3>{Object.entries(rates).map(([name, rate]) => <div className="rate-row" key={name}><span>{name === "ctr" ? "Click-through rate" : `${name[0].toUpperCase()}${name.slice(1)} CVR`}</span><strong>{(rate * 100).toFixed(1)}%</strong></div>)}</div>
        <div className="locked-report"><LockKeyhole size={20} /><div><strong>Preview the report before you pay</strong><p>Save this result and see one complete watermarked report. Upgrade later for branding, exports, history, benchmarks, and integrations.</p></div></div>
        {!showSave ? <button className="button report-cta" type="button" onClick={() => setShowSave(true)}>Save &amp; preview report <ArrowRight size={16} /></button> : <form className="preview-capture" onSubmit={savePreview}><label><Mail size={15} /> Work email<input type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="button" type="submit">Continue to free preview <ArrowRight size={16} /></button><small>No credit card required. Your email becomes your private report login.</small></form>}
      </aside>
    </div>
    <div className="free-note"><Check size={16} /> The calculation requires no account. Create a free login only if you want to save one watermarked report preview.</div>
  </section>;
}
