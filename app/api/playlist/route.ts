import { initialStations } from "../../data/stations";
import { MAX_PLAYLIST_BYTES, SIGNATURE_WINDOW_SECONDS, canonicalSignatureInput, hmacHex, sha256Hex, timingSafeEqualHex, validatePlaylist } from "../../lib/playlist-api";

export const runtime = "edge";

interface StoredPlaylist { version: number; payload: string; content_hash: string; created_at: number }

const PUBLIC_READ_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-expose-headers": "etag",
};

async function runtimeEnv() {
  return (await import("cloudflare:workers")).env as unknown as { DB?: D1Database; ZEN_ADMIN_SECRET?: string };
}

async function database() {
  const env = await runtimeEnv();
  if (!env.DB) throw new Error("D1 binding DB is unavailable.");
  return env.DB;
}

function json(value: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(value, { status, headers: { "cache-control": "no-store", ...headers } });
}

async function latest(): Promise<StoredPlaylist | null> {
  return (await database()).prepare("SELECT version, payload, content_hash, created_at FROM playlist_versions ORDER BY version DESC LIMIT 1").first<StoredPlaylist>();
}

export async function GET(request: Request) {
  const stored = await latest();
  const payload = stored ? JSON.parse(stored.payload) : { stations: initialStations };
  const contentHash = stored?.content_hash ?? await sha256Hex(JSON.stringify(payload));
  const etag = `\"${contentHash}\"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...PUBLIC_READ_HEADERS, etag, "cache-control": "public, max-age=5, must-revalidate" } });
  return json({ ...payload, version: stored?.version ?? 0, contentHash, updatedAt: stored?.created_at ?? null }, 200, { ...PUBLIC_READ_HEADERS, etag, "cache-control": "public, max-age=5, must-revalidate" });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...PUBLIC_READ_HEADERS, "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "if-none-match", "access-control-max-age": "86400" } });
}

export async function PUT(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return json({ error: "Content-Type debe ser application/json." }, 415);
  const timestamp = request.headers.get("x-zen-timestamp") ?? "";
  const nonce = request.headers.get("x-zen-nonce") ?? "";
  const suppliedSignature = request.headers.get("x-zen-signature") ?? "";
  const timestampNumber = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestampNumber) || Math.abs(nowSeconds - timestampNumber) > SIGNATURE_WINDOW_SECONDS) return json({ error: "Solicitud vencida." }, 401);
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(nonce)) return json({ error: "Nonce inválido." }, 401);
  const secret = (await runtimeEnv()).ZEN_ADMIN_SECRET;
  if (!secret || secret.length < 32) return json({ error: "Edición remota no configurada." }, 503);
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_PLAYLIST_BYTES) return json({ error: "Documento demasiado grande." }, 413);
  const bodyHash = await sha256Hex(body);
  const expected = await hmacHex(secret, canonicalSignatureInput(timestamp, nonce, request.method, new URL(request.url).pathname, bodyHash));
  if (!timingSafeEqualHex(suppliedSignature, expected)) return json({ error: "Firma inválida." }, 401);
  let document;
  try { document = validatePlaylist(JSON.parse(body)); } catch (error) { return json({ error: error instanceof Error ? error.message : "Playlist inválida." }, 400); }
  const db = await database();
  const nowMs = Date.now();
  try {
    await db.batch([
      db.prepare("DELETE FROM request_nonces WHERE expires_at < ?").bind(nowMs),
      db.prepare("INSERT INTO request_nonces (nonce, expires_at) VALUES (?, ?)").bind(nonce, nowMs + SIGNATURE_WINDOW_SECONDS * 2000),
    ]);
  } catch {
    return json({ error: "Solicitud ya utilizada." }, 409);
  }
  const current = await latest();
  if (current?.content_hash === bodyHash) return json({ ok: true, version: current.version, contentHash: bodyHash, unchanged: true });
  const result = await db.prepare("INSERT INTO playlist_versions (payload, content_hash, created_at) VALUES (?, ?, ?) RETURNING version").bind(JSON.stringify(document), bodyHash, nowMs).first<{ version: number }>();
  return json({ ok: true, version: result?.version, contentHash: bodyHash }, 201);
}
