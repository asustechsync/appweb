/**
 * Datos del proveedor: quien vende. Los piden el Libro de Reclamaciones, los
 * terminos, la politica de privacidad y el pie de la tienda, y tienen que
 * decir lo mismo en todos lados.
 *
 * Salen de .env.local (TIENDA_*). Sin configurar se ve el aviso entre
 * corchetes: una hoja de reclamacion sin RUC no cumple la norma, y es mejor
 * que el hueco se note en la pagina a que pase desapercibido.
 */

import { NOMBRE_MARCA } from "@appweb/ui/marca";

import { entorno } from "./entorno";

function dato(valor: string | undefined, nombre: string, aviso: string): string {
  return valor ?? `[${aviso}: configura ${nombre}]`;
}

export interface DatosTienda {
  /** Nombre comercial, el que ve el cliente. */
  nombre: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  /** Correo de atencion: reclamos y derechos sobre datos personales. */
  correo: string;
}

export function datosTienda(): DatosTienda {
  const e = entorno();
  return {
    nombre: e.TIENDA_NOMBRE ?? NOMBRE_MARCA,
    razonSocial: dato(e.TIENDA_RAZON_SOCIAL, "TIENDA_RAZON_SOCIAL", "Razón social"),
    ruc: dato(e.TIENDA_RUC, "TIENDA_RUC", "RUC"),
    direccion: dato(e.TIENDA_DIRECCION, "TIENDA_DIRECCION", "Dirección"),
    correo: dato(e.TIENDA_CORREO, "TIENDA_CORREO", "Correo de atención"),
  };
}
