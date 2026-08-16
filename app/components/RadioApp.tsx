"use client";

import ZenRadioPlayer, { ZEN_PLAYER_OPEN_EVENT } from "./ZenRadioPlayer";

interface RadioAppProps {
  playlistEndpoint?: string | null;
}

export default function RadioApp({ playlistEndpoint = "/api/playlist" }: RadioAppProps) {
  function openPlayer() {
    window.dispatchEvent(new Event(ZEN_PLAYER_OPEN_EVENT));
  }

  return (
    <>
      <main className="site-shell">
        <header className="institution-header"><div className="seal">AC</div><div><p className="eyebrow">Sitio anfitrión de demostración</p><h1>Archivo Constitucional</h1></div></header>
        <section className="briefing"><p className="section-code">ANÁLISIS / INSTITUCIONES</p><h2>La arquitectura del Estado también determina sus límites.</h2><p>Este contenido simula una publicación independiente. Zen Radio Player permanece superpuesto sin ocultar la lectura y solo aparece cuando el visitante decide abrirlo.</p><div className="launch-actions"><button className="primary-action" onClick={openPlayer}>Abrir reproductor</button></div></section>
        <section className="document-grid"><article><span>01</span><h3>Constitución</h3><p>Normas, garantías y límites del poder público.</p></article><article><span>02</span><h3>Instituciones</h3><p>Competencias, controles y separación de poderes.</p></article><article><span>03</span><h3>Soberanía</h3><p>El ciudadano como origen de la autoridad política.</p></article></section>
      </main>
      <ZenRadioPlayer playlistEndpoint={playlistEndpoint} />
    </>
  );
}
