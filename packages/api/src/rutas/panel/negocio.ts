/**
 * Estado del negocio para el panel: que datos del proveedor, medios de pago y
 * servicios estan configurados. Solo lectura: la configuracion vive en
 * variables de entorno (ver ../../entorno.ts) y nunca se devuelve una clave,
 * solo si esta puesta o no.
 */

import { datosTienda } from "../../tienda";
import { entorno, faltantes } from "../../entorno";
import { exige, router } from "../../trpc";

const ajustar = exige("gestionar_ajustes");

export const negocio = router({
  estado: ajustar.query(() => {
    const e = entorno();
    const { paraVender } = faltantes(e);

    return {
      produccion: e.produccion,
      listoParaVender: paraVender.length === 0,
      faltan: paraVender,
      proveedor: datosTienda(),
      pagos: {
        yape: e.YAPE_NUMERO ?? null,
        plin: e.PLIN_NUMERO ?? null,
        cuenta: e.CUENTA_BANCARIA ?? null,
        titular: e.TITULAR_CUENTA ?? null,
        tarjetaDePrueba: e.tarjetaDePrueba,
      },
      contacto: {
        whatsappTienda: e.WHATSAPP_TIENDA ?? null,
        whatsappMayorista: e.WHATSAPP_MAYORISTA ?? null,
        avisosPedidos: e.avisosPedidos ?? null,
        avisosReclamos: e.avisosReclamos ?? null,
      },
      servicios: {
        correo: Boolean(e.RESEND_API_KEY),
        fotos: Boolean(e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY),
      },
    };
  }),
});
