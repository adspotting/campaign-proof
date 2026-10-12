import AuthPanel from "./auth-panel";
import Brand from "@/components/brand";

export default function AccountPage() {
  return <main className="auth-page"><nav className="nav-shell"><Brand /><a href="/">Back to calculator</a></nav><AuthPanel /></main>;
}
