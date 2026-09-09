import { requireViewer } from "@/lib/auth";
import { sha256, toBase64Url } from "@/lib/encoding";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const keys = await supabaseRest(`api_keys?user_id=eq.${encodeURIComponent(viewer.userId)}&select=id,name,key_prefix,last_four,last_used_at,revoked_at,created_at&order=created_at.desc`);
    return Response.json({ keys });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not load API keys." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const body = await request.json().catch(() => ({})) as { name?: string };
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "Primary integration";
    const secretBytes = crypto.getRandomValues(new Uint8Array(32));
    const key = `cp_live_${toBase64Url(secretBytes)}`;
    const record = { user_id: viewer.userId, name, key_prefix: key.slice(0, 15), key_hash: await sha256(key), last_four: key.slice(-4) };
    const rows = await supabaseRest<Array<{ id: number }>>("api_keys?select=id", { method: "POST", body: JSON.stringify(record), headers: { Prefer: "return=representation" } });
    return Response.json({ id: rows[0]?.id, key, name }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Could not create API key." }, { status: 500 });
  }
}
