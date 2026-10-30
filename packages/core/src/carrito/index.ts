/**
 * Entrada `@appweb/core/carrito`: solo el carrito guardado y sus totales.
 *
 * La app movil importa desde aqui y no desde la raiz de @appweb/core, que
 * tambien trae codigo de servidor (claves, recuperacion con `node:crypto`)
 * que React Native no puede empaquetar.
 */

export * from "./guardado";
export * from "./totales";
