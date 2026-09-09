import Link from "next/link";
import { getChatGPTUser } from "../chatgpt-auth";
import IntegrationWorkspace from "./integration-workspace";
import AccountControl from "./account-control";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getChatGPTUser();

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <nav className="nav-shell" aria-label="Primary navigation">
          <Link className="brand" href="/">
            <span className="brand-mark">CP<span className="mark-arrow">↗</span></span>
            <span>Campaign Proof</span>
          </Link>
          <div className="nav-links">
            <Link href="/developers">API docs</Link>
            <AccountControl platformSignedIn={Boolean(user)} />
          </div>
        </nav>
        <div className="section-shell workspace-intro">
          <div>
            <p className="kicker">Data connections</p>
            <h1>Your campaign<br />evidence pipeline.</h1>
          </div>
          <p>
            Connect once, then refresh the same source records whenever pipeline,
            opportunity value, or deal status changes.
          </p>
        </div>
      </header>
      <section className="section-shell workspace">
        <IntegrationWorkspace signedIn={Boolean(user)} />
      </section>
    </main>
  );
}
