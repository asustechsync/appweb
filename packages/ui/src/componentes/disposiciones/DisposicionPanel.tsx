"use client";

import type { ReactNode } from "react";

import { IconoLuna } from "../../iconos";
import { AlternarTema } from "../base/AlternarTema";
import { type AvisoBarraPanel, BarraSuperiorPanel } from "./BarraSuperiorPanel";
import { DisposicionCuenta } from "./DisposicionCuenta";
import { MenuCuenta, type GrupoMenuCuenta } from "../navegacion/MenuCuenta";
import "../estilos.css";
import "./panel-admin.css";

export interface SeccionDePanel {
  id: string;
  etiqueta: string;
  /** Icono de la fila en el menu movil; en el lateral, solo si va sin grupo. */
  icono?: ReactNode;
  /** Grupo del menu ("Ventas", "Catálogo"…). Las secciones de un grupo van seguidas. */
  grupo?: string | undefined;
  /** Pendientes de la seccion (pedidos por confirmar, reclamos…). */
  contador?: number | undefined;
  /** Titulo pequeño que separa el menu en bloques ("Comercial", "Operaciones"). */
  apartado?: string | undefined;
}

export interface PropsDisposicionPanel {
  /** Ya filtradas por rol con `seccionesDelPanel` de @appweb/core. */
  secciones: SeccionDePanel[];
  /** Icono de cada titulo de grupo, por nombre de grupo. */
  iconosGrupo?: Record<string, ReactNode>;
  /** "" = sin seccion: en movil se ve el menu; en escritorio, la primera. */
  seccionActiva: string;
  onSeccion: (id: string) => void;
  nombreUsuario: string;
  rolUsuario: string;
  onSalir?: () => void;
  hrefTienda?: string;
  /** Marca del lateral (el logo); sustituye la tarjeta del usuario. */
  marcaLateral?: ReactNode;
  /** Aviso de algo que acaba de llegar, en la barra superior junto a las acciones. */
  aviso?: AvisoBarraPanel | undefined;
  children: ReactNode;
}

/**
 * Shell del panel: el mismo marco que /mi-cuenta (fondo de escena, tarjeta
 * del usuario, pestañas y menu movil de dos pantallas), para que tienda y
 * panel se lean como una sola identidad.
 *
 * El menu va por grupos desplegables: el titulo del grupo lleva el icono y
 * sus secciones cuelgan debajo; las secciones sin grupo van sueltas con icono.
 *
 * No navega por su cuenta ni sabe que secciones existen — recibe la lista ya
 * filtrada por rol y avisa hacia arriba con `onSeccion`. Asi el cambio de
 * seccion es estado del cliente y no un viaje al servidor.
 */
export function DisposicionPanel({
  secciones,
  iconosGrupo,
  seccionActiva,
  onSeccion,
  nombreUsuario,
  rolUsuario,
  onSalir,
  hrefTienda,
  marcaLateral,
  aviso,
  children,
}: PropsDisposicionPanel) {
  const visible = seccionActiva || (secciones[0]?.id ?? "");
  const tituloSeccion = secciones.find((seccion) => seccion.id === visible)?.etiqueta;

  return (
    <div className="ui-pagina-tienda ui-fondo-escena ui-panel-admin">
      <DisposicionCuenta
        nombreUsuario={nombreUsuario}
        rolUsuario={rolUsuario}
        secciones={secciones.map((seccion) => ({
          id: seccion.id,
          etiqueta: seccion.etiqueta,
          grupo: seccion.grupo,
          contador: seccion.contador,
          apartado: seccion.apartado,
          ...(seccion.grupo ? {} : { icono: seccion.icono }),
        }))}
        {...(iconosGrupo ? { iconosGrupo } : {})}
        {...(marcaLateral ? { marcaLateral } : {})}
        seccionActiva={visible}
        onSeccion={onSeccion}
        {...(onSalir ? { onSalir } : {})}
        {...(hrefTienda
          ? {
              enlaceLateral: { href: hrefTienda, etiqueta: "Tienda" },
              hrefSalirMenu: hrefTienda,
            }
          : {})}
        enMenu={seccionActiva === ""}
        {...(tituloSeccion ? { tituloSeccion } : {})}
        onVolver={() => onSeccion("")}
        barraSuperior={
          <BarraSuperiorPanel
            secciones={secciones}
            aviso={aviso}
            onSeccion={onSeccion}
            nombreUsuario={nombreUsuario}
            rolUsuario={rolUsuario}
          />
        }
        menuMovil={
          <MenuCuenta
            grupos={[
              ...agrupar(secciones, iconosGrupo),
              {
                opciones: [
                  {
                    id: "modo-oscuro",
                    etiqueta: "Modo oscuro",
                    icono: <IconoLuna />,
                    control: <AlternarTema variante="interruptor" />,
                  },
                ],
              },
            ]}
            onSeccion={onSeccion}
            {...(onSalir ? { onSalir } : {})}
          />
        }
      >
        {children}
      </DisposicionCuenta>
    </div>
  );
}

/** Secciones seguidas del mismo grupo -> un bloque del menu movil con su titulo. */
function agrupar(
  secciones: SeccionDePanel[],
  iconosGrupo: Record<string, ReactNode> | undefined,
): GrupoMenuCuenta[] {
  const grupos: GrupoMenuCuenta[] = [];
  for (const seccion of secciones) {
    const opcion = {
      id: seccion.id,
      etiqueta: seccion.etiqueta,
      icono: seccion.icono ?? null,
      seccion: seccion.id,
      ...(seccion.contador ? { valor: String(seccion.contador) } : {}),
    };
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.titulo === seccion.grupo && ultimo.apartado === seccion.apartado) {
      ultimo.opciones.push(opcion);
      ultimo.pendientes = (ultimo.pendientes ?? 0) + (seccion.contador ?? 0);
    } else
      grupos.push({
        ...(seccion.apartado ? { apartado: seccion.apartado } : {}),
        ...(seccion.grupo
          ? {
              titulo: seccion.grupo,
              desplegable: true,
              pendientes: seccion.contador ?? 0,
              ...(iconosGrupo?.[seccion.grupo] ? { icono: iconosGrupo[seccion.grupo] } : {}),
            }
          : {}),
        opciones: [opcion],
      });
  }
  return grupos;
}
