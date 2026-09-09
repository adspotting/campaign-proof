"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { safeReturnTo, supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const run = async () => {
      const client = supabaseBrowser();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!client || !code) { setError("This sign-in link is invalid or authentication is not configured."); return; }
      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) { setError(exchangeError.message); return; }
      window.location.replace(safeReturnTo(params.get("return_to")));
    };
    void run();
  }, []);
  return <main className="auth-page"><section className="auth-card auth-callback">{error ? <><h1>We couldn’t complete sign-in.</h1><p className="message message-error">{error}</p><Link className="button" href="/account">Return to sign in</Link></> : <><Loader2 className="animate-spin" size={28} /><h1>Securing your session…</h1><p>You’ll be redirected to your workspace.</p></>}</section></main>;
}
