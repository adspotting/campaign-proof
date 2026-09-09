import Link from "next/link";
import ReportBuilder from "./report-builder";
import Brand from "@/components/brand";

export default function ToolkitPage() {
  return <main className="workspace-page"><header className="workspace-header compact-header"><nav className="nav-shell"><Brand inverse /><div className="nav-links"><Link href="/integrations">Integrations</Link><Link href="/">Calculator</Link></div></nav><div className="section-shell workspace-intro"><div><p className="kicker">Pro report toolkit</p><h1>Build the proof.<br/>Keep the evidence.</h1></div><p>Customize, save, compare, and export reports with a permanent record of the methodology behind them.</p></div></header><section className="section-shell toolkit-shell"><ReportBuilder /></section></main>;
}
