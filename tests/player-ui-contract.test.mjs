import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../app/components/RadioApp.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("publishes the stable product identity in the about surface", () => {
  assert.match(component, /const APP_VERSION = "1\.0"/);
  assert.match(component, /Versión \{APP_VERSION\}/);
  assert.match(component, /Creado por: <a href="https:\/\/github\.com\/devMod3"[^>]*>devMod3<\/a>/);
  assert.match(component, /href="https:\/\/movimientoc40\.com"[^>]*>Sponsor<\/a>/);
  assert.match(component, /Zen Radio Player<\/strong> es un reproductor web diseñado para integrarse con cualquier sitio\./);
  assert.doesNotMatch(component, /Código fuente en GitHub/);
  assert.doesNotMatch(component, /PROTOTIPO 0\.1/);
  assert.match(styles, /\.creator-credit a,\.about-footer \.sponsor-link \{[^}]*text-decoration:none;[^}]*cursor:pointer;/);
  assert.doesNotMatch(styles, /sponsor-link:hover[^}]*text-decoration:underline/);
});

test("keeps the broadcast glyph and its container geometrically centered", () => {
  assert.match(component, /broadcast: <><circle cx="12" cy="12"[^>]*fill="currentColor"[^>]*\/><path d="M8\.46 8\.46[^\"]*M15\.54 8\.46[^\"]*M5\.64 5\.64[^\"]*M18\.36 5\.64/);
  assert.match(styles, /\.broadcast-status \{[^}]*display:inline-flex!important;[^}]*align-items:center;[^}]*justify-content:center;[^}]*margin:0!important;[^}]*transform:translateY\(-3px\);/);
});

test("uses compact rectangular controls without circular button frames", () => {
  assert.match(styles, /\.transport-controls button,\.player-tools>button \{[^}]*border:0;[^}]*border-radius:4px;/);
  assert.match(styles, /\.transport-controls button:hover,\.player-tools>button:hover,\.player-tools>button\.active \{[^}]*background:var\(--control-hover\);/);
  assert.match(styles, /\.transport-controls \.play-control \{[^}]*border-radius:4px;/);
  assert.doesNotMatch(styles, /\.transport-controls button,[^{]*\{[^}]*border-radius:999px;/);
});

test("keeps playlist as an accessible icon-only control", () => {
  assert.match(component, /className=\{`playlist-toggle\$\{playlistOpen \? " active" : ""\}`\}/);
  assert.match(component, /aria-label="Lista de reproducción" aria-pressed=\{playlistOpen\} title="Lista de reproducción"/);
  assert.doesNotMatch(component, /<span>Lista de reproducción<\/span>/);
});

test("ships one official dark appearance without experimental palettes", () => {
  assert.doesNotMatch(component, /PALETA DE PRUEBA|Palette|data\.palette/);
  assert.doesNotMatch(styles, /data-palette|palette-control/);
  assert.match(styles, /\.player-bar \{[^}]*background:var\(--bar\);/);
});

test("keeps public playlist chrome free of redundant access labels", () => {
  assert.doesNotMatch(component, />LECTURA</);
  assert.doesNotMatch(styles, /read-badge/);
});

test("can disable remote synchronization for the static Pages demo", () => {
  assert.match(component, /playlistEndpoint\?: string \| null/);
  assert.match(component, /if \(!playlistEndpoint\) return;/);
  assert.match(component, /fetch\(playlistEndpoint,/);
});
