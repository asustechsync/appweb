# Reglas del proyecto

Tienda de basicos: boxers, medias y accesorios. Tres apps, cuatro paquetes,
diez tablas al arrancar.

## Las tres clases de velocidad

Antes de crear una pantalla, decide su clase. La clase decide render y cache.

- **Clase A** — catalogo publico. `use cache` + `cacheLife` + `cacheTag`.
  20-40 ms. **No toca la base en el request del visitante.**
- **Clase B** — carrito y checkout. PPR: shell estatico + streaming.
- **Clase C** — `/mi-cuenta` y todo el panel. SPA cliente + TanStack Query.
  Navegacion en 0 ms; el servidor solo entrega JSON.

## Reglas duras

1. **El layout raiz de `apps/web` no lee cookies.** Leer una cookie arriba
   vuelve dinamico todo el arbol, portada y categorias incluidas. La sesion
   entra por una isla cliente dentro de la cabecera.
2. **El catalogo se lee de funciones cacheadas**, nunca con joins en vivo.
3. **Toda invalidacion pasa por las etiquetas de `apps/web/src/lib/cache.ts`.**
4. **La logica de negocio va en `packages/core`.** Nunca dentro de una pagina
   ni de un componente. Precios, carrito, stock, estados, envios, roles.
5. **El stock no se toca sin escribir en `MovimientoStock`.** Nunca un
   `UPDATE variante SET stock`. El stock sale de la suma de movimientos.
6. **Ninguna pagina define estilos.** Ni color, ni espaciado, ni tipografia,
   ni radio, ni sombra. Si falta un color -> token en
   `packages/ui/src/tokens.ts`. Si falta un estilo -> primitivo en
   `packages/ui/src/componentes/`.
7. **El precio y la direccion se congelan en el pedido.** `ItemPedido` guarda
   nombre, talla, color y precio; `Pedido` copia la direccion. Si mañana
   cambian, la venta de ayer no se altera.

## Donde va cada archivo

La pregunta que lo decide: **¿la app movil lo necesitaria?**
Si si, va en `packages/`. Si no, va en `apps/`.

## Base de datos

- Diez tablas al arrancar. Antes de añadir una, pregunta: *si la añado dentro
  de tres meses, ¿tendre los datos que necesita?* Si la respuesta es si,
  dejala fuera.
- El SQL que Prisma no expresa (indices parciales, tsvector) se escribe a mano
  en `packages/db/prisma/sql/` y debe ser idempotente.
- `schema.prisma` se mantiene a mano. **No usar `prisma db pull`.**

## Convenciones

- Codigo, comentarios, nombres de variables y mensajes de commit **en español**.
- FIRST MOBILE: los estilos base son de movil; los quiebres solo añaden.
- Tras `npm run build` hay que reiniciar `npm run dev`.

## Integraciones aplazadas

No implementar hasta su fase. Las interfaces ya existen:

- `packages/core/src/puertos/pasarela-pago.ts` — hoy `PagoManual`
  (Yape, Plin, transferencia). La pasarela real implementa la misma interfaz
  y **el checkout no se toca**.
- `packages/core/src/puertos/facturacion.ts` — SUNAT cuando el volumen lo pida.
- `packages/core/src/puertos/notificaciones.ts` — correo y WhatsApp.
