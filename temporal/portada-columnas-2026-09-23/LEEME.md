# Portada de tres columnas — respaldo del 23/09/2026

Esta copia guarda la versión de la portada inspirada en la referencia visual de tres columnas, antes de restaurar el diseño anterior.

## Estructura

- Escritorio: tarjeta editorial y atributos a la izquierda, producto y llamado principal al centro, información de promoción/tallas/envíos a la derecha.
- Franja inferior: producto destacado y cuatro tarjetas de beneficios (seguridad, envíos, garantía y soporte).
- Móvil: contenido apilado; desde 48 rem se distribuye en dos columnas y desde 64 rem en tres.
- Imagen `producto.webp` reutilizada como protagonista, en la tarjeta editorial y en la franja inferior.

## Estilo

- Fondo general: `var(--color-neutro-200)` (`#E3E3E6`), igual al gris claro del header.
- Tarjetas: `var(--color-superficie)`, bordes y radios de los tokens actuales.
- Hero central: degradado blanco/gris claro; botones y texto con la paleta actual.
- El header no forma parte de este respaldo porque no se modificó.

## Archivos y destino para restaurar

- `EscaparatePortada.tsx` → `packages/ui/src/componentes/EscaparatePortada.tsx`
- `escaparate-portada.css` → `packages/ui/src/componentes/estilos/escaparate-portada.css`
- `page.tsx` → `apps/web/src/app/(tienda)/page.tsx` (copia de contexto; no cambió)
- `producto.webp` → `apps/web/public/producto.webp` (copia de contexto; no cambió)

Para recuperar esta composición basta con restaurar el componente y el CSS, siempre que la página y la imagen sigan iguales.
