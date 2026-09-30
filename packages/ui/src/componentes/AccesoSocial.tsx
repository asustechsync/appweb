import { IconoApple, IconoGoogle } from "../iconos";
import { Boton } from "./Boton";

/**
 * Botones para entrar con otra cuenta. Sin proveedor conectado todavia: se ven
 * normales pero no hacen nada. Van en `alternativas` de `DisposicionAcceso`.
 */
export function AccesoSocial() {
  return (
    <>
      <Boton variante="secundario" anchoCompleto>
        <IconoGoogle />
        <span>
          <span className="ui-acceso__continuar">Continuar con </span>Google
        </span>
      </Boton>
      <Boton variante="secundario" anchoCompleto>
        <IconoApple />
        <span>
          <span className="ui-acceso__continuar">Continuar con </span>Apple
        </span>
      </Boton>
    </>
  );
}
