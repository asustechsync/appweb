/**
 * Acceso desde la app movil: ingresar, crear cuenta y pedir el enlace para
 * cambiar la clave.
 *
 * La web no pasa por aqui (usa server actions y guarda una cookie); las reglas
 * son las mismas porque las dos llaman a @appweb/api/acceso. La app recibe el
 * token firmado y lo manda despues en `Authorization: Bearer`.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { crearTokenSesion, type CargaSesion } from "@appweb/core";

import * as acceso from "../../acceso";
import { secretoSesion } from "../../sesion";
import { privado, publico, router } from "../../trpc";

/** Lo que la app guarda: el token y lo justo para saludar sin preguntar. */
function sesionParaLaApp(carga: CargaSesion) {
  return {
    token: crearTokenSesion(carga, secretoSesion(), acceso.DURACION_SESION_MS),
    nombre: carga.nombre,
    rol: carga.rol,
  };
}

function rechazar(error: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: error });
}

// La validacion fina la hace @appweb/api/acceso con los esquemas de core; aqui
// solo se exige la forma, para que un error de campo llegue con su mensaje.
const credenciales = z.object({ email: z.string(), clave: z.string() });

export const accesoApp = router({
  ingresar: publico.input(credenciales).mutation(async ({ ctx, input }) => {
    // En el celular la sesion siempre se recuerda: no hay "cerrar el navegador".
    const resultado = await acceso.ingresar({ ...input, recordar: true }, ctx.ip);
    if (!resultado.ok) rechazar(resultado.error);
    return sesionParaLaApp(resultado.carga);
  }),

  registrar: publico
    .input(credenciales.extend({ telefono: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resultado = await acceso.registrar(input, ctx.ip);
      if (!resultado.ok) rechazar(resultado.error);
      return sesionParaLaApp(resultado.carga);
    }),

  recuperar: publico.input(z.object({ email: z.string() })).mutation(async ({ ctx, input }) => {
    const resultado = await acceso.pedirRecuperacion(input, ctx.ip);
    if (!resultado.ok) rechazar(resultado.error);
    return { ok: true as const };
  }),

  /**
   * Comprueba que el token guardado sigue valido al abrir la app. El nombre se
   * lee de la base: el del token queda como estaba al ingresar y no refleja
   * un cambio hecho en "Mis datos".
   */
  sesion: privado.query(async ({ ctx }) => {
    const usuario = await ctx.prisma.usuario.findUnique({
      where: { id: ctx.sesion.usuarioId },
      select: { nombre: true },
    });
    return { nombre: usuario?.nombre ?? ctx.sesion.nombre, rol: ctx.sesion.rol };
  }),
});
