import Link from "next/link";
import ReportBuilder from "./report-builder";

export default function ToolkitPage() {
  return <main className="workspace-page"><header className="workspace-header compact-header"><nav className="nav-shell"><Link className="brand" href="/"><span className="brand-mark">CP<span className="mark-arrow">↗</span></span><span>Campaign Proof</span></Link><div className="nav-links"><Link href="/integrations">Integrations</Link><Link href="/">Calculator</Link></div></nav><div className="section-shell workspace-intro"><div><p className="kicker">Pro report toolkit</p><h1>Build the proof.<br/>Keep the evidence.</h1></div><p>Customize, save, compare, and export reports with a permanent record of the methodology behind them.</p></div></header><section className="section-shell toolkit-shell"><ReportBuilder /></section></main>;
}
