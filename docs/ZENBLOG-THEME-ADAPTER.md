# ZenBlog Theme Adapter

Zen Radio Player mantiene su Shadow DOM y sus estilos por defecto. Cuando detecta los design tokens públicos de ZenBlog en `document.documentElement`, crea aliases `--zrp-host-*` en el custom element y activa `data-theme="zenblog"`.

Esto permite que el reproductor adopte paleta y tipografía de **La hoja de ruta** sin acoplar su lógica de reproducción a ZenBlog.

Tokens detectados:

- `--zen-canvas`
- `--zen-surface-1`
- `--zen-surface-2`
- `--zen-surface-3`
- `--zen-text`
- `--zen-text-secondary`
- `--zen-text-tertiary`
- `--zen-border`
- `--zen-border-strong`
- `--zen-accent`
- `--zen-error`
- `--zen-ui-font`
- `--zen-editorial-font`

Si esos tokens no existen, el reproductor conserva su tema independiente actual.
