import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Check,
  DatabaseZap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Calculator from "./calculator";
import Brand from "@/components/brand";

const proofPoints = [
  "Deal-cycle-aware 90-day attribution",
  "Source-linked methodology stamps",
  "Saved, refreshable campaign history",
  "Branded executive-ready reports",
];

const connectors = [
  {
    name: "HubSpot",
    label: "Native OAuth sync",
    copy: "Pull deals, pipeline stages, source fields, contacts, and company associations without exporting spreadsheets.",
    status: "Available in Pro",
  },
  {
    name: "Salesforce",
    label: "Native OAuth sync",
    copy: "Map campaigns, campaign members, primary campaign source, opportunities, value, and close dates into one evidence trail.",
    status: "Available in Pro",
  },
  {
    name: "Campaign Proof API",
    label: "REST + webhooks",
    copy: "Send normalized campaign or deal data from any CRM, warehouse, form, workflow, or agent with idempotent source IDs.",
    status: "Developer access",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <Brand />
        <div className="nav-links">
          <Link href="/integrations">Integrations</Link>
          <Link href="/developers">API</Link>
          <Link className="button button-small" href="/toolkit">
            Pro report builder <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      <section className="hero section-shell">
        <div className="eyebrow"><span /> Campaign measurement for B2B marketers</div>
        <h1>Make every campaign<br />easier to defend.</h1>
        <p className="hero-copy">
          Turn campaign metrics into a defensible business case—with deal-cycle-aware attribution, transparent assumptions, and a report your clients and executives can use.
        </p>
        <div className="hero-actions">
          <a className="button" href="#calculator">
            Calculate campaign ROI <ArrowRight size={18} />
          </a>
          <Link className="text-link" href="/toolkit">
            See the Pro report builder <ArrowRight size={16} />
          </Link>
        </div>
        <div className="proof-list" aria-label="Campaign Proof capabilities">
          {proofPoints.map((point) => (
            <span key={point}><Check size={15} /> {point}</span>
          ))}
        </div>
      </section>

      <Calculator />

      <section className="connection-band">
        <div className="section-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="kicker">Workflow connections</p>
              <h2>Work where your revenue data already lives.</h2>
            </div>
            <p>
              Every sync keeps the CRM source ID, timestamps the import, and records
              exactly which fields informed the report.
            </p>
          </div>
          <div className="connector-grid">
            {connectors.map((connector, index) => (
              <article className="connector-card" key={connector.name}>
                <div className="connector-topline">
                  <span className="connector-index">0{index + 1}</span>
                  <span className="status-pill">{connector.status}</span>
                </div>
                <h3>{connector.name}</h3>
                <p className="connector-label">{connector.label}</p>
                <p>{connector.copy}</p>
                <Link href={connector.name === "Campaign Proof API" ? "/developers" : "/integrations"}>
                  {connector.name === "Campaign Proof API" ? "Read the API contract" : `Connect ${connector.name}`} <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell evidence-section">
        <div className="section-heading">
          <p className="kicker">AI can write a recap</p>
          <h2>Campaign Proof makes it defensible.</h2>
        </div>
        <div className="comparison-grid">
          <article className="comparison-card muted-card">
            <Braces size={24} />
            <p className="comparison-label">Generic AI prompt</p>
            <h3>A plausible answer</h3>
            <ul>
              <li>Starts with manually pasted data</li>
              <li>Changes when the prompt changes</li>
              <li>No durable source lineage</li>
              <li>No refreshable CRM connection</li>
            </ul>
          </article>
          <article className="comparison-card proof-card">
            <DatabaseZap size={24} />
            <p className="comparison-label">Campaign Proof</p>
            <h3>A reproducible evidence record</h3>
            <ul>
              <li><ShieldCheck size={15} /> OAuth connections with encrypted tokens</li>
              <li><RefreshCw size={15} /> Idempotent, refreshable source records</li>
              <li><Check size={15} /> Versioned methodology and attribution logic</li>
              <li><Check size={15} /> Saved history and branded reporting</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="cta-band">
        <div className="section-shell cta-inner">
          <div>
            <p className="kicker">Stop rebuilding the same report</p>
            <h2>Turn your CRM into a campaign evidence system.</h2>
          </div>
          <Link className="button button-light" href="/integrations">
            Open integrations <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="pricing-section section-shell" id="pricing">
        <div className="section-heading split-heading"><div><p className="kicker">One plan, complete evidence</p><h2>Keep calculating free. Upgrade when the report matters.</h2></div><p>The calculator remains free. Pro adds the repeatable reporting workflow, private history, and optional CRM connections.</p></div>
        <div className="pricing-card"><div><p className="connector-label">Campaign Proof Pro</p><h3>Report toolkit</h3><p className="price"><strong>$39</strong><span>/ month</span></p></div><ul><li><Check size={16}/> Vertical benchmarks and industry-specific scoring</li><li><Check size={16}/> Branded, editable multi-page PDF reports</li><li><Check size={16}/> Saved campaigns and comparison history</li><li><Check size={16}/> Full CVR methodology and source audit trail</li><li><Check size={16}/> Optional HubSpot, Salesforce, and API imports</li></ul><Link className="button" href="/account?return_to=/toolkit">Start with Pro <ArrowRight size={16}/></Link></div>
      </section>

      <footer>
        <div className="section-shell footer-inner">
          <Brand inverse />
          <p>Source-linked B2B campaign measurement.</p>
          <a href="mailto:support@getcampaignproof.com">support@getcampaignproof.com</a>
        </div>
      </footer>
    </main>
  );
}
