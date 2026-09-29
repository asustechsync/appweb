/**
 * Nombre provisional para quien se registra solo con correo y contraseña.
 * "ana.perez+tienda@gmail.com" -> "Ana Perez". Despues lo corrige en Mi cuenta.
 */
export function nombreDesdeCorreo(email: string): string {
  const local = (email.split("@")[0] ?? "").split("+")[0] ?? "";
  const palabras = local
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase());

  const nombre = palabras.join(" ").slice(0, 80);
  return nombre.length >= 2 ? nombre : "Cliente";
}
