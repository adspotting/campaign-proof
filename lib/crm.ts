import { encryptToken, decryptToken, signState, verifyState } from "./secure-tokens";
import { publicOrigin, requireRuntimeValue, runtimeValue, type CrmProvider } from "./runtime";
import { supabaseRest } from "./supabase-rest";
import { modelCampaign, type CampaignInput } from "./campaign-model";

type OAuthState = { provider: CrmProvider; userId: string; exp: number; nonce: string };

export type ConnectionRow = {
  id: number;
  user_id: string;
  provider: CrmProvider;
  external_account_id: string;
  display_name: string | null;
  status: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string | null;
  token_expires_at: string | null;
  scopes: string[];
  config: Record<string, unknown>;
  last_synced_at: string | null;
};

type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  externalAccountId: string;
  displayName: string;
  scopes: string[];
  config?: Record<string, unknown>;
};

export async function authorizationUrl(provider: CrmProvider, userId: string, request: Request): Promise<string> {
  const state = await signState({
    provider,
    userId,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    nonce: crypto.randomUUID(),
  } satisfies OAuthState);
  const redirectUri = `${publicOrigin(request)}/api/integrations/${provider}/callback`;
  if (provider === "hubspot") {
    const url = new URL("https://app.hubspot.com/oauth/authorize");
    url.searchParams.set("client_id", requireRuntimeValue("HUBSPOT_CLIENT_ID"));
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "oauth crm.objects.deals.read crm.objects.contacts.read crm.objects.companies.read");
    url.searchParams.set("state", state);
    return url.toString();
  }
  const loginUrl = runtimeValue("SALESFORCE_LOGIN_URL") || "https://login.salesforce.com";
  const url = new URL("/services/oauth2/authorize", loginUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", requireRuntimeValue("SALESFORCE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "api refresh_token offline_access");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function completeOAuth(provider: CrmProvider, code: string, state: string, request: Request): Promise<ConnectionRow> {
  const payload = await verifyState<OAuthState>(state);
  if (payload.provider !== provider) throw new Error("OAuth provider does not match the request.");
  const redirectUri = `${publicOrigin(request)}/api/integrations/${provider}/callback`;
  const tokens = provider === "hubspot"
    ? await exchangeHubSpot(code, redirectUri)
    : await exchangeSalesforce(code, redirectUri);
  const record = {
    user_id: payload.userId,
    provider,
    external_account_id: tokens.externalAccountId,
    display_name: tokens.displayName,
    status: "connected",
    access_token_ciphertext: await encryptToken(tokens.accessToken),
    refresh_token_ciphertext: tokens.refreshToken ? await encryptToken(tokens.refreshToken) : null,
    token_expires_at: tokens.expiresAt ?? null,
    scopes: tokens.scopes,
    config: tokens.config ?? {},
    updated_at: new Date().toISOString(),
  };
  const rows = await supabaseRest<ConnectionRow[]>(
    "crm_connections?on_conflict=user_id,provider,external_account_id",
    { method: "POST", body: JSON.stringify(record), headers: { Prefer: "resolution=merge-duplicates,return=representation" } },
  );
  if (!rows[0]) throw new Error("CRM connection was not saved.");
  return rows[0];
}

async function exchangeHubSpot(code: string, redirectUri: string): Promise<TokenBundle> {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: requireRuntimeValue("HUBSPOT_CLIENT_ID"),
    client_secret: requireRuntimeValue("HUBSPOT_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch("https://api.hubapi.com/oauth/v1/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`HubSpot token exchange returned ${response.status}.`);
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in?: number; hub_id?: number; scopes?: string[] };
  const detailsResponse = await fetch("https://api.hubapi.com/account-info/v3/details", { headers: { authorization: `Bearer ${data.access_token}` } });
  const details = detailsResponse.ok ? await detailsResponse.json() as { portalId?: number; companyName?: string; uiDomain?: string } : {};
  const accountId = String(details.portalId ?? data.hub_id ?? "unknown");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    externalAccountId: accountId,
    displayName: details.companyName || details.uiDomain || `HubSpot portal ${accountId}`,
    scopes: data.scopes ?? [],
  };
}

async function exchangeSalesforce(code: string, redirectUri: string): Promise<TokenBundle> {
  const loginUrl = runtimeValue("SALESFORCE_LOGIN_URL") || "https://login.salesforce.com";
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: requireRuntimeValue("SALESFORCE_CLIENT_ID"),
    client_secret: requireRuntimeValue("SALESFORCE_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(new URL("/services/oauth2/token", loginUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`Salesforce token exchange returned ${response.status}.`);
  const data = await response.json() as { access_token: string; refresh_token?: string; instance_url: string; id: string; scope?: string; issued_at?: string };
  const userInfoResponse = await fetch(`${data.instance_url}/services/oauth2/userinfo`, { headers: { authorization: `Bearer ${data.access_token}` } });
  const userInfo = userInfoResponse.ok ? await userInfoResponse.json() as { organization_id?: string; preferred_username?: string; name?: string } : {};
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    externalAccountId: userInfo.organization_id || data.id,
    displayName: userInfo.name || userInfo.preferred_username || "Salesforce organization",
    scopes: data.scope?.split(" ") ?? [],
    config: { instance_url: data.instance_url },
  };
}

async function refreshAccess(connection: ConnectionRow): Promise<{ accessToken: string; connection: ConnectionRow }> {
  const currentToken = await decryptToken(connection.access_token_ciphertext);
  if (!connection.token_expires_at || new Date(connection.token_expires_at).getTime() > Date.now() + 60_000) return { accessToken: currentToken, connection };
  if (!connection.refresh_token_ciphertext) return { accessToken: currentToken, connection };
  const refreshToken = await decryptToken(connection.refresh_token_ciphertext);
  const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  let endpoint: string;
  if (connection.provider === "hubspot") {
    endpoint = "https://api.hubapi.com/oauth/v1/token";
    form.set("client_id", requireRuntimeValue("HUBSPOT_CLIENT_ID"));
    form.set("client_secret", requireRuntimeValue("HUBSPOT_CLIENT_SECRET"));
  } else {
    endpoint = new URL("/services/oauth2/token", runtimeValue("SALESFORCE_LOGIN_URL") || "https://login.salesforce.com").toString();
    form.set("client_id", requireRuntimeValue("SALESFORCE_CLIENT_ID"));
    form.set("client_secret", requireRuntimeValue("SALESFORCE_CLIENT_SECRET"));
  }
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`${connection.provider} token refresh returned ${response.status}.`);
  const data = await response.json() as { access_token: string; expires_in?: number; instance_url?: string };
  const patch = {
    access_token_ciphertext: await encryptToken(data.access_token),
    token_expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : connection.token_expires_at,
    config: data.instance_url ? { ...connection.config, instance_url: data.instance_url } : connection.config,
    updated_at: new Date().toISOString(),
  };
  await supabaseRest(`crm_connections?id=eq.${connection.id}`, { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=minimal" } });
  return { accessToken: data.access_token, connection: { ...connection, ...patch } };
}

type SourceRecord = { object_type: string; external_id: string; occurred_at?: string; payload: Record<string, unknown> };

export async function syncConnection(userId: string, connectionId: number, provider: CrmProvider) {
  const rows = await supabaseRest<ConnectionRow[]>(`crm_connections?id=eq.${connectionId}&user_id=eq.${encodeURIComponent(userId)}&provider=eq.${provider}&select=*&limit=1`);
  const connection = rows[0];
  if (!connection) throw new Error("CRM connection was not found.");
  const runRows = await supabaseRest<Array<{ id: number }>>("sync_runs?select=id", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, connection_id: connection.id, provider, status: "running" }),
    headers: { Prefer: "return=representation" },
  });
  const runId = runRows[0]?.id;
  try {
    const refreshed = await refreshAccess(connection);
    const records = provider === "hubspot"
      ? await fetchHubSpotDeals(refreshed.accessToken)
      : await fetchSalesforceOpportunities(refreshed.accessToken, String(refreshed.connection.config.instance_url ?? ""));
    const sourceRows = records.map((record) => ({
      user_id: userId,
      connection_id: connection.id,
      provider,
      object_type: record.object_type,
      external_id: record.external_id,
      occurred_at: record.occurred_at ?? null,
      payload: record.payload,
      synced_at: new Date().toISOString(),
    }));
    for (let index = 0; index < sourceRows.length; index += 100) {
      await supabaseRest("source_records?on_conflict=user_id,provider,object_type,external_id", {
        method: "POST",
        body: JSON.stringify(sourceRows.slice(index, index + 100)),
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      });
    }
    const campaigns = summarizeRecords(provider, records);
    for (const campaign of campaigns) {
      const modeled = modelCampaign(campaign);
      await supabaseRest("campaigns?on_conflict=user_id,source,external_id", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          ...campaign,
          metrics: modeled,
          methodology_version: modeled.methodology_version,
          updated_at: new Date().toISOString(),
        }),
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      });
    }
    const completedAt = new Date().toISOString();
    if (runId) await supabaseRest(`sync_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "completed", records_seen: records.length, records_imported: records.length, completed_at: completedAt }), headers: { Prefer: "return=minimal" } });
    await supabaseRest(`crm_connections?id=eq.${connection.id}`, { method: "PATCH", body: JSON.stringify({ status: "connected", last_synced_at: completedAt, updated_at: completedAt }), headers: { Prefer: "return=minimal" } });
    return { seen: records.length, imported: records.length, campaigns: campaigns.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    if (runId) await supabaseRest(`sync_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "failed", error_message: message.slice(0, 500), completed_at: new Date().toISOString() }), headers: { Prefer: "return=minimal" } });
    throw error;
  }
}

async function fetchHubSpotDeals(accessToken: string): Promise<SourceRecord[]> {
  const records: SourceRecord[] = [];
  let after = "";
  for (let page = 0; page < 10; page += 1) {
    const url = new URL("https://api.hubapi.com/crm/v3/objects/deals");
    url.searchParams.set("limit", "100");
    url.searchParams.set("properties", "dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,hs_analytics_source,hs_analytics_source_data_1,hs_analytics_source_data_2");
    url.searchParams.set("associations", "contacts,companies");
    if (after) url.searchParams.set("after", after);
    const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`HubSpot deals request returned ${response.status}.`);
    const data = await response.json() as { results?: Array<{ id: string; properties: Record<string, string | null>; associations?: Record<string, unknown>; createdAt?: string; updatedAt?: string }>; paging?: { next?: { after?: string } } };
    for (const deal of data.results ?? []) records.push({ object_type: "deal", external_id: deal.id, occurred_at: deal.properties.createdate ?? deal.createdAt, payload: deal as unknown as Record<string, unknown> });
    after = data.paging?.next?.after ?? "";
    if (!after) break;
  }
  return records;
}

async function fetchSalesforceOpportunities(accessToken: string, instanceUrl: string): Promise<SourceRecord[]> {
  if (!instanceUrl) throw new Error("Salesforce instance URL is missing.");
  const records: SourceRecord[] = [];
  const soql = "SELECT Id,Name,Amount,StageName,CloseDate,CreatedDate,LastModifiedDate,CampaignId,Campaign.Name FROM Opportunity ORDER BY LastModifiedDate DESC";
  let nextUrl = `/services/data/v65.0/query?q=${encodeURIComponent(soql)}`;
  for (let page = 0; page < 10 && nextUrl; page += 1) {
    const response = await fetch(new URL(nextUrl, instanceUrl), { headers: { authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`Salesforce opportunities request returned ${response.status}.`);
    const data = await response.json() as { records?: Array<Record<string, unknown> & { Id: string; CreatedDate?: string }>; nextRecordsUrl?: string; done?: boolean };
    for (const opportunity of data.records ?? []) records.push({ object_type: "opportunity", external_id: opportunity.Id, occurred_at: opportunity.CreatedDate, payload: opportunity });
    nextUrl = data.done ? "" : data.nextRecordsUrl ?? "";
  }
  return records;
}

function summarizeRecords(provider: CrmProvider, records: SourceRecord[]): CampaignInput[] {
  const groups = new Map<string, { name: string; count: number; value: number; occurredAt?: string }>();
  for (const record of records) {
    const payload = record.payload;
    let key: string;
    let name: string;
    let amount: number;
    if (provider === "hubspot") {
      const properties = (payload.properties ?? {}) as Record<string, string | null>;
      key = properties.hs_analytics_source_data_1 || properties.hs_analytics_source || "unattributed";
      name = properties.hs_analytics_source_data_1 || properties.hs_analytics_source || "Unattributed HubSpot pipeline";
      amount = Number(properties.amount ?? 0) || 0;
    } else {
      const campaign = (payload.Campaign ?? {}) as Record<string, unknown>;
      key = String(payload.CampaignId || "unattributed");
      name = String(campaign.Name || "Unattributed Salesforce pipeline");
      amount = Number(payload.Amount ?? 0) || 0;
    }
    const current = groups.get(key) ?? { name, count: 0, value: 0, occurredAt: record.occurred_at };
    current.count += 1;
    current.value += amount;
    groups.set(key, current);
  }
  return [...groups.entries()].map(([externalId, group]) => ({
    source: provider,
    external_id: externalId,
    name: group.name,
    campaign_type: "crm_attribution",
    opportunities: group.count,
    average_deal_value: group.count ? group.value / group.count : 0,
    entered_pipeline: group.value,
    sales_cycle_days: 90,
    attribution_window_days: 90,
    occurred_at: group.occurredAt,
  }));
}
