// HMAC-signed OAuth state for CSRF protection.
// We embed (userId, expiry) and sign with a server-only secret so an attacker
// cannot craft a `state` value pointing at another user's account.

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  const s =
    process.env.OAUTH_STATE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GOOGLE_FIT_CLIENT_SECRET;
  if (!s) throw new Error("OAUTH state secret not configured");
  return s;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(new Uint8Array(sig));
}

export async function signOAuthState(userId: string): Promise<string> {
  const expiry = Date.now() + STATE_TTL_MS;
  const payload = `${userId}.${expiry}`;
  const sig = await hmac(payload);
  return b64url(new TextEncoder().encode(payload)) + "." + sig;
}

export async function verifyOAuthState(
  state: string | null,
): Promise<{ ok: boolean; userId?: string; reason?: string }> {
  if (!state) return { ok: false, reason: "missing" };
  const parts = state.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  let payload: string;
  try {
    payload = new TextDecoder().decode(b64urlDecode(parts[0]));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const expected = await hmac(payload);
  // Timing-safe compare
  if (expected.length !== parts[1].length) return { ok: false, reason: "bad_sig" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts[1].charCodeAt(i);
  if (diff !== 0) return { ok: false, reason: "bad_sig" };
  const [userId, expiryStr] = payload.split(".");
  const expiry = Number(expiryStr);
  if (!userId || !Number.isFinite(expiry)) return { ok: false, reason: "malformed" };
  if (Date.now() > expiry) return { ok: false, reason: "expired" };
  return { ok: true, userId };
}
