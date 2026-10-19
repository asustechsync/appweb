"use server";

import {
  codigoReclamo,
  correoReclamoNuevoTienda,
  correoReclamoRegistrado,
  ETIQUETAS_TIPO_RECLAMO,
  mensajeDeEspera,
  venceReclamo,
} from "@appweb/core";
import { esquemaReclamo } from "@appweb/core/tipos";
import { enviarCorreo } from "@appweb/api/correo";
import { entorno } from "@appweb/api/entorno";
import { datosTienda } from "@appweb/api/tienda";
import { URL_PANEL } from "@appweb/api/urls";
import { prisma } from "@appweb/db";

import { ipDelCliente, limites } from "@/lib/limites";

export type ResultadoReclamo =
  | { ok: true; codigo: string; creadoEn: string; vence: string; email: string }
  | { ok: false; error: string; campos?: Record<string, string> };

/**
 * Registra la hoja y manda las dos copias: la constancia al consumidor (la
 * exige la norma) y el aviso a la tienda, que tiene 15 dias habiles para
 * responder.
 */
export async function registrarReclamo(datos: unknown): Promise<ResultadoReclamo> {
  const analizado = esquemaReclamo.safeParse(datos);
  if (!analizado.success) {
    const campos: Record<string, string> = {};
    for (const problema of analizado.error.issues) {
      campos[String(problema.path[0] ?? "")] ??= problema.message;
    }
    return {
      ok: false,
      error: analizado.error.issues[0]?.message ?? "Revisa los datos",
      campos,
    };
  }

  const cupo = limites.reclamoPorIp.consumir(await ipDelCliente());
  if (!cupo.permitido) return { ok: false, error: mensajeDeEspera(cupo.reintentarEnMs) };

  const d = analizado.data;
  const hoja = await prisma.reclamo.create({
    data: {
      tipo: d.tipo,
      nombre: d.nombre,
      tipoDocumento: d.tipoDocumento,
      numeroDocumento: d.numeroDocumento,
      domicilio: d.domicilio,
      telefono: d.telefono,
      email: d.email,
      menorDeEdad: d.menorDeEdad,
      apoderado: d.menorDeEdad ? (d.apoderado ?? null) : null,
      tipoBien: d.tipoBien,
      pedidoCodigo: d.pedidoCodigo || null,
      monto: d.monto ?? null,
      descripcionBien: d.descripcionBien,
      detalle: d.detalle,
      pedido: d.pedido,
    },
    select: { numero: true, creadoEn: true },
  });

  const codigo = codigoReclamo(hoja.numero, hoja.creadoEn);
  const vence = venceReclamo(hoja.creadoEn);
  const tipo = ETIQUETAS_TIPO_RECLAMO[d.tipo];
  const tienda = datosTienda();

  const constancia = correoReclamoRegistrado({
    nombre: d.nombre,
    codigo,
    tipo,
    creadoEn: hoja.creadoEn,
    vence,
    detalle: d.detalle,
    pedido: d.pedido,
    proveedor: tienda.razonSocial,
  });
  const envios = [enviarCorreo(d.email, constancia.asunto, constancia.cuerpo)];

  const avisarA = entorno().avisosReclamos;
  if (avisarA) {
    const aviso = correoReclamoNuevoTienda({
      codigo,
      tipo,
      nombre: d.nombre,
      vence,
      enlacePanel: `${URL_PANEL}/reclamos`,
    });
    envios.push(enviarCorreo(avisarA, aviso.asunto, aviso.cuerpo));
  }
  await Promise.all(envios);

  return {
    ok: true,
    codigo,
    creadoEn: hoja.creadoEn.toISOString(),
    vence: vence.toISOString(),
    email: d.email,
  };
}
