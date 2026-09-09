import { sha256 } from "./encoding";
import { supabaseRest, validateSupabaseAccessToken } from "./supabase-rest";

export type Viewer = { userId: string; email?: string };

function bearer(request: Request): string | null {
  const value = request.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : null;
}

export async function viewerFromRequest(request: Request): Promise<Viewer | null> {
  const platformUserId = request.headers.get("oai-authenticated-user-id");
  if (platformUserId) return { userId: platformUserId, email: request.headers.get("oai-authenticated-user-email") ?? undefined };
  const token = bearer(request);
  if (!token || token.startsWith("cp_")) return null;
  const user = await validateSupabaseAccessToken(token);
  return user ? { userId: user.id, email: user.email } : null;
}

export async function requireViewer(request: Request): Promise<Viewer> {
  const viewer = await viewerFromRequest(request);
  if (!viewer) throw new Response(JSON.stringify({ error: "Sign in is required." }), { status: 401, headers: { "content-type": "application/json" } });
  return viewer;
}

export async function apiKeyViewer(request: Request): Promise<Viewer | null> {
  const token = bearer(request);
  if (!token?.startsWith("cp_live_")) return null;
  const hash = await sha256(token);
  const rows = await supabaseRest<Array<{ id: number; user_id: string }>>(`api_keys?key_hash=eq.${encodeURIComponent(hash)}&revoked_at=is.null&select=id,user_id&limit=1`);
  const match = rows[0];
  if (!match) return null;
  void supabaseRest(`api_keys?id=eq.${match.id}`, { method: "PATCH", body: JSON.stringify({ last_used_at: new Date().toISOString() }), headers: { Prefer: "return=minimal" } });
  return { userId: match.user_id };
}
