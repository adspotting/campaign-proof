import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const sample = `{
  "source": "hubspot",
  "external_id": "campaign-3817",
  "name": "Enterprise AI Summit",
  "campaign_type": "virtual_event",
  "spend": 42000,
  "impressions": 310000,
  "clicks": 7400,
  "registrations": 1280,
  "leads": 442,
  "opportunities": 28,
  "average_deal_value": 28000,
  "sales_cycle_days": 120,
  "attribution_window_days": 90,
  "occurred_at": "2026-08-14T00:00:00Z"
}`;

export default function DevelopersPage() {
  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">CP</span><span>Campaign Proof</span></Link>
        <div className="nav-links"><Link href="/integrations">Integrations</Link><Link className="button button-small" href="/integrations">Get an API key</Link></div>
      </nav>
      <div className="section-shell docs-layout">
        <aside className="docs-nav">
          <Link href="/"><ArrowLeft size={14} /> Product</Link>
          <a href="#authentication">Authentication</a>
          <a href="#campaigns">Campaigns</a>
          <a href="#idempotency">Idempotency</a>
          <a href="/openapi.json">OpenAPI <ExternalLink size={13} /></a>
        </aside>
        <article className="docs-main">
          <p className="kicker">Campaign Proof API v1</p>
          <h1>Bring your own campaign data.</h1>
          <p>Use the REST API when data lives outside HubSpot or Salesforce. The contract is intentionally narrow: send evidence, retain its source, and receive the modeled 90-day commercial value.</p>
          <h2 id="authentication">Authentication</h2>
          <p>Pass a Campaign Proof API key as a bearer token. Keys are shown once, hashed at rest, and can be revoked without changing your CRM connection.</p>
          <div className="code-panel"><pre><code>Authorization: Bearer cp_live_...</code></pre></div>
          <h2 id="campaigns">Create or update a campaign</h2>
          <div className="endpoint"><span className="method">POST</span><span>/api/v1/campaigns</span></div>
          <p>Numeric values are accepted as numbers. Currency is stored as exact decimal values. The response includes the formula version and 90-day modeled value.</p>
          <div className="code-panel"><pre><code>{sample}</code></pre></div>
          <h2 id="idempotency">Idempotency and source lineage</h2>
          <p>The pair of <code>source</code> and <code>external_id</code> is unique within an account. Sending it again updates the existing record, creates a new evidence snapshot, and preserves the original creation time.</p>
          <h2>Response</h2>
          <div className="code-panel"><pre><code>{`{
  "id": 481,
  "status": "updated",
  "methodology_version": "cp-2026.09",
  "attribution_window_days": 90,
  "modeled_opportunity_value": 784000,
  "attributable_value": 588000,
  "modeled_roi": 14
}`}</code></pre></div>
        </article>
      </div>
    </main>
  );
}
