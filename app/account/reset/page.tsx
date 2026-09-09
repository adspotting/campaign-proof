"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const client = supabaseBrowser();
    if (!client) { setError("Authentication is not configured yet."); return; }
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) setError(updateError.message); else setMessage("Your password has been updated. You can now return to your workspace.");
  }
  return <main className="auth-page"><section className="auth-card"><p className="kicker">Account recovery</p><h1>Choose a new password</h1><form className="auth-form" onSubmit={submit}><label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="message message-error">{error}</p>}{message && <p className="message">{message}</p>}<button className="button auth-submit" type="submit">Update password</button></form><Link className="text-link" href="/integrations">Return to workspace</Link></section></main>;
}
