# apps/mobile

Vacio a proposito. La app movil se monta con Expo cuando toque.

El dia que entre, esto es lo que ya estara hecho:

| Paquete            | Reutiliza |
|--------------------|-----------|
| `@appweb/core`     | 100 % — precios, carrito, stock, estados, roles |
| `@appweb/core/tipos` | 100 % — las mismas validaciones zod |
| `@appweb/api`      | 100 % — el mismo contrato tRPC |
| `@appweb/ui` tokens | 100 % — via `tokens.native.ts` |
| `@appweb/ui` componentes | 0 % — React Native no tiene HTML ni CSS |

Solo hay que escribir las pantallas. Por eso la logica de negocio no puede
vivir dentro de una pagina: seria lo unico que habria que reescribir.

    npx create-expo-app@latest . --template
