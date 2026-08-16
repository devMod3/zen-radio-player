import { createRoot, type Root } from "react-dom/client";
import ZenRadioPlayer, { ZEN_PLAYER_OPEN_EVENT } from "../app/components/ZenRadioPlayer";
import playerCss from "../app/player.css?inline";

const ELEMENT_NAME = "zen-radio-player";
const OPEN_HASH = "#zen-radio-player";
const DEFAULT_PLAYLIST_ENDPOINT = "https://zuma-radio-player.major-oasis-8708.chatgpt.site/api/playlist";
const loader = Array.from(document.scripts).find((script) => script.src === import.meta.url);
const configuredEndpoint = loader?.dataset.playlistEndpoint || DEFAULT_PLAYLIST_ENDPOINT;

declare global {
  interface Window {
    ZenRadioPlayer?: Readonly<{ version: string; open: () => void }>;
    __zenRadioPlayerBootstrapped?: boolean;
  }
}

class ZenRadioPlayerElement extends HTMLElement {
  private reactRoot: Root | null = null;

  connectedCallback() {
    if (this.reactRoot) return;
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = playerCss;
    const mountPoint = document.createElement("div");
    shadow.replaceChildren(style, mountPoint);
    this.reactRoot = createRoot(mountPoint);
    this.reactRoot.render(<ZenRadioPlayer playlistEndpoint={this.getAttribute("playlist-endpoint") || configuredEndpoint} />);
  }

  disconnectedCallback() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }
}

function getOrCreatePlayer() {
  let player = document.querySelector<ZenRadioPlayerElement>(ELEMENT_NAME);
  if (!player) {
    player = document.createElement(ELEMENT_NAME) as ZenRadioPlayerElement;
    player.setAttribute("playlist-endpoint", configuredEndpoint);
    document.body.append(player);
  }
  return player;
}

function openPlayer() {
  getOrCreatePlayer();
  window.dispatchEvent(new Event(ZEN_PLAYER_OPEN_EVENT));
}

function findOpenTrigger(target: EventTarget | null) {
  const trigger = target instanceof Element
    ? target.closest<HTMLElement>("[data-zen-radio-open], a[href]")
    : null;
  if (!trigger) return null;
  if (trigger.hasAttribute("data-zen-radio-open")) return trigger;
  if (!(trigger instanceof HTMLAnchorElement)) return null;
  const url = new URL(trigger.href, window.location.href);
  return url.origin === window.location.origin && url.hash === OPEN_HASH ? trigger : null;
}

function openFromHash() {
  if (window.location.hash === OPEN_HASH) openPlayer();
}

function bootstrap() {
  if (window.__zenRadioPlayerBootstrapped) return;
  window.__zenRadioPlayerBootstrapped = true;
  if (!customElements.get(ELEMENT_NAME)) customElements.define(ELEMENT_NAME, ZenRadioPlayerElement);
  getOrCreatePlayer();
  document.addEventListener("click", (event) => {
    if (!findOpenTrigger(event.target)) return;
    event.preventDefault();
    openPlayer();
  });
  window.addEventListener("hashchange", openFromHash);
  if (window.location.hash === OPEN_HASH) window.setTimeout(openFromHash, 0);
  window.ZenRadioPlayer = Object.freeze({ version: "1.0", open: openPlayer });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
else bootstrap();
