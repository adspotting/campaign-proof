import Link from "next/link";
import AuthPanel from "./auth-panel";
import Brand from "@/components/brand";

export default function AccountPage() {
  return <main className="auth-page"><nav className="nav-shell"><Brand /><Link href="/">Back to calculator</Link></nav><AuthPanel /></main>;
}
