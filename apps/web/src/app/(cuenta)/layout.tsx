import { Cabecera } from "@appweb/ui";

import { SECCIONES } from "@/lib/secciones";

/**
 * Layout de ingresar/registro — misma cabecera que el resto del sitio.
 *
 * Tampoco lee cookies aqui: cada pagina (ingresar, registro) decide por su
 * cuenta si hace falta consultar la sesion, y ese leerla no debe arrastrar a
 * este layout ni a lo que renderiza junto a el.
 */
export default function LayoutCuenta({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera secciones={SECCIONES} />
      {children}
    </>
  );
}
