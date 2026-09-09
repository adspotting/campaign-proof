import { requireRuntimeValue } from "./runtime";

type QueryValue = string | number | boolean | null | undefined;

function baseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("apikey", requireRuntimeValue("SUPABASE_SECRET_KEY"));
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return headers;
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(`/rest/v1/${path}`, requireRuntimeValue("SUPABASE_URL"));
  const response = await fetch(url, { ...init, headers: baseHeaders(init.headers) });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase REST error", response.status, detail.slice(0, 500));
    throw new Error(`The data service returned ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function queryString(values: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  return params.toString();
}

export async function validateSupabaseAccessToken(token: string): Promise<{ id: string; email?: string } | null> {
  const url = new URL("/auth/v1/user", requireRuntimeValue("SUPABASE_URL"));
  const response = await fetch(url, {
    headers: {
      apikey: requireRuntimeValue("SUPABASE_PUBLISHABLE_KEY"),
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string; email?: string };
  return user.id ? { id: user.id, email: user.email } : null;
}
