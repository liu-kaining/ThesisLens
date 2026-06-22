export const AUTH_COOKIE_NAME = "thesislens_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type AuthSession = {
  subject: string;
  role: "admin" | "viewer";
  issuedAt: number;
  expiresAt: number;
};

const encoder = new TextEncoder();

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET && getAdminPassphrase());
}

export function isInternalTokenConfigured() {
  return Boolean(process.env.INTERNAL_API_TOKEN);
}

export function getAuthConfigStatus() {
  return {
    authConfigured: isAuthConfigured(),
    internalTokenConfigured: isInternalTokenConfigured(),
    adminPassphraseConfigured: Boolean(getAdminPassphrase())
  };
}

export function verifyAdminPassphrase(passphrase: string) {
  const adminPassphrase = getAdminPassphrase();
  return Boolean(adminPassphrase && passphrase === adminPassphrase);
}

export function verifyInternalToken(value: string | null) {
  return Boolean(process.env.INTERNAL_API_TOKEN && value && value === process.env.INTERNAL_API_TOKEN);
}

export async function createSessionToken(subject: string, role: AuthSession["role"], now = Date.now()) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const payload: AuthSession = {
    subject,
    role,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<AuthSession | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const valid = await verifySignature(encodedPayload, signature, secret);
  if (!valid) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSession;
    if (payload.role !== "admin" && payload.role !== "viewer") return null;
    if (!payload.subject || !payload.expiresAt || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAdminPassphrase() {
  return process.env.ADMIN_PASSPHRASE ?? process.env.ADMIN_PASSWORD;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(value: string, signature: string, secret: string) {
  const expected = await sign(value, secret);
  return expected === signature;
}

function base64UrlEncode(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
