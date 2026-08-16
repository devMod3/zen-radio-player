# Zen Radio Player 1.0

Reproductor personal de radio web con interfaz institucional y editor local de playlists.

El reproductor público está limitado a sus superficies funcionales: barra de reproducción, playlist lateral y panel informativo. Se superpone al sitio anfitrión sin sustituir ni bloquear su contenido.

## Incluye

- 37 emisoras importadas desde la lista M3U original.
- reproducción nativa de MP3/AAC/streams;
- reproducción HLS mediante hls.js con fallback nativo en Safari;
- playlist pública sin controles administrativos;
- abrir, cerrar, minimizar, restaurar, play/pausa, anterior/siguiente y volumen;
- persistencia local de volumen, última emisora y preferencia de reanudación;
- importador local M3U, M3U8, TXT y JSON;
- análisis sintáctico de enlaces directos;
- diagnóstico no destructivo y exportación JSON.

## Desarrollo

```bash
npm install
npm run dev
```

## Validación

```bash
npm run lint
npm run build
npm run build:pages
```

## Demostración pública

La carpeta `github-pages` representa un sitio institucional independiente. La demostración permite comprobar cómo Zen Radio Player permanece en primer plano sobre el contenido real de una página.

El flujo `.github/workflows/pages.yml` construye y publica automáticamente esa demostración en GitHub Pages cuando cambia la rama principal.

## Integración en Blogger

La demostración y Blogger cargan el mismo Web Component aislado mediante Shadow DOM. El aislamiento evita que los estilos del reproductor modifiquen la plantilla del blog y que la plantilla modifique el reproductor.

```html
<button type="button" data-zen-radio-open>Abrir reproductor</button>
<script type="module" src="https://devmod3.github.io/zen-radio-player/assets/zen-radio-player.js"></script>
```

También puede abrirse desde cualquier botón existente mediante `window.ZenRadioPlayer.open()`.

Los menús de Blogger que solo aceptan una URL pueden usar un enlace al propio blog terminado en `#zen-radio-player`. El componente intercepta ese enlace y abre el reproductor sin abandonar la página:

```text
https://TU-BLOG.blogspot.com/#zen-radio-player
```

## Alcance pendiente

- lectura y normalización completa de metadatos HLS/ID3/ICY;
- verificación remota de Content-Type, CORS y vencimiento;
- reducción adicional del peso del paquete embebible;
- almacenamiento de archivos en nube.
