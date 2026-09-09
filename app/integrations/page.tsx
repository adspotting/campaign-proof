import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import IntegrationWorkspace from "./integration-workspace";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getChatGPTUser();

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <nav className="nav-shell" aria-label="Primary navigation">
          <Link className="brand" href="/">
            <span className="brand-mark">CP</span>
            <span>Campaign Proof</span>
          </Link>
          <div className="nav-links">
            <Link href="/developers">API docs</Link>
            {user ? (
              <span className="status-pill">Signed in</span>
            ) : (
              <a className="button button-small button-light" href={chatGPTSignInPath("/integrations")} target="_top">
                Sign in <ArrowRight size={15} />
              </a>
            )}
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
