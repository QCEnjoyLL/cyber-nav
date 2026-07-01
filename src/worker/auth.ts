export const SESSION_COOKIE = "cyber_nav_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SecretEnv = Env & {
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
};

interface SessionPayload {
  iat: number;
  exp: number;
  nonce: string;
}

const encoder = new TextEncoder();

export function getSecret(env: SecretEnv, name: "ADMIN_PASSWORD_HASH" | "SESSION_SECRET"): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required Worker secret: ${name}`);
  }
  return value;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [scheme, iterationsText, saltBase64, hashBase64] = storedHash.split("$");
    if (scheme !== "pbkdf2_sha256" || !iterationsText || !saltBase64 || !hashBase64) {
      return false;
    }

    const iterations = Number(iterationsText);
    if (!Number.isInteger(iterations) || iterations < 100_000) return false;

    const expectedHash = base64ToBytes(hashBase64);
    const salt = base64ToBytes(saltBase64);
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: toArrayBuffer(salt),
        iterations,
      },
      keyMaterial,
      expectedHash.byteLength * 8,
    );

    return timingSafeEqualBytes(new Uint8Array(derivedBits), expectedHash);
  } catch {
    return false;
  }
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const payload: SessionPayload = {
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
    nonce: crypto.randomUUID(),
  };
  const payloadText = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(payloadText, secret);
  return `${payloadText}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [payloadText, signature] = token.split(".");
  if (!payloadText || !signature) return false;

  const expectedSignature = await sign(payloadText, secret);
  const signatureMatches = await timingSafeEqualText(signature, expectedSignature);
  if (!signatureMatches) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadText))) as Partial<SessionPayload>;
    return typeof payload.exp === "number" && payload.exp > now;
  } catch {
    return false;
  }
}

export async function hashClientId(rawClientId: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${secret}:${rawClientId}`));
  return base64UrlEncode(new Uint8Array(digest));
}

async function sign(payloadText: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadText));
  return base64UrlEncode(new Uint8Array(signature));
}

async function timingSafeEqualText(a: string, b: string): Promise<boolean> {
  return timingSafeEqualBytes(encoder.encode(a), encoder.encode(b));
}

export async function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): Promise<boolean> {
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", toArrayBuffer(a)),
    crypto.subtle.digest("SHA-256", toArrayBuffer(b)),
  ]);
  const left = new Uint8Array(aHash);
  const right = new Uint8Array(bHash);
  let diff = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return base64ToBytes(padded);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
