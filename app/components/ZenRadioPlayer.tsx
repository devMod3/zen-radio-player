"use client";

import type HlsInstance from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { initialStations } from "../data/stations";
import type { PlaybackState, Station } from "../domain/player";

type Visibility = "CLOSED" | "OPEN" | "MINIMIZED";
type SidebarSide = "LEFT" | "RIGHT";
const APP_VERSION = "1.0";

export const ZEN_PLAYER_OPEN_EVENT = "zen-radio-player:open";

export interface ZenRadioPlayerProps {
  playlistEndpoint?: string | null;
}

function Icon({ name }: { name: "radio" | "broadcast" | "previous" | "play" | "pause" | "next" | "volume" | "mute" | "list" | "settings" | "minimize" | "close" | "search" }) {
  const paths = {
    radio: <><path d="M4 9h16v10H4z"/><path d="m7 9 9-5"/><circle cx="9" cy="14" r="2.5"/><path d="M15 13h2M15 16h3"/></>,
    broadcast: <><circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none"/><path d="M8.46 8.46a5 5 0 0 0 0 7.08M15.54 8.46a5 5 0 0 1 0 7.08M5.64 5.64a9 9 0 0 0 0 12.72M18.36 5.64a9 9 0 0 1 0 12.72"/></>,
    previous: <><path d="M6 5v14"/><path d="m18 6-9 6 9 6z"/></>,
    play: <path d="m8 5 11 7-11 7z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    next: <><path d="M18 5v14"/><path d="m6 6 9 6-9 6z"/></>,
    volume: <><path d="M5 10v4h4l5 4V6l-5 4z"/><path d="M17 9a4 4 0 0 1 0 6"/></>,
    mute: <><path d="M5 10v4h4l5 4V6l-5 4z"/><path d="m17 10 4 4M21 10l-4 4"/></>,
    list: <><path d="M9 7h10M9 12h10M9 17h10"/><circle cx="5" cy="7" r=".5"/><circle cx="5" cy="12" r=".5"/><circle cx="5" cy="17" r=".5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></>,
    minimize: <path d="M6 12h12"/>,
    close: <path d="m7 7 10 10M17 7 7 17"/>,
    search: <><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></>,
  };
  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function ZenRadioPlayer({ playlistEndpoint = "/api/playlist" }: ZenRadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [selected, setSelected] = useState<Station | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>("EMPTY");
  const [visibility, setVisibility] = useState<Visibility>("CLOSED");
  const [playlistOpen, setPlaylistOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [sidebarSide] = useState<SidebarSide>(() =>
    typeof window !== "undefined" && window.localStorage.getItem("zen-sidebar-side") === "LEFT" ? "LEFT" : "RIGHT",
  );
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const previousVolumeRef = useRef(50);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const open = () => {
      setVisibility("OPEN");
      setPlaylistOpen(true);
    };
    window.addEventListener(ZEN_PLAYER_OPEN_EVENT, open);
    return () => window.removeEventListener(ZEN_PLAYER_OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      setAdminMode(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    if (!playlistEndpoint) return;
    let active = true;
    let etag = "";
    const synchronize = async () => {
      try {
        const response = await fetch(playlistEndpoint, { headers: etag ? { "If-None-Match": etag } : {} });
        if (response.status === 304) return;
        if (!response.ok) throw new Error("Playlist unavailable");
        const document = await response.json() as { stations?: Station[] };
        if (!active || !Array.isArray(document.stations)) return;
        etag = response.headers.get("etag") ?? "";
        setStations(document.stations);
        setSelected((current) => current ? document.stations?.find((station) => station.id === current.id) ?? null : null);
      } catch {
        // La copia incluida mantiene operativo el reproductor durante una caída temporal.
      }
    };
    void synchronize();
    const interval = window.setInterval(() => void synchronize(), 7000);
    return () => { active = false; window.clearInterval(interval); };
  }, [playlistEndpoint]);

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
      if (station.type === "HLS") {
        const { default: Hls } = await import("hls.js");
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.attachMedia(audio);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(station.streamUrl));
          hls.on(Hls.Events.MANIFEST_PARSED, () => void audio.play());
          hls.on(Hls.Events.ERROR, (_event, data) => data.fatal && setPlayback("ERROR"));
          return;
        }
      }
      audio.src = station.streamUrl;
      await audio.play();
    } catch {
      setPlayback("ERROR");
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

  function toggleMute() {
    if (muted || volume === 0) {
      setMuted(false);
      if (volume === 0) setVolume(previousVolumeRef.current || 50);
      return;
    }
    previousVolumeRef.current = volume;
    setMuted(true);
  }

  return (
    <div className="zen-radio-root">
      <audio ref={audioRef} onPlaying={() => setPlayback("PLAYING")} onPause={() => selected && setPlayback("PAUSED")} onWaiting={() => setPlayback("BUFFERING")} onError={() => setPlayback("ERROR")} />

      {visibility === "MINIMIZED" && <button className="mini-player" onClick={() => setVisibility("OPEN")} aria-label="Restaurar reproductor"><span className={`mini-status ${playback === "PLAYING" ? "active" : ""}`}><Icon name="broadcast" /></span><span>{selected?.name || "Zen Radio Player"}</span></button>}

      {visibility === "OPEN" && <section className={`player-system side-${sidebarSide.toLowerCase()}`}>
        {aboutOpen && <aside id="zen-radio-about" className="about-card" aria-label="Acerca de Zen Radio Player">
          <button className="about-close" onClick={() => setAboutOpen(false)} aria-label="Cerrar información"><Icon name="close" /></button>
          <header className="about-card-header"><div className="about-brand"><small>APLICACIÓN</small><strong>Zen Radio Player</strong></div><span className="about-version">Versión {APP_VERSION}</span></header>
          <section className="about-section"><small>PROPÓSITO</small><p><strong>Zen Radio Player</strong> es un reproductor web diseñado para integrarse con cualquier sitio.</p></section>
          <footer className="about-footer"><span className="creator-credit">Creado por: <a href="https://github.com/devMod3" target="_blank" rel="noreferrer">devMod3</a></span><a className="sponsor-link" href="https://movimientoc40.com" target="_blank" rel="noreferrer">Sponsor</a></footer>
        </aside>}
        {playlistOpen && <aside className="playlist-panel"><div className="playlist-header"><div><strong>Lista de reproducción</strong><span>{visibleStations.length} emisoras</span></div>{adminMode && <div className="playlist-access"><button onClick={() => window.open("http://127.0.0.1:4174", "zen-radio-admin")}><Icon name="settings" /><span>Administrar</span></button></div>}</div><label className="search-field"><Icon name="search" /><input aria-label="Buscar emisora" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar emisora" /></label><div className="station-list">{visibleStations.map((station) => <button key={station.id} className={selected?.id === station.id ? "selected" : ""} onClick={() => void selectStation(station)} title={station.name}><span>{station.name}</span><small>{station.type}</small></button>)}</div></aside>}

        <div className="player-bar">
          <div className="station-identity"><span className={`broadcast-status ${playback === "PLAYING" ? "active" : ""}`}><Icon name="broadcast" /></span><div className="station-scroll"><strong>{selected?.name || "Seleccione una emisora"}</strong></div></div>
          <div className="transport-controls"><button onClick={() => nextStation(-1)} aria-label="Emisora anterior" title="Anterior"><Icon name="previous" /></button><button className="play-control" onClick={() => void togglePlayback()} disabled={!selected} aria-label={playback === "PLAYING" ? "Pausar" : "Reproducir"} title={playback === "PLAYING" ? "Pausar" : "Reproducir"}><Icon name={playback === "PLAYING" ? "pause" : "play"} /></button><button onClick={() => nextStation(1)} aria-label="Emisora siguiente" title="Siguiente"><Icon name="next" /></button></div>
          <div className="player-tools"><button onClick={toggleMute} aria-label={muted || volume === 0 ? "Activar sonido" : "Silenciar"} title={muted || volume === 0 ? "Activar sonido" : "Silenciar"}><Icon name={muted || volume === 0 ? "mute" : "volume"} /></button><label className="volume-control" title={`Volumen ${muted ? 0 : volume}%`}><input aria-label="Volumen" type="range" min="0" max="100" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); setMuted(false); if (value > 0) previousVolumeRef.current = value; }} /></label><button className={`playlist-toggle${playlistOpen ? " active" : ""}`} onClick={() => setPlaylistOpen((value) => !value)} aria-label="Lista de reproducción" aria-pressed={playlistOpen} title="Lista de reproducción"><Icon name="list" /></button><button className="about-trigger" onClick={() => setAboutOpen((value) => !value)} aria-expanded={aboutOpen} aria-controls="zen-radio-about">Zen Radio Player</button><button onClick={() => setVisibility("MINIMIZED")} aria-label="Minimizar" title="Minimizar"><Icon name="minimize" /></button><button onClick={closePlayer} aria-label="Cerrar" title="Cerrar"><Icon name="close" /></button></div>
        </div>
      </section>}
    </div>
  );
}
