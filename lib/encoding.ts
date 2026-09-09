const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function bytes(value: string): Uint8Array {
  return encoder.encode(value);
}

export function text(value: ArrayBuffer | Uint8Array): string {
  return decoder.decode(value);
}

export function toBase64Url(value: ArrayBuffer | Uint8Array): string {
  const data = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function sha256(value: string): Promise<string> {
  return toBase64Url(await crypto.subtle.digest("SHA-256", bytes(value)));
}
