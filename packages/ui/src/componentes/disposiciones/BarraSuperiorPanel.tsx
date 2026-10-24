"use client";

import { useId, useRef, useState } from "react";

import { IconoBuscar, IconoNotificacion } from "../../iconos";
import { Insignia } from "../base/Insignia";
import type { SeccionDePanel } from "./DisposicionPanel";

import "../estilos.css";

export interface PropsBarraSuperiorPanel {
  secciones: SeccionDePanel[];
  onSeccion: (id: string) => void;
  nombreUsuario: string;
  rolUsuario: string;
}

/** Minusculas y sin tildes: "envios" encuentra "Envíos". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Barra superior del panel: buscador de secciones, campana de pendientes y
 * el usuario. Sin viajes al servidor — el buscador filtra la lista de
 * secciones que el panel ya tiene (filtrada por rol) y avisa con `onSeccion`.
 */
export function BarraSuperiorPanel({
  secciones,
  onSeccion,
  nombreUsuario,
  rolUsuario,
}: PropsBarraSuperiorPanel) {
  const idLista = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);

  const consulta = normalizar(texto.trim());
  const resultados = consulta
    ? secciones.filter((seccion) =>
        normalizar(`${seccion.etiqueta} ${seccion.grupo ?? ""}`).includes(consulta),
      )
    : [];

  const pendientes = secciones.reduce((suma, seccion) => suma + (seccion.contador ?? 0), 0);
  const conPendientes = secciones.find((seccion) => seccion.contador);

  function elegir(id: string) {
    onSeccion(id);
    setTexto("");
    setAbierto(false);
    campo.current?.blur();
  }

  return (
    <div className="ui-barra-panel">
      <div className="ui-barra-panel__buscador">
        <div className="ui-buscador" role="search">
          <label className="ui-solo-lectores" htmlFor={`${idLista}-campo`}>
            Buscar en el panel
          </label>
          <input
            ref={campo}
            id={`${idLista}-campo`}
            type="search"
            placeholder="Buscar en el panel"
            autoComplete="off"
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter" && resultados[0]) elegir(resultados[0].id);
              if (evento.key === "Escape") {
                setTexto("");
                setAbierto(false);
              }
            }}
          />
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => resultados[0] && elegir(resultados[0].id)}
          >
            <IconoBuscar tamano={20} />
          </button>
        </div>
        {abierto && consulta ? (
          <ul id={idLista} className="ui-barra-panel__resultados">
            {resultados.length ? (
              resultados.map((seccion) => (
                <li key={seccion.id}>
                  {/* onMouseDown: el clic llega antes de que el blur cierre la lista. */}
                  <button type="button" onMouseDown={() => elegir(seccion.id)}>
                    {seccion.icono ? (
                      <span className="ui-barra-panel__resultado-icono" aria-hidden="true">
                        {seccion.icono}
                      </span>
                    ) : null}
                    {seccion.etiqueta}
                    {seccion.grupo ? (
                      <span className="ui-barra-panel__resultado-grupo">{seccion.grupo}</span>
                    ) : null}
                  </button>
                </li>
              ))
            ) : (
              <li className="ui-barra-panel__sin-resultados">Sin resultados</li>
            )}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        className="ui-boton-icono ui-barra-panel__campana"
        aria-label={pendientes ? `Notificaciones: ${pendientes} pendientes` : "Notificaciones"}
        title={pendientes ? "Ir a lo pendiente" : "Sin pendientes"}
        onClick={() => conPendientes && onSeccion(conPendientes.id)}
      >
        <IconoNotificacion tamano={20} />
        {pendientes ? (
          <span className="ui-boton-icono__insignia">
            <Insignia tono="alerta">{pendientes}</Insignia>
          </span>
        ) : null}
      </button>

      <div className="ui-barra-panel__usuario">
        <span className="ui-barra-panel__avatar" aria-hidden="true">
          {nombreUsuario.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="ui-barra-panel__usuario-texto">
          <span className="ui-barra-panel__nombre">{nombreUsuario}</span>
          <span className="ui-barra-panel__rol">{rolUsuario}</span>
        </span>
      </div>
    </div>
  );
}
