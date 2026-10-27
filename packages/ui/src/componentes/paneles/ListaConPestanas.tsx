"use client";

import { useState, type ReactNode } from "react";

import { SelectorSegmentado } from "../formularios/SelectorSegmentado";
import { ListaActividad } from "./ListaActividad";

export interface PestanaLista {
  valor: string;
  /** Texto de la pestana: "Por atender". */
  etiqueta: string;
  /** Titulo de la lista mientras esta pestana esta elegida. */
  titulo: string;
  vacio: string;
  onVerTodos?: () => void;
  /** Las filas de esta pestana. */
  filas: ReactNode;
}

export interface PropsListaConPestanas {
  /** Nombre accesible del grupo de pestanas. */
  etiqueta: string;
  pestanas: PestanaLista[];
  /** Filas que se reservan en todas las pestanas. */
  reservar?: number;
  /** Las filas son `TarjetaActividad`. */
  filasAltas?: boolean;
}

/** `ListaActividad` con un par de pestanas para elegir que se lista. */
export function ListaConPestanas({
  etiqueta,
  pestanas,
  reservar,
  filasAltas,
}: PropsListaConPestanas) {
  const [elegida, setElegida] = useState(pestanas[0]?.valor ?? "");
  const activa = pestanas.find((pestana) => pestana.valor === elegida) ?? pestanas[0];
  if (!activa) return null;
  return (
    <ListaActividad
      titulo={activa.titulo}
      vacio={activa.vacio}
      {...(reservar ? { reservar } : {})}
      {...(filasAltas ? { filasAltas } : {})}
      {...(activa.onVerTodos ? { onVerTodos: activa.onVerTodos } : {})}
      pestanas={
        pestanas.length > 0 ? (
          <SelectorSegmentado
            etiqueta={etiqueta}
            opciones={pestanas.map(({ valor, etiqueta: texto }) => ({ valor, etiqueta: texto }))}
            valor={activa.valor}
            onCambio={setElegida}
          />
        ) : null
      }
    >
      {activa.filas}
    </ListaActividad>
  );
}
