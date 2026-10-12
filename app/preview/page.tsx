import Brand from "@/components/brand";
import FreeReportPreview from "./preview-report";

export default function PreviewPage() {
  return <main className="workspace-page"><header className="workspace-header compact-header"><nav className="nav-shell"><Brand inverse /><div className="nav-links"><a href="/integrations">Integrations</a><a href="/">Calculator</a></div></nav><div className="section-shell workspace-intro"><div><p className="kicker">Free report preview</p><h1>See the story.<br/>Then decide.</h1></div><p>Review one saved, watermarked campaign report before choosing whether Campaign Proof Pro belongs in your workflow.</p></div></header><section className="section-shell preview-shell"><FreeReportPreview /></section></main>;
}
