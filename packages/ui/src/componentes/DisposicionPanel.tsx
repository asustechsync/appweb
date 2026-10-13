"use client";

import type { ReactNode } from "react";

import { IconoLuna } from "../iconos";
import { AlternarTema } from "./AlternarTema";
import { DisposicionCuenta } from "./DisposicionCuenta";
import { MenuCuenta } from "./MenuCuenta";
import "./primitivos.css";

export interface SeccionDePanel {
  id: string;
  etiqueta: string;
  /** Icono de la fila en el menu movil. */
  icono?: ReactNode;
}

export interface PropsDisposicionPanel {
  /** Ya filtradas por rol con `seccionesDelPanel` de @appweb/core. */
  secciones: SeccionDePanel[];
  /** "" = sin seccion: en movil se ve el menu; en escritorio, la primera. */
  seccionActiva: string;
  onSeccion: (id: string) => void;
  nombreUsuario: string;
  rolUsuario: string;
  onSalir?: () => void;
  hrefTienda?: string;
  children: ReactNode;
}

/**
 * Shell del panel: el mismo marco que /mi-cuenta (fondo de escena, tarjeta
 * del usuario, pestañas y menu movil de dos pantallas), para que tienda y
 * panel se lean como una sola identidad.
 *
 * No navega por su cuenta ni sabe que secciones existen — recibe la lista ya
 * filtrada por rol y avisa hacia arriba con `onSeccion`. Asi el cambio de
 * seccion es estado del cliente y no un viaje al servidor.
 */
export function DisposicionPanel({
  secciones,
  seccionActiva,
  onSeccion,
  nombreUsuario,
  rolUsuario,
  onSalir,
  hrefTienda,
  children,
}: PropsDisposicionPanel) {
  const visible = seccionActiva || (secciones[0]?.id ?? "");
  const tituloSeccion = secciones.find((seccion) => seccion.id === visible)?.etiqueta;

  return (
    <div className="ui-pagina-tienda ui-fondo-escena">
      <DisposicionCuenta
        titulo="Panel de administración"
        subtitulo={`Hola, ${nombreUsuario}`}
        nombreUsuario={nombreUsuario}
        rolUsuario={rolUsuario}
        secciones={secciones}
        seccionActiva={visible}
        onSeccion={onSeccion}
        {...(onSalir ? { onSalir } : {})}
        {...(hrefTienda ? { enlaceLateral: { href: hrefTienda, etiqueta: "Volver a la tienda" }, hrefSalirMenu: hrefTienda } : {})}
        enMenu={seccionActiva === ""}
        {...(tituloSeccion ? { tituloSeccion } : {})}
        onVolver={() => onSeccion("")}
        menuMovil={
          <MenuCuenta
            grupos={[
              {
                opciones: secciones.map((seccion) => ({
                  id: seccion.id,
                  etiqueta: seccion.etiqueta,
                  icono: seccion.icono ?? null,
                  seccion: seccion.id,
                })),
              },
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
