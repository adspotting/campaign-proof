"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AccountControl({ platformSignedIn }: { platformSignedIn: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    const client = supabaseBrowser();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = client.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (platformSignedIn) return <span className="status-pill">Signed in</span>;
  if (!email) return <Link className="button button-small button-light" href="/account?return_to=/integrations">Sign in</Link>;
  return <div className="account-control"><span className="status-pill">{email}</span><button onClick={async () => { await supabaseBrowser()?.auth.signOut(); window.location.replace("/"); }}>Sign out</button></div>;
}
