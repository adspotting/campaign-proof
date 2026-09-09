import { publicOrigin, requireRuntimeValue } from "./runtime";

function form(values: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return body;
}

export async function createSubscriptionCheckout(request: Request, userId: string, email?: string) {
  const origin = publicOrigin(request);
  const values: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": requireRuntimeValue("STRIPE_PRICE_ID"),
    "line_items[0][quantity]": "1",
    success_url: `${origin}/toolkit?checkout=success`,
    cancel_url: `${origin}/toolkit?checkout=canceled`,
    client_reference_id: userId,
    "metadata[user_id]": userId,
    "subscription_data[metadata][user_id]": userId,
    integration_identifier: "campaignproof_qazwsxed",
  };
  if (email) values.customer_email = email;
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${requireRuntimeValue("STRIPE_RESTRICTED_KEY")}`, "content-type": "application/x-www-form-urlencoded" }, body: form(values) });
  const payload = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) throw new Error(payload.error?.message ?? "Checkout could not be created.");
  return payload.url;
}

function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export async function verifyStripeEvent(body: string, signature: string | null) {
  if (!signature) return false;
  const values = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2) as [string, string]));
  if (!values.t || !values.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(values.t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(requireRuntimeValue("STRIPE_WEBHOOK_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const actual = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${values.t}.${body}`)));
  if (actual.length !== values.v1.length) return false;
  let mismatch = 0; for (let index = 0; index < actual.length; index += 1) mismatch |= actual.charCodeAt(index) ^ values.v1.charCodeAt(index);
  return mismatch === 0;
}
