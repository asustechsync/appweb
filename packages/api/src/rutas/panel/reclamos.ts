/**
 * Libro de Reclamaciones en el panel: la lista de hojas y la respuesta.
 *
 * La hoja la escribe el consumidor desde la tienda y aqui no se edita. Lo
 * unico que el panel agrega es la respuesta, una sola vez, y esa respuesta le
 * llega al consumidor por correo: es la forma de "dar respuesta" que pide la
 * norma.
 */

import { TRPCError } from "@trpc/server";

import {
  codigoReclamo,
  correoReclamoRespondido,
  diasParaVencer,
  ESTADOS_RECLAMO,
  ETIQUETAS_TIPO_RECLAMO,
  mensajeDeRechazoReclamo,
  revisarRespuesta,
  venceReclamo,
  type EstadoReclamo,
  type TipoReclamo,
} from "@appweb/core";
import {
  esquemaFiltroReclamos,
  esquemaIdReclamo,
  esquemaRespuestaReclamo,
} from "@appweb/core/tipos";

import { enviarCorreo } from "../../correo";
import { datosTienda } from "../../tienda";
import { exige, router } from "../../trpc";

const atender = exige("atender_reclamos");

export const reclamos = router({
  /** Pendientes primero por vencimiento (el mas viejo arriba); respondidos, el ultimo arriba. */
  listar: atender.input(esquemaFiltroReclamos).query(async ({ ctx, input }) => {
    const [hojas, conteo] = await Promise.all([
      ctx.prisma.reclamo.findMany({
        where: input.estado ? { estado: input.estado } : {},
        orderBy: { creadoEn: input.estado === "PENDIENTE" ? "asc" : "desc" },
        take: 200,
        select: {
          id: true,
          numero: true,
          tipo: true,
          nombre: true,
          email: true,
          descripcionBien: true,
          estado: true,
          creadoEn: true,
        },
      }),
      ctx.prisma.reclamo.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    const porEstado = Object.fromEntries(ESTADOS_RECLAMO.map((e) => [e, 0])) as Record<
      EstadoReclamo,
      number
    >;
    for (const fila of conteo) porEstado[fila.estado as EstadoReclamo] = fila._count._all;

    return {
      porEstado,
      reclamos: hojas.map((r) => ({
        id: r.id,
        codigo: codigoReclamo(r.numero, r.creadoEn),
        tipo: r.tipo as TipoReclamo,
        nombre: r.nombre,
        email: r.email,
        descripcionBien: r.descripcionBien,
        estado: r.estado as EstadoReclamo,
        creadoEn: r.creadoEn.toISOString(),
        vence: venceReclamo(r.creadoEn).toISOString(),
        diasParaVencer: r.estado === "PENDIENTE" ? diasParaVencer(r.creadoEn) : null,
      })),
    };
  }),

  detalle: atender.input(esquemaIdReclamo).query(async ({ ctx, input }) => {
    const r = await ctx.prisma.reclamo.findUnique({
      where: { id: input.reclamoId },
      include: { respondidoPor: { select: { nombre: true } } },
    });
    if (r === null) throw new TRPCError({ code: "NOT_FOUND", message: "Ese reclamo no existe." });

    return {
      id: r.id,
      codigo: codigoReclamo(r.numero, r.creadoEn),
      tipo: r.tipo as TipoReclamo,
      estado: r.estado as EstadoReclamo,
      nombre: r.nombre,
      tipoDocumento: r.tipoDocumento,
      numeroDocumento: r.numeroDocumento,
      domicilio: r.domicilio,
      telefono: r.telefono,
      email: r.email,
      menorDeEdad: r.menorDeEdad,
      apoderado: r.apoderado,
      tipoBien: r.tipoBien,
      pedidoCodigo: r.pedidoCodigo,
      monto: r.monto === null ? null : Number(r.monto),
      descripcionBien: r.descripcionBien,
      detalle: r.detalle,
      pedido: r.pedido,
      respuesta: r.respuesta,
      respondidoPor: r.respondidoPor?.nombre ?? null,
      respondidoEn: r.respondidoEn?.toISOString() ?? null,
      creadoEn: r.creadoEn.toISOString(),
      vence: venceReclamo(r.creadoEn).toISOString(),
      diasParaVencer: r.estado === "PENDIENTE" ? diasParaVencer(r.creadoEn) : null,
    };
  }),

  /** Guarda la respuesta y se la manda al consumidor. No se puede responder dos veces. */
  responder: atender.input(esquemaRespuestaReclamo).mutation(async ({ ctx, input }) => {
    const r = await ctx.prisma.reclamo.findUnique({
      where: { id: input.reclamoId },
      select: {
        id: true,
        numero: true,
        tipo: true,
        nombre: true,
        email: true,
        estado: true,
        creadoEn: true,
      },
    });
    if (r === null) throw new TRPCError({ code: "NOT_FOUND", message: "Ese reclamo no existe." });

    const rechazo = revisarRespuesta(r.estado as EstadoReclamo);
    if (rechazo)
      throw new TRPCError({ code: "CONFLICT", message: mensajeDeRechazoReclamo(rechazo) });

    // `updateMany` con el estado en el filtro: si dos personas responden a la
    // vez, solo la primera escribe.
    const { count } = await ctx.prisma.reclamo.updateMany({
      where: { id: r.id, estado: "PENDIENTE" },
      data: {
        estado: "RESPONDIDO",
        respuesta: input.respuesta,
        respondidoPorId: ctx.sesion.usuarioId,
        respondidoEn: new Date(),
      },
    });
    if (count === 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: mensajeDeRechazoReclamo("ya_respondido"),
      });
    }

    const { asunto, cuerpo } = correoReclamoRespondido({
      nombre: r.nombre,
      codigo: codigoReclamo(r.numero, r.creadoEn),
      tipo: ETIQUETAS_TIPO_RECLAMO[r.tipo as TipoReclamo],
      respuesta: input.respuesta,
      proveedor: datosTienda().razonSocial,
    });
    await enviarCorreo(r.email, asunto, cuerpo);

    return { ok: true };
  }),
});
