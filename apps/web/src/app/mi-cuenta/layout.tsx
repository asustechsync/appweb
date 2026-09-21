import { Cabecera } from "@appweb/ui";

import { SECCIONES } from "@/lib/secciones";

/**
 * Layout de /mi-cuenta — la misma cabecera que el resto de la tienda.
 *
 * No lee cookies: quien comprueba la sesion es la pagina, que ya es dinamica
 * por su cuenta. Si se leyera aqui, este layout dejaria de poder pre-renderizar
 * su parte estatica.
 */
export default function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera secciones={SECCIONES} />
      {children}
    </>
  );
}
