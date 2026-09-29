import { IconoFacebook, IconoGoogle } from "../iconos";
import { Boton } from "./Boton";

/**
 * Botones para entrar con otra cuenta. Sin proveedor conectado todavia: se ven
 * normales pero no hacen nada. Van en `alternativas` de `DisposicionAcceso`.
 */
export function AccesoSocial() {
  return (
    <>
      <Boton variante="secundario" anchoCompleto>
        <IconoGoogle /> Continuar con Google
      </Boton>
      <Boton variante="secundario" anchoCompleto>
        <IconoFacebook /> Continuar con Facebook
      </Boton>
    </>
  );
}
