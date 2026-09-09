import Link from "next/link";
import AuthPanel from "./auth-panel";

export default function AccountPage() {
  return <main className="auth-page"><nav className="nav-shell"><Link className="brand" href="/"><span className="brand-mark">CP</span><span>Campaign Proof</span></Link></nav><AuthPanel /></main>;
}
