"use client";

import Hls from "hls.js";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { initialStations } from "../data/stations";
import type { Diagnostic, ParsedPlaylist, PlaybackState, Station } from "../domain/player";
import { detectStreamType, parseText } from "../lib/playlist";

type Visibility = "CLOSED" | "OPEN" | "MINIMIZED";
type Surface = "PLAYER" | "EDITOR";
const EMPTY_IMPORT: ParsedPlaylist = { stations: [], diagnostics: [] };

export default function RadioApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [selected, setSelected] = useState<Station | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>("EMPTY");
  const [visibility, setVisibility] = useState<Visibility>("CLOSED");
  const [surface, setSurface] = useState<Surface>("PLAYER");
  const [playlistOpen, setPlaylistOpen] = useState(true);
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 72;
    const stored = Number(window.localStorage.getItem("zuma-player-volume"));
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 72;
  });
  const [resumeOnOpen, setResumeOnOpen] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("zuma-player-resume") === "true",
  );
  const [query, setQuery] = useState("");
  const [importMode, setImportMode] = useState<"FILE" | "URL" | "TEXT">("FILE");
  const [directUrl, setDirectUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [importResult, setImportResult] = useState<ParsedPlaylist>(EMPTY_IMPORT);
  const [importStatus, setImportStatus] = useState("Sin análisis pendiente");

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    localStorage.setItem("zuma-player-volume", String(volume));
  }, [volume]);

  useEffect(() => () => {
    hlsRef.current?.destroy();
    audioRef.current?.pause();
  }, []);

  const visibleStations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? stations.filter((station) => station.name.toLocaleLowerCase().includes(normalized)) : stations;
  }, [query, stations]);

  function releaseCurrentSource() {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  async function selectStation(station: Station) {
    const audio = audioRef.current;
    if (!audio) return;
    releaseCurrentSource();
    setSelected(station);
    setPlayback("LOADING");
    localStorage.setItem("zuma-player-last-station", station.id);
    try {
      if (station.type === "HLS" && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.attachMedia(audio);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(station.streamUrl));
        hls.on(Hls.Events.MANIFEST_PARSED, () => void audio.play());
        hls.on(Hls.Events.ERROR, (_event, data) => data.fatal && setPlayback("ERROR"));
      } else {
        audio.src = station.streamUrl;
        await audio.play();
      }
    } catch {
      setPlayback("ERROR");
    }
  }

  async function openPlayer() {
    setVisibility("OPEN");
    setPlaylistOpen(true);
    setSurface("PLAYER");
    if (resumeOnOpen && !selected) {
      const lastId = localStorage.getItem("zuma-player-last-station");
      const last = stations.find((station) => station.id === lastId);
      if (last) await selectStation(last);
    }
  }

  function closePlayer() {
    releaseCurrentSource();
    setSelected(null);
    setPlayback("EMPTY");
    setVisibility("CLOSED");
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      setPlayback("ERROR");
    }
  }

  function nextStation(direction: -1 | 1) {
    if (!stations.length) return;
    const current = selected ? stations.findIndex((item) => item.id === selected.id) : -1;
    const index = (current + direction + stations.length) % stations.length;
    void selectStation(stations[index]);
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus(`Leyendo ${file.name}`);
    const result = parseText(await file.text());
    setImportResult(result);
    setImportStatus(`${result.stations.length} entradas detectadas`);
  }

  function analyzeUrl() {
    const value = directUrl.trim();
    const diagnostics: Diagnostic[] = [];
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") diagnostics.push({ entry: value, status: "WARNING", message: "Se recomienda HTTPS." });
      if (url.searchParams.has("zt")) diagnostics.push({ entry: value, status: "WARNING", message: "El enlace parece contener un token temporal." });
      setImportResult({ stations: [{ id: "url-01", name: url.hostname, streamUrl: value, type: detectStreamType(value) }], diagnostics });
      setImportStatus("URL válida; acceso remoto pendiente de prueba");
    } catch {
      setImportResult({ stations: [], diagnostics: [{ entry: value || "URL", status: "INVALID", message: "La URL no es válida." }] });
      setImportStatus("Enlace inválido");
    }
  }

  function analyzeText() {
    const result = parseText(textInput);
    setImportResult(result);
    setImportStatus(`${result.stations.length} entradas detectadas`);
  }

  function applyImport() {
    if (!importResult.stations.length || importResult.diagnostics.some((item) => item.status === "INVALID")) return;
    setStations(importResult.stations);
    setImportStatus(`${importResult.stations.length} entradas aplicadas a la sesión local`);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ version: 1, stations }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "playlist.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="site-shell">
      <header className="institution-header"><div className="seal">ZR</div><div><p className="eyebrow">Sistema personal de reproducción</p><h1>Zen Radio Player</h1></div><span className="build-label">PROTOTIPO 0.1</span></header>
      <section className="briefing"><p className="section-code">AUDIO / EMISORAS</p><h2>Una función de radio independiente del sitio.</h2><p>Esta página representa el blog. El reproductor permanece fuera de la interfaz hasta que el usuario decide abrirlo.</p><div className="launch-actions"><button className="primary-action" onClick={() => void openPlayer()}>Abrir reproductor</button><button className="secondary-action" onClick={() => { setSurface("EDITOR"); setVisibility("OPEN"); }}>Abrir editor local</button></div></section>
      <section className="document-grid"><article><span>01</span><h3>37 emisoras reales</h3><p>Importadas desde la playlist proporcionada.</p></article><article><span>02</span><h3>Lectura pública</h3><p>La playlist no expone operaciones de edición.</p></article><article><span>03</span><h3>Control local</h3><p>Importación y exportación permanecen en el editor.</p></article></section>

      <audio ref={audioRef} onPlaying={() => setPlayback("PLAYING")} onPause={() => selected && setPlayback("PAUSED")} onWaiting={() => setPlayback("BUFFERING")} onError={() => setPlayback("ERROR")} />

      {visibility === "MINIMIZED" && <div className="mini-player"><span className={`status-dot ${playback === "PLAYING" ? "active" : ""}`} /><span>{selected?.name || "Radio"}</span><button onClick={() => setVisibility("OPEN")}>Restaurar</button><button onClick={closePlayer} aria-label="Cerrar">×</button></div>}

      {visibility === "OPEN" && <section className="player-window">
        <nav className="surface-tabs"><button className={surface === "PLAYER" ? "active" : ""} onClick={() => setSurface("PLAYER")}>Reproductor</button><button className={surface === "EDITOR" ? "active" : ""} onClick={() => setSurface("EDITOR")}>Editor local</button><span className="window-spacer" /><button onClick={() => setVisibility("MINIMIZED")} aria-label="Minimizar">—</button><button onClick={closePlayer} aria-label="Cerrar">×</button></nav>

        {surface === "PLAYER" ? <div className={`player-layout ${playlistOpen ? "with-playlist" : ""}`}>
          <div className="player-main"><div className="signal-line"><span className={`status-dot ${playback === "PLAYING" ? "active" : ""}`} /><strong>{playback === "PLAYING" ? "EN DIRECTO" : playback}</strong><span>{selected?.type || "SIN FUENTE"}</span><span className="signal-note">Metadatos: pendiente de verificación</span></div>
            <div className="transport-line"><div className="station-identity"><div className="station-mark">ZR</div><div><strong>{selected?.name || "Seleccione una emisora"}</strong><span>{selected ? "Información del programa pendiente" : "La playlist está preparada"}</span></div></div>
              <div className="transport-controls"><button onClick={() => nextStation(-1)}>Anterior</button><button className="play-control" onClick={() => void togglePlayback()} disabled={!selected}>{playback === "PLAYING" ? "Pausa" : "Reproducir"}</button><button onClick={() => nextStation(1)}>Siguiente</button></div>
              <div className="volume-control"><label htmlFor="volume">Volumen {volume}</label><input id="volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /><button onClick={() => setPlaylistOpen((value) => !value)}>{playlistOpen ? "Ocultar lista" : "Mostrar lista"}</button></div></div>
            <div className="preference-line"><label><input type="checkbox" checked={resumeOnOpen} onChange={(event) => { setResumeOnOpen(event.target.checked); localStorage.setItem("zuma-player-resume", String(event.target.checked)); }} /> Continuar la última emisora al abrir</label>{playback === "ERROR" && <button onClick={() => selected && void selectStation(selected)}>Reintentar conexión</button>}</div></div>
          {playlistOpen && <aside className="playlist-panel"><div className="playlist-header"><div><strong>Emisoras</strong><span>{visibleStations.length} disponibles</span></div><span className="read-badge">LECTURA</span></div><label className="search-field"><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre de emisora" /></label><div className="station-list">{visibleStations.map((station) => <button key={station.id} className={selected?.id === station.id ? "selected" : ""} onClick={() => void selectStation(station)}><span>{station.name}</span><small>{station.type}</small></button>)}</div></aside>}
        </div> : <div className="editor-surface">
          <header className="editor-header"><div><strong>Editor privado de playlist</strong><span>Cambios locales y bajo confirmación</span></div><span className="admin-badge">ADMINISTRADOR</span></header>
          <div className="import-tabs">{(["FILE", "URL", "TEXT"] as const).map((mode) => <button key={mode} className={importMode === mode ? "active" : ""} onClick={() => setImportMode(mode)}>{mode === "FILE" ? "Archivo" : mode === "URL" ? "Enlace directo" : "Texto pegado"}</button>)}<button disabled>Nube · futuro</button></div>
          <div className="import-input">{importMode === "FILE" && <label><span>M3U, M3U8, TXT o JSON</span><input type="file" accept=".m3u,.m3u8,.txt,.json" onChange={(event) => void readFile(event)} /></label>}{importMode === "URL" && <><label><span>Stream o playlist remota</span><input type="url" value={directUrl} onChange={(event) => setDirectUrl(event.target.value)} placeholder="https://servidor/stream" /></label><button className="primary-action" onClick={analyzeUrl}>Revisar enlace</button></>}{importMode === "TEXT" && <><label><span>URLs, M3U o JSON</span><textarea value={textInput} onChange={(event) => setTextInput(event.target.value)} rows={4} /></label><button className="primary-action" onClick={analyzeText}>Analizar texto</button></>}</div>
          <div className="review-header"><div><strong>Revisión previa</strong><span>{importStatus}</span></div><span className="read-badge">SIN CAMBIOS AUTOMÁTICOS</span></div>
          <div className="review-table-wrap"><table className="review-table"><thead><tr><th>Entrada</th><th>Tipo</th><th>Estado</th><th>Sugerencia</th></tr></thead><tbody>{(importResult.stations.length ? importResult.stations.slice(0, 6) : stations.slice(0, 4)).map((station) => { const issue = importResult.diagnostics.find((item) => item.entry === station.name || item.entry === station.id); return <tr key={station.id}><td>{station.name}</td><td>{station.type}</td><td>{issue?.status || "VALID"}</td><td>{issue?.message || "Lista para utilizar"}</td></tr>; })}</tbody></table></div>
          <footer className="editor-actions"><span>Original preservado · {stations.length} emisoras en la sesión</span><div><button onClick={applyImport} disabled={!importResult.stations.length}>Aplicar importación</button><button className="primary-action" onClick={exportJson}>Exportar JSON</button></div></footer>
        </div>}
      </section>}
    </main>
  );
}
