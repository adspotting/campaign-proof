import { bytes, fromBase64Url, text, toBase64Url } from "./encoding";
import { requireRuntimeValue } from "./runtime";

async function encryptionKey(): Promise<CryptoKey> {
  const material = await crypto.subtle.digest("SHA-256", bytes(requireRuntimeValue("CRM_TOKEN_ENCRYPTION_KEY")));
  return crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), bytes(value));
  return `${toBase64Url(iv)}.${toBase64Url(ciphertext)}`;
}

export async function decryptToken(value: string): Promise<string> {
  const [iv, ciphertext] = value.split(".");
  if (!iv || !ciphertext) throw new Error("Stored CRM token is invalid.");
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(iv) }, await encryptionKey(), fromBase64Url(ciphertext));
  return text(plaintext);
}

export async function signState(payload: Record<string, unknown>): Promise<string> {
  const encoded = toBase64Url(bytes(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey("raw", bytes(requireRuntimeValue("CRM_STATE_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, bytes(encoded));
  return `${encoded}.${toBase64Url(signature)}`;
}

export async function verifyState<T extends { exp: number }>(state: string): Promise<T> {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) throw new Error("OAuth state is malformed.");
  const key = await crypto.subtle.importKey("raw", bytes(requireRuntimeValue("CRM_STATE_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), bytes(encoded));
  if (!valid) throw new Error("OAuth state signature is invalid.");
  const payload = JSON.parse(text(fromBase64Url(encoded))) as T;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error("OAuth state has expired.");
  return payload;
}
