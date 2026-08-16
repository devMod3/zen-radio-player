import type { Diagnostic, ParsedPlaylist, Station, StreamType } from "../domain/player";

export function detectStreamType(url: string): StreamType {
  const clean = url.toLowerCase().split("?")[0];
  if (clean.endsWith(".m3u8")) return "HLS";
  if (clean.endsWith(".mp3") || clean.endsWith("/mp3")) return "MP3";
  if (clean.endsWith(".aac")) return "AAC";
  if (/^https?:\/\//.test(clean)) return "STREAM";
  return "UNKNOWN";
}

function stationId(index: number): string {
  return `station-${String(index + 1).padStart(2, "0")}`;
}

function diagnose(station: Station): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  try {
    const parsed = new URL(station.streamUrl);
    if (parsed.protocol !== "https:") diagnostics.push({ entry: station.name, status: "WARNING", message: "El enlace no usa HTTPS." });
    if (parsed.searchParams.get("zt")) diagnostics.push({ entry: station.name, status: "WARNING", message: "El enlace contiene un token temporal." });
  } catch {
    diagnostics.push({ entry: station.name || station.id, status: "INVALID", message: "La URL no tiene una estructura válida." });
  }
  if (station.type === "STREAM") diagnostics.push({ entry: station.name, status: "WARNING", message: "Tipo sin extensión: detectar mediante Content-Type." });
  return diagnostics;
}

export function parseM3u(content: string): ParsedPlaylist {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim());
  const stations: Station[] = [];
  const diagnostics: Diagnostic[] = [];
  let pendingName = "";
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#EXTINF:")) {
      const comma = line.indexOf(",");
      pendingName = comma >= 0 ? line.slice(comma + 1).trim() : "";
    } else if (!line.startsWith("#") && /^https?:\/\//i.test(line)) {
      const station: Station = { id: stationId(stations.length), name: pendingName || `Emisora ${stations.length + 1}`, streamUrl: line, type: detectStreamType(line) };
      stations.push(station);
      diagnostics.push(...diagnose(station));
      pendingName = "";
    }
  }
  if (!stations.length) diagnostics.push({ entry: "Archivo", status: "INVALID", message: "No se detectaron URLs reproducibles." });
  return { stations, diagnostics };
}

export function parseText(content: string): ParsedPlaylist {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const raw = Array.isArray(parsed) ? parsed : parsed.stations;
      if (!Array.isArray(raw)) throw new Error();
      const stations: Station[] = raw.map((item, index) => ({ id: item.id || stationId(index), name: item.name || `Emisora ${index + 1}`, streamUrl: item.streamUrl || item.url || "", type: detectStreamType(item.streamUrl || item.url || "") }));
      return { stations, diagnostics: stations.flatMap(diagnose) };
    } catch {
      return { stations: [], diagnostics: [{ entry: "JSON", status: "INVALID", message: "El JSON no puede interpretarse como playlist." }] };
    }
  }
  return parseM3u(trimmed);
}
