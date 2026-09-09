import { env } from "cloudflare:workers";

export type CrmProvider = "hubspot" | "salesforce";

export function runtimeValue(name: keyof Cloudflare.Env): string {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function requireRuntimeValue(name: keyof Cloudflare.Env): string {
  const value = runtimeValue(name);
  if (!value) throw new Error(`Campaign Proof is missing ${String(name)}.`);
  return value;
}

export function publicOrigin(request: Request): string {
  const configured = runtimeValue("PUBLIC_SITE_URL");
  if (configured) return new URL(configured).origin;
  return new URL(request.url).origin;
}

export function providerConfigured(provider: CrmProvider): boolean {
  if (provider === "hubspot") return Boolean(runtimeValue("HUBSPOT_CLIENT_ID") && runtimeValue("HUBSPOT_CLIENT_SECRET"));
  return Boolean(runtimeValue("SALESFORCE_CLIENT_ID") && runtimeValue("SALESFORCE_CLIENT_SECRET"));
}
