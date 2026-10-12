/**
 * Zonas de envio: que departamentos cubre cada metodo.
 *
 * `MetodoEnvio.departamentos` vacio significa "todo el pais" (agencia a
 * provincias, recojo en tienda). Con departamentos, el metodo solo vale para
 * direcciones de esos departamentos: "Lima y Callao" no puede cobrar S/ 12 por
 * llevar un paquete a Cusco.
 *
 * La usan el checkout (para desactivar opciones) y el servidor (para rechazar
 * el pedido): la misma regla en los dos lados.
 */

/** "Lima", " lima ", "LIMA" y "Lími" cuentan como el mismo departamento. */
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** `true` si un metodo con esos departamentos puede enviar a `departamento`. */
export function cubreDepartamento(departamentos: readonly string[], departamento: string): boolean {
  if (departamentos.length === 0) return true;
  const buscado = normalizar(departamento);
  return departamentos.some((cubierto) => normalizar(cubierto) === buscado);
}
