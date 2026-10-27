"use client";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS, type Rol } from "@appweb/core";
import {
  Alerta,
  CampoSelect,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoCorreo,
  IconoEscudo,
  IconoPedidos,
  IconoPremio,
  IconoUsuario,
  LogoIcono,
  RejillaBento,
  type AccionBento,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { FECHA, MONEDA, cuandoFue } from "@appweb/core/formato";

/** De los pedidos solo los ultimos: la vista previa no crece sin fin. */
const PEDIDOS_VISIBLES = 4;

export interface PropsCuadrosUsuario {
  usuarioId: string;
  usuarioIdActual: string;
  alcance: "clientes" | "equipo";
  etiquetaRol: (rol: Rol) => string;
  opcionesRol: { valor: string; etiqueta: string }[];
  /** Mientras una mutacion esta en curso, nada se puede volver a pulsar. */
  trabajando: boolean;
  onAbrir: () => void;
  onCambiarActivo: (activo: boolean) => void;
  onCambiarRol: (rol: Rol) => void;
}

/**
 * Vista previa de una cuenta: quien es, como se le contacta y que compro. En
 * el equipo, ademas, su rol, que se cambia desde aqui. Quien puede cambiar que
 * lo decide @appweb/api: esta vista solo envia.
 */
export function CuadrosUsuario({
  usuarioId,
  usuarioIdActual,
  alcance,
  etiquetaRol,
  opcionesRol,
  trabajando,
  onAbrir,
  onCambiarActivo,
  onCambiarRol,
}: PropsCuadrosUsuario) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.panel.usuarios.detalle.queryOptions({ usuarioId }));

  if (detalle.isPending) return <Cargando texto="Cargando la cuenta…" />;
  if (detalle.isError) return <Alerta tono="error">{detalle.error.message}</Alerta>;

  const u = detalle.data;
  const rol = u.rol as Rol;
  const bloqueada = u.id === usuarioIdActual || u.anonimizada;
  const acciones: AccionBento[] = [{ etiqueta: "Abrir ficha", onClick: onAbrir }];
  if (!bloqueada && !trabajando) {
    acciones.push({
      etiqueta: u.activo ? "Desactivar" : "Activar",
      onClick: () => onCambiarActivo(!u.activo),
    });
  }
  const pedidos = u.pedidos.slice(0, PEDIDOS_VISIBLES);

  return (
    <RejillaBento>
      <CuadroMonto
        logo={
          <LogoIcono
            icono={
              alcance === "equipo" ? <IconoEscudo tamano={16} /> : <IconoUsuario tamano={16} />
            }
            nombre={u.nombre}
          />
        }
        estado={estadoDeCuenta(u)}
        etiqueta={alcance === "equipo" ? u.nombre : `Total comprado · ${u.nivel}`}
        monto={alcance === "equipo" ? etiquetaRol(rol) : MONEDA.format(u.totalComprado)}
        texto={alcance === "equipo"}
        detalle={`Cuenta desde ${FECHA.format(new Date(u.creadoEn))}`}
        acciones={acciones}
      />
      <CuadroBento
        icono={<IconoCorreo tamano={16} />}
        titulo="Contacto"
        ancho="ancho"
        {...(u.anonimizada ? {} : { copiable: u.email })}
        detalle={u.telefono ?? "Sin teléfono"}
      >
        {u.anonimizada ? "Datos eliminados" : u.email}
      </CuadroBento>
      {alcance === "equipo" ? (
        <CuadroBento icono={<IconoEscudo tamano={16} />} titulo="Rol" ancho="ancho">
          <CampoSelect
            id={`rol-${u.id}`}
            etiqueta={`Rol de ${u.nombre}`}
            etiquetaOculta
            valor={rol}
            opciones={opcionesRol}
            onCambio={(valor) => onCambiarRol(valor as Rol)}
            disabled={bloqueada || trabajando}
          />
        </CuadroBento>
      ) : (
        <CuadroBento
          icono={<IconoPremio tamano={16} />}
          titulo="Nivel"
          ancho="ancho"
          detalle={
            u.ultimoAccesoEn
              ? `Último acceso: ${cuandoFue(new Date(u.ultimoAccesoEn))}`
              : "Sin accesos"
          }
          cifras={[
            { valor: String(u.totalPedidos), etiqueta: "Pedidos" },
            { valor: String(u.direcciones), etiqueta: "Direcciones" },
          ]}
        >
          {u.nivel}
        </CuadroBento>
      )}
      {pedidos.length > 0 ? (
        <CuadroDesglose
          icono={<IconoPedidos tamano={16} />}
          titulo="Últimos pedidos"
          ancho="ancho"
          lineas={pedidos.map((p) => ({
            etiqueta: `${p.codigo} · ${ETIQUETAS[p.estado]}`,
            valor: MONEDA.format(p.total),
          }))}
        />
      ) : null}
    </RejillaBento>
  );
}

/** Eliminada manda sobre activa: sus datos ya no existen. */
export function estadoDeCuenta(u: { activo: boolean; anonimizada: boolean }): {
  texto: string;
  tono: "exito" | "alerta" | "error";
} {
  if (u.anonimizada) return { texto: "Eliminada", tono: "error" };
  return u.activo ? { texto: "Activa", tono: "exito" } : { texto: "Desactivada", tono: "alerta" };
}
