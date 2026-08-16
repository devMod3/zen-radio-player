import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const player = await readFile(new URL("../app/components/ZenRadioPlayer.tsx", import.meta.url), "utf8");
const demo = await readFile(new URL("../app/components/RadioApp.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/player.css", import.meta.url), "utf8");
const embed = await readFile(new URL("../embed/main.tsx", import.meta.url), "utf8");
const pages = await readFile(new URL("../github-pages/index.html", import.meta.url), "utf8");
const api = await readFile(new URL("../app/api/playlist/route.ts", import.meta.url), "utf8");

test("publishes the stable product identity in the about surface", () => {
  assert.match(player, /const APP_VERSION = "1\.0"/);
  assert.match(player, /Versión \{APP_VERSION\}/);
  assert.match(player, /Creado por: <a href="https:\/\/github\.com\/devMod3"[^>]*>devMod3<\/a>/);
  assert.match(player, /href="https:\/\/movimientoc40\.com"[^>]*>Sponsor<\/a>/);
  assert.match(player, /Zen Radio Player<\/strong> es un reproductor web diseñado para integrarse con cualquier sitio\./);
  assert.doesNotMatch(player, /Permanece en primer plano|Código fuente en GitHub|PROTOTIPO 0\.1/);
  assert.match(styles, /\.creator-credit a,\.about-footer \.sponsor-link \{[^}]*font-weight:650;[^}]*letter-spacing:\.02em;[^}]*text-decoration:none;[^}]*cursor:pointer;/);
  assert.doesNotMatch(styles, /\n\.about-footer \.sponsor-link \{/);
  assert.doesNotMatch(styles, /sponsor-link:hover[^}]*text-decoration:underline/);
});

test("keeps the product independent from the host demonstration", () => {
  assert.doesNotMatch(player, /site-shell|Archivo Constitucional|Sitio anfitrión/);
  assert.match(player, /className="zen-radio-root"/);
  assert.match(demo, /<main className="site-shell">/);
  assert.match(demo, /<ZenRadioPlayer playlistEndpoint=\{playlistEndpoint\} \/>/);
});

test("keeps the broadcast glyph and its container geometrically centered", () => {
  assert.match(player, /broadcast: <><circle cx="12" cy="12"[^>]*fill="currentColor"[^>]*\/><path d="M8\.46 8\.46[^"]*M15\.54 8\.46[^"]*M5\.64 5\.64[^"]*M18\.36 5\.64/);
  assert.match(styles, /\.player-bar>\* \{ align-self:center; \}/);
  assert.match(styles, /\.station-identity \{[^}]*height:28px;[^}]*align-items:center;/);
  assert.match(styles, /\.broadcast-status \{[^}]*display:inline-flex!important;[^}]*align-items:center;[^}]*justify-content:center;[^}]*margin:0!important;[^}]*transform:none;/);
  assert.match(styles, /\.transport-controls,\.player-tools \{[^}]*height:28px;[^}]*align-items:center;/);
});

test("keeps the playlist search compact and self-contained", () => {
  assert.match(player, /<label className="search-field"><Icon name="search" \/><input aria-label="Buscar emisora"/);
  assert.match(player, /placeholder="Buscar emisora" \/><\/label>/);
  assert.match(styles, /\.search-field \{[^}]*position:relative;[^}]*display:block;[^}]*margin:5px 7px;/);
  assert.match(styles, /\.search-field \.ui-icon \{[^}]*position:absolute;[^}]*top:50%;[^}]*left:8px;[^}]*transform:translateY\(-50%\);/);
  assert.match(styles, /\.search-field input \{[^}]*width:100%;[^}]*height:26px;[^}]*padding:3px 7px 3px 27px;/);
});

test("uses compact rectangular controls without circular button frames", () => {
  assert.match(styles, /\.transport-controls button,\.player-tools>button \{[^}]*border:0;[^}]*border-radius:4px;/);
  assert.match(styles, /\.transport-controls button:hover,\.player-tools>button:hover,\.player-tools>button\.active \{[^}]*background:var\(--zen-control-hover\);/);
  assert.match(styles, /\.transport-controls \.play-control \{[^}]*border-radius:4px;/);
  assert.doesNotMatch(styles, /\.transport-controls button,[^{]*\{[^}]*border-radius:999px;/);
});

test("keeps playlist icon-only and removes redundant reading state", () => {
  assert.match(player, /aria-label="Lista de reproducción" aria-pressed=\{playlistOpen\} title="Lista de reproducción"/);
  assert.doesNotMatch(player, /<span>Lista de reproducción<\/span>|>LECTURA</);
  assert.doesNotMatch(styles, /read-badge/);
});

test("ships one official dark appearance without experimental palettes", () => {
  assert.doesNotMatch(player + demo, /PALETA DE PRUEBA|Palette|data\.palette/);
  assert.doesNotMatch(styles, /data-palette|palette-control/);
  assert.match(styles, /\.player-bar \{[^}]*background:var\(--zen-bar\);/);
});

test("builds the reusable Blogger surface as an isolated custom element", () => {
  assert.match(embed, /const ELEMENT_NAME = "zen-radio-player"/);
  assert.match(embed, /attachShadow\(\{ mode: "open" \}\)/);
  assert.match(embed, /style\.textContent = playerCss/);
  assert.match(embed, /target\.closest<HTMLElement>\("\[data-zen-radio-open\], a\[href\]"\)/);
  assert.match(embed, /window\.ZenRadioPlayer = Object\.freeze\(\{ version: "1\.0", open: openPlayer \}\)/);
  assert.match(pages, /data-zen-radio-open/);
  assert.match(pages, /src="https:\/\/devmod3\.github\.io\/zen-radio-player\/assets\/zen-radio-player\.js"/);
  assert.doesNotMatch(pages, /main\.tsx|id="root"/);
});

test("opens from Blogger page-list links without coupling to its template", () => {
  assert.match(embed, /const OPEN_HASH = "#zen-radio-player"/);
  assert.match(embed, /trigger\.hasAttribute\("data-zen-radio-open"\)/);
  assert.match(embed, /url\.origin === window\.location\.origin && url\.hash === OPEN_HASH/);
  assert.match(embed, /window\.addEventListener\("hashchange", openFromHash\)/);
  assert.match(embed, /window\.location\.hash === OPEN_HASH\) window\.setTimeout\(openFromHash, 0\)/);
});

test("allows read-only playlist synchronization from external sites", () => {
  assert.match(embed, /https:\/\/zuma-radio-player\.major-oasis-8708\.chatgpt\.site\/api\/playlist/);
  assert.match(player, /fetch\(playlistEndpoint,/);
  assert.match(api, /"access-control-allow-origin": "\*"/);
  assert.match(api, /"access-control-allow-methods": "GET, OPTIONS"/);
  assert.match(api, /export function OPTIONS\(\)/);
});
