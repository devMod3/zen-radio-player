# Zen Radio Player — MVP 0.1

Reproductor personal de radio con interfaz institucional y editor local de playlists.

## Incluye

- 37 emisoras importadas desde la lista M3U original.
- reproducción nativa de MP3/AAC/streams;
- reproducción HLS mediante hls.js con fallback nativo en Safari;
- playlist pública de solo lectura;
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
```

## Alcance pendiente

- lectura y normalización completa de metadatos HLS/ID3/ICY;
- verificación remota de Content-Type, CORS y vencimiento;
- paquete Web Component autónomo para inyección definitiva en Blogger;
- almacenamiento de archivos en nube.
