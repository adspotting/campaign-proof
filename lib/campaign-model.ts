export const METHODOLOGY_VERSION = "cp-2026.09";

export type CampaignInput = {
  source: string;
  external_id: string;
  name: string;
  campaign_type?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  registrations?: number;
  leads?: number;
  opportunities?: number;
  average_deal_value?: number;
  entered_pipeline?: number;
  sales_cycle_days?: number;
  attribution_window_days?: number;
  occurred_at?: string;
  raw?: Record<string, unknown>;
};

function number(value: unknown, name: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative number.`);
  return parsed;
}

export function normalizeCampaign(value: unknown): CampaignInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Request body must be a JSON object.");
  const input = value as Record<string, unknown>;
  for (const field of ["source", "external_id", "name"] as const) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`${field} is required.`);
  }
  return {
    source: String(input.source).trim().toLowerCase().slice(0, 80),
    external_id: String(input.external_id).trim().slice(0, 240),
    name: String(input.name).trim().slice(0, 240),
    campaign_type: typeof input.campaign_type === "string" ? input.campaign_type.trim().slice(0, 80) : undefined,
    spend: number(input.spend, "spend"), impressions: number(input.impressions, "impressions"),
    clicks: number(input.clicks, "clicks"), registrations: number(input.registrations, "registrations"),
    leads: number(input.leads, "leads"), opportunities: number(input.opportunities, "opportunities"),
    average_deal_value: number(input.average_deal_value, "average_deal_value"),
    entered_pipeline: number(input.entered_pipeline, "entered_pipeline"),
    sales_cycle_days: number(input.sales_cycle_days, "sales_cycle_days") ?? 90,
    attribution_window_days: number(input.attribution_window_days, "attribution_window_days") ?? 90,
    occurred_at: typeof input.occurred_at === "string" ? input.occurred_at : undefined,
    raw: input.raw && typeof input.raw === "object" && !Array.isArray(input.raw) ? input.raw as Record<string, unknown> : undefined,
  };
}

export function modelCampaign(input: CampaignInput) {
  const basis = input.opportunities && input.average_deal_value
    ? input.opportunities * input.average_deal_value
    : input.entered_pipeline ?? 0;
  const windowDays = input.attribution_window_days ?? 90;
  const cycleDays = Math.max(input.sales_cycle_days ?? windowDays, 1);
  const cycleFactor = Math.min(windowDays / cycleDays, 1);
  const attributable = basis * cycleFactor;
  return {
    methodology_version: METHODOLOGY_VERSION,
    attribution_window_days: windowDays,
    modeled_opportunity_value: Math.round(basis * 100) / 100,
    attributable_value: Math.round(attributable * 100) / 100,
    modeled_roi: input.spend && input.spend > 0 ? Math.round((attributable / input.spend) * 100) / 100 : null,
  };
}
