"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Database, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Provider = "hubspot" | "salesforce";

type Connection = {
  id: number;
  provider: Provider;
  display_name: string | null;
  status: string;
  last_synced_at: string | null;
};

type SyncRun = {
  id: number;
  provider: Provider;
  status: string;
  records_seen: number;
  records_imported: number;
  started_at: string;
  completed_at: string | null;
};

const providers: Array<{ id: Provider; name: string; initials: string; detail: string }> = [
  { id: "hubspot", name: "HubSpot", initials: "HS", detail: "Deals, contacts, companies, pipeline stages, source fields" },
  { id: "salesforce", name: "Salesforce", initials: "SF", detail: "Campaigns, members, opportunities, value, stage and close date" },
];

export default function IntegrationWorkspace({ signedIn }: { signedIn: boolean }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!signedIn) return;
    const response = await fetch("/api/integrations", { credentials: "same-origin" });
    if (!response.ok) return;
    const data = await response.json() as { connections: Connection[]; runs: SyncRun[] };
    setConnections(data.connections ?? []);
    setRuns(data.runs ?? []);
  }, [signedIn]);

  useEffect(() => { void load(); }, [load]);

  async function connect(provider: Provider) {
    setBusy(`connect-${provider}`);
    setError(null);
    const response = await fetch(`/api/integrations/${provider}/connect`, { method: "POST" });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setError(data.error ?? `Could not start the ${provider} connection.`);
      setBusy(null);
      return;
    }
    window.location.assign(data.url);
  }

  async function sync(connection: Connection) {
    setBusy(`sync-${connection.id}`);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/integrations/${connection.provider}/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ connection_id: connection.id }),
    });
    const data = await response.json() as { imported?: number; seen?: number; error?: string };
    if (!response.ok) setError(data.error ?? "The sync did not complete.");
    else setMessage(`Sync complete: ${data.imported ?? 0} of ${data.seen ?? 0} source records updated.`);
    setBusy(null);
    await load();
  }

  async function createApiKey() {
    setBusy("key");
    setError(null);
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Primary integration" }),
    });
    const data = await response.json() as { key?: string; error?: string };
    if (!response.ok || !data.key) setError(data.error ?? "Could not create an API key.");
    else setNewKey(data.key);
    setBusy(null);
  }

  const connectionFor = (provider: Provider) => connections.find((item) => item.provider === provider);

  return (
    <div className="workspace-panel">
      <Tabs defaultValue="connections">
        <TabsList className="workspace-tabs" variant="line">
          <TabsTrigger className="workspace-tab" value="connections">CRM connections</TabsTrigger>
          <TabsTrigger className="workspace-tab" value="api">API access</TabsTrigger>
          <TabsTrigger className="workspace-tab" value="history">Sync history</TabsTrigger>
        </TabsList>

        <TabsContent className="workspace-content" value="connections">
          <div className="workspace-toolbar">
            <div><h2>Connected systems</h2><p>OAuth tokens are encrypted before storage. A sync never overwrites the original CRM record.</p></div>
          </div>
          {!signedIn && <p className="message">Sign in to connect a CRM, create API keys, and see your private sync history.</p>}
          {message && <p className="message">{message}</p>}
          {error && <p className="message message-error">{error}</p>}
          <div className="connection-list">
            {providers.map((provider) => {
              const connection = connectionFor(provider.id);
              return (
                <article className="connection-row" key={provider.id}>
                  <span className="provider-icon">{provider.initials}</span>
                  <div>
                    <h3>{provider.name}</h3>
                    <p>{connection?.display_name || provider.detail}</p>
                  </div>
                  <div className="connection-actions">
                    {connection ? (
                      <>
                        <span className="connection-state"><CheckCircle2 size={14} /> Connected</span>
                        <button className="button button-small button-secondary" disabled={busy !== null} onClick={() => void sync(connection)}>
                          {busy === `sync-${connection.id}` ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />} Refresh
                        </button>
                      </>
                    ) : (
                      <button className="button button-small" disabled={!signedIn || busy !== null} onClick={() => void connect(provider.id)}>
                        {busy === `connect-${provider.id}` ? <Loader2 className="animate-spin" size={15} /> : null} Connect {provider.name}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent className="workspace-content" value="api">
          <div className="workspace-toolbar">
            <div><h2>Campaign Proof API</h2><p>Push normalized campaign records from any workflow. Reusing a source and external ID updates the record instead of duplicating it.</p></div>
          </div>
          {error && <p className="message message-error">{error}</p>}
          <div className="api-key-box">
            <div><KeyRound size={20} /><p>Keys are hashed at rest and shown only once.</p></div>
            <button className="button button-small" disabled={!signedIn || busy !== null} onClick={() => void createApiKey()}>
              {busy === "key" ? <Loader2 className="animate-spin" size={15} /> : null} Create API key
            </button>
          </div>
          {newKey && <div className="key-reveal"><strong>Copy this key now. It will not be shown again.</strong><code>{newKey}</code></div>}
          <div className="code-panel" style={{ marginTop: 18 }}><pre><code>{`curl https://campaignproof.app/api/v1/campaigns \\
  -H "Authorization: Bearer cp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "warehouse",
    "external_id": "q3-ai-summit",
    "name": "Q3 AI Summit",
    "spend": 42000,
    "opportunities": 28,
    "average_deal_value": 28000,
    "sales_cycle_days": 120
  }'`}</code></pre></div>
        </TabsContent>

        <TabsContent className="workspace-content" value="history">
          <div className="workspace-toolbar"><div><h2>Sync history</h2><p>Every import is timestamped and counted so report provenance is easy to audit.</p></div></div>
          {runs.length ? (
            <table className="history-table"><thead><tr><th>Source</th><th>Status</th><th>Seen</th><th>Updated</th><th>Started</th></tr></thead><tbody>
              {runs.map((run) => <tr key={run.id}><td>{run.provider}</td><td>{run.status}</td><td>{run.records_seen}</td><td>{run.records_imported}</td><td>{new Date(run.started_at).toLocaleString()}</td></tr>)}
            </tbody></table>
          ) : (
            <div className="empty-state"><Database size={24} /><h3>No syncs yet</h3><p>Connect HubSpot or Salesforce, then run your first refresh.</p></div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
