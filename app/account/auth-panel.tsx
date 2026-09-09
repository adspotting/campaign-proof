"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { safeReturnTo, supabaseBrowser } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "forgot";

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const client = supabaseBrowser();

  useEffect(() => {
    void client?.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/integrations");
    });
  }, [client]);

  async function google() {
    setBusy(true); setError(null);
    if (!client) { setError("Authentication is not configured yet."); setBusy(false); return; }
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("return_to", safeReturnTo(new URLSearchParams(window.location.search).get("return_to")));
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (authError) { setError(authError.message); setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    if (!client) { setError("Authentication is not configured yet."); setBusy(false); return; }
    if (mode === "forgot") {
      const redirectTo = new URL("/account/reset", window.location.origin).toString();
      const { error: authError } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (authError) setError(authError.message);
      else setMessage("Check your email for a secure password-reset link.");
    } else if (mode === "signup") {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("return_to", "/integrations");
      const { data, error: authError } = await client.auth.signUp({ email, password, options: { emailRedirectTo: callback.toString() } });
      if (authError) setError(authError.message);
      else if (data.session) window.location.replace("/integrations");
      else setMessage("Check your email to confirm your account, then return to sign in.");
    } else {
      const { error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else window.location.replace(safeReturnTo(new URLSearchParams(window.location.search).get("return_to")));
    }
    setBusy(false);
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="kicker">Campaign Proof account</p>
      <h1 id="auth-title">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in to your workspace"}</h1>
      <p>{mode === "forgot" ? "We’ll email you a secure reset link." : "Save campaigns, connect your CRM, and keep every evidence record private."}</p>

      {mode !== "forgot" && <button className="google-button" type="button" disabled={busy} onClick={() => void google()}><span className="google-g">G</span> Continue with Google</button>}
      {mode !== "forgot" && <div className="auth-divider"><span>or use email</span></div>}

      <form className="auth-form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        {mode !== "forgot" && <label>Password<input type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
        {error && <p className="message message-error" role="alert">{error}</p>}
        {message && <p className="message" role="status"><CheckCircle2 size={16} /> {message}</p>}
        <button className="button auth-submit" disabled={busy} type="submit">{busy && <Loader2 className="animate-spin" size={16} />}{mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight size={16} /></button>
      </form>

      <div className="auth-links">
        {mode === "signin" && <><button onClick={() => setMode("forgot")}>Forgot password?</button><button onClick={() => setMode("signup")}>Create an account</button></>}
        {mode !== "signin" && <button onClick={() => setMode("signin")}>Back to sign in</button>}
      </div>
    </section>
  );
}
