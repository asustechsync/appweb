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
  return texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** `true` si un metodo con esos departamentos puede enviar a `departamento`. */
export function cubreDepartamento(departamentos: readonly string[], departamento: string): boolean {
  if (departamentos.length === 0) return true;
  const buscado = normalizar(departamento);
  return departamentos.some((cubierto) => normalizar(cubierto) === buscado);
}

/**
 * "Lima, Callao ,, lima" -> ["Lima", "Callao"]. Como lo escribe el panel:
 * separado por comas, sin vacios ni repetidos (sin importar tildes ni
 * mayusculas). Vacio = todo el pais.
 */
export function departamentosDesdeTexto(texto: string): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const parte of texto.split(",")) {
    const limpio = parte.trim();
    if (limpio === "" || vistos.has(normalizar(limpio))) continue;
    vistos.add(normalizar(limpio));
    resultado.push(limpio);
  }
  return resultado;
}
