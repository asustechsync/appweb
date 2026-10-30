/**
 * Datos de contacto de la tienda para la app movil: el chat de la ficha abre
 * WhatsApp con el mensaje ya escrito.
 */

import { z } from "zod";

import { enlaceWhatsApp, mensajeConsultaWhatsApp, mensajeProductoWhatsApp } from "@appweb/core";

import { entorno } from "../../entorno";
import { publico, router } from "../../trpc";

export const tienda = router({
  /**
   * Enlace de WhatsApp de la tienda. Con `producto`, el mensaje ya nombra la
   * prenda (y la talla y color elegidos). `null` sin WHATSAPP_TIENDA: mejor
   * nada que un enlace roto.
   */
  contacto: publico
    .input(
      z
        .object({
          producto: z
            .object({
              nombre: z.string().max(140),
              talla: z.string().max(20).nullish(),
              color: z.string().max(40).nullish(),
            })
            .optional(),
        })
        .optional(),
    )
    .query(({ input }) => ({
      whatsapp: enlaceWhatsApp(
        entorno().WHATSAPP_TIENDA ?? null,
        input?.producto ? mensajeProductoWhatsApp(input.producto) : mensajeConsultaWhatsApp(),
      ),
    })),
});
