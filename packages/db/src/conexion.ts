/** La aplicacion necesita una direccion real de PostgreSQL para consultar. */
export function cadenaConexion(): string {
  const url = process.env["DATABASE_URL"];

  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Crea .env.local en la raiz del proyecto a partir de .env.example y configura la conexion a PostgreSQL.",
    );
  }

  return url;
}
