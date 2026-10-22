"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

import { IconoFlechaAbajo, IconoFlechaDerecha, IconoFlechaIzquierda } from "../../iconos";
import { Contenedor } from "../base/Contenedor";
import { Insignia } from "../base/Insignia";

import "../estilos.css";

export interface SeccionDeCuenta {
  id: string;
  etiqueta: string;
  /** Con `href` la entrada es un enlace a otra pagina, no una seccion de la cuenta. */
  href?: string;
  /** Titulo del grupo en el lateral. Las secciones de un grupo van seguidas. */
  grupo?: string | undefined;
  /** Icono de la pestaña; en el panel solo lo llevan las secciones sin grupo. */
  icono?: ReactNode;
  /** Pendientes de la seccion: se muestran como insignia. */
  contador?: number | undefined;
  /** Titulo pequeño que separa el menu en bloques ("Menú", "Preferencias"). */
  apartado?: string | undefined;
}

export interface PropsDisposicionCuenta {
  /** Sin titulo ni subtitulo no se pinta la cabecera. */
  titulo?: string;
  subtitulo?: string;
  nombreUsuario: string;
  rolUsuario?: string;
  secciones: SeccionDeCuenta[];
  /** Icono de cada titulo de grupo, por nombre de grupo. */
  iconosGrupo?: Record<string, ReactNode>;
  seccionActiva: string;
  onSeccion: (id: string) => void;
  onSalir?: () => void;
  /** Atajo de `enlaceLateral` para el boton "Panel de administracion". */
  hrefPanel?: string;
  /** Enlace bajo las pestañas (p. ej. "Volver a la tienda" en el panel). */
  enlaceLateral?: { href: string; etiqueta: string };
  /**
   * Sustituye la tarjeta del usuario por la marca (p. ej. el logo en el panel).
   * Sin el, el lateral muestra la tarjeta del usuario de siempre.
   */
  marcaLateral?: ReactNode;
  /**
   * Menu de ajustes para movil (normalmente un `MenuCuenta`). Con el, en movil
   * la cuenta es de dos pantallas: el menu, o una seccion con flecha de volver.
   * Desde `lg` no se usa y queda el lateral de siempre.
   */
  menuMovil?: ReactNode;
  /**
   * Barra sobre el contenido (p. ej. el buscador del panel). Con ella, la marca
   * del lateral sube a la misma fila, sobre el menu: las dos columnas arrancan
   * a la misma altura.
   */
  barraSuperior?: ReactNode;
  /** En movil, mostrar el menu en vez de la seccion. */
  enMenu?: boolean;
  /** Titulo de la barra movil cuando se ve una seccion. */
  tituloSeccion?: string;
  /** Flecha de la barra movil en una seccion: vuelve al menu. */
  onVolver?: () => void;
  /** Flecha de la barra movil en el menu: sale de la cuenta. */
  hrefSalirMenu?: string;
  children: ReactNode;
}

/**
 * Disposicion de /mi-cuenta: panel lateral con la tarjeta del usuario y las
 * pestañas de seccion debajo, y el contenido a un lado.
 *
 * En movil la tarjeta y las pestañas se apilan sobre el contenido — recien
 * desde el quiebre `lg` el lateral pasa a columna fija junto al contenido.
 * No navega ni cierra sesion: avisa con `onSeccion` y `onSalir`.
 */
export function DisposicionCuenta({
  titulo,
  subtitulo,
  nombreUsuario,
  rolUsuario,
  secciones,
  iconosGrupo,
  seccionActiva,
  onSeccion,
  onSalir,
  hrefPanel,
  enlaceLateral,
  marcaLateral,
  menuMovil,
  barraSuperior,
  enMenu = false,
  tituloSeccion,
  onVolver,
  hrefSalirMenu = "/",
  children,
}: PropsDisposicionCuenta) {
  const enlace =
    enlaceLateral ?? (hrefPanel ? { href: hrefPanel, etiqueta: "Panel de administracion" } : null);

  // Un solo grupo abierto a la vez: abrir otro cierra el anterior. Empieza
  // abierto el de la seccion activa, y ese pasa a ser el abierto cada vez que
  // la seccion cambia (p. ej. al llegar desde un aviso).
  const bloques = agruparSecciones(secciones);
  const hayGrupos = bloques.some((bloque) => bloque.grupo);
  const grupoActivo = secciones.find((seccion) => seccion.id === seccionActiva)?.grupo;
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(grupoActivo ?? null);
  useEffect(() => {
    if (grupoActivo) setGrupoAbierto(grupoActivo);
  }, [grupoActivo]);

  function alternar(grupo: string) {
    setGrupoAbierto((previo) => (previo === grupo ? null : grupo));
  }
  const clase = menuMovil
    ? `ui-disposicion-cuenta ui-disposicion-cuenta--con-menu ${enMenu ? "ui-disposicion-cuenta--en-menu" : ""}`
    : "ui-disposicion-cuenta";

  return (
    <Contenedor>
      <div className={clase}>
        {menuMovil ? (
          <div className="ui-disposicion-cuenta__barra-movil">
            {enMenu ? (
              <a
                href={hrefSalirMenu}
                className="ui-disposicion-cuenta__volver"
                aria-label="Volver a la tienda"
              >
                <IconoFlechaIzquierda />
              </a>
            ) : (
              <button
                type="button"
                className="ui-disposicion-cuenta__volver"
                onClick={onVolver}
                aria-label="Volver a mi cuenta"
              >
                <IconoFlechaIzquierda />
              </button>
            )}
            <h1>{enMenu ? titulo : (tituloSeccion ?? titulo)}</h1>
          </div>
        ) : null}
        {menuMovil ? <div className="ui-disposicion-cuenta__menu-movil">{menuMovil}</div> : null}

        {titulo || subtitulo ? (
          <header className="ui-disposicion-cuenta__cabecera">
            {titulo ? <h1>{titulo}</h1> : null}
            {subtitulo ? <p>{subtitulo}</p> : null}
          </header>
        ) : null}

        {barraSuperior ? (
          <div className="ui-disposicion-cuenta__barra-superior">
            {marcaLateral ? (
              <div className="ui-disposicion-cuenta__barra-marca">{marcaLateral}</div>
            ) : null}
            <div className="ui-disposicion-cuenta__barra-contenido">{barraSuperior}</div>
          </div>
        ) : null}

        <div className="ui-disposicion-cuenta__cuerpo">
          <aside className="ui-disposicion-cuenta__lateral">
            {barraSuperior ? null : marcaLateral ? (
              <div className="ui-disposicion-cuenta__marca">{marcaLateral}</div>
            ) : (
              <div className="ui-disposicion-cuenta__tarjeta-usuario">
                <div className="ui-disposicion-cuenta__portada" aria-hidden="true" />
                <div className="ui-disposicion-cuenta__cuerpo-usuario">
                  <span className="ui-disposicion-cuenta__avatar" aria-hidden="true">
                    {nombreUsuario.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="ui-disposicion-cuenta__usuario-texto">
                    <span className="ui-disposicion-cuenta__nombre">{nombreUsuario}</span>
                    <span className="ui-disposicion-cuenta__usuario-insignias">
                      {rolUsuario ? <Insignia tono="marca">{rolUsuario}</Insignia> : null}
                      <span className="ui-disposicion-cuenta__activa">
                        <i aria-hidden="true" />
                        Activa
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            )}

            <nav
              className={
                hayGrupos
                  ? "ui-disposicion-cuenta__pestanas ui-disposicion-cuenta__pestanas--agrupadas"
                  : "ui-disposicion-cuenta__pestanas"
              }
              aria-label="Secciones de mi cuenta"
            >
              {bloques.map((bloque, indice) => {
                const pestanas = bloque.secciones.map((seccion) => {
                  const contenido = (
                    <>
                      {seccion.icono ? (
                        <span className="ui-disposicion-cuenta__pestana-icono" aria-hidden="true">
                          {seccion.icono}
                        </span>
                      ) : null}
                      {seccion.etiqueta}
                      {seccion.contador ? (
                        <span className="ui-disposicion-cuenta__contador">
                          <Insignia tono="alerta">{seccion.contador}</Insignia>
                        </span>
                      ) : null}
                    </>
                  );
                  return seccion.href ? (
                    <a
                      key={seccion.id}
                      href={seccion.href}
                      className="ui-disposicion-cuenta__pestana"
                    >
                      {contenido}
                    </a>
                  ) : (
                    <button
                      key={seccion.id}
                      type="button"
                      className={
                        seccion.id === seccionActiva
                          ? "ui-disposicion-cuenta__pestana ui-disposicion-cuenta__pestana--activa"
                          : "ui-disposicion-cuenta__pestana"
                      }
                      onClick={() => onSeccion(seccion.id)}
                      aria-current={seccion.id === seccionActiva ? "page" : undefined}
                    >
                      {contenido}
                    </button>
                  );
                });
                const grupo = bloque.grupo;
                const tituloApartado =
                  bloque.apartado && bloque.apartado !== bloques[indice - 1]?.apartado ? (
                    <span className="ui-disposicion-cuenta__apartado">{bloque.apartado}</span>
                  ) : null;
                if (!grupo)
                  return (
                    <Fragment key={`suelto-${indice}`}>
                      {tituloApartado}
                      {pestanas}
                    </Fragment>
                  );

                const abierto = grupoAbierto === grupo;
                const idLista = `grupo-cuenta-${indice}`;
                // Cerrado, el grupo suma los pendientes de sus secciones para
                // que ningun aviso quede escondido.
                const pendientes = abierto
                  ? 0
                  : bloque.secciones.reduce((suma, seccion) => suma + (seccion.contador ?? 0), 0);
                return (
                  <Fragment key={grupo}>
                    {tituloApartado}
                    <div className="ui-disposicion-cuenta__grupo">
                      <button
                        type="button"
                        className={
                          grupo === grupoActivo
                            ? "ui-disposicion-cuenta__grupo-titulo ui-disposicion-cuenta__grupo-titulo--activo"
                            : "ui-disposicion-cuenta__grupo-titulo"
                        }
                        aria-expanded={abierto}
                        aria-controls={idLista}
                        onClick={() => alternar(grupo)}
                      >
                        {iconosGrupo?.[grupo] ? (
                          <span className="ui-disposicion-cuenta__pestana-icono" aria-hidden="true">
                            {iconosGrupo[grupo]}
                          </span>
                        ) : null}
                        {grupo}
                        {pendientes > 0 ? (
                          <span className="ui-disposicion-cuenta__contador">
                            <Insignia tono="alerta">{pendientes}</Insignia>
                          </span>
                        ) : null}
                        <IconoFlechaAbajo
                          tamano={16}
                          className={
                            abierto
                              ? "ui-disposicion-cuenta__grupo-flecha ui-disposicion-cuenta__grupo-flecha--abierta"
                              : "ui-disposicion-cuenta__grupo-flecha"
                          }
                        />
                      </button>
                      <div
                        className={
                          abierto
                            ? "ui-disposicion-cuenta__despliegue ui-disposicion-cuenta__despliegue--abierto"
                            : "ui-disposicion-cuenta__despliegue"
                        }
                      >
                        {/* Cerrada sigue en el arbol para poder animarla: `inert` la saca
                            del foco y de los lectores de pantalla. */}
                        <div
                          id={idLista}
                          className="ui-disposicion-cuenta__grupo-lista"
                          inert={!abierto}
                        >
                          {pestanas}
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {onSalir ? (
                <button
                  type="button"
                  className="ui-disposicion-cuenta__pestana ui-disposicion-cuenta__pestana--salir"
                  onClick={onSalir}
                >
                  Salir
                </button>
              ) : null}
            </nav>

            {enlace ? (
              <a href={enlace.href} className="ui-disposicion-cuenta__ir-panel">
                {enlace.etiqueta}
                <IconoFlechaDerecha tamano={16} />
              </a>
            ) : null}
          </aside>

          <div className="ui-disposicion-cuenta__principal">
            <div className="ui-disposicion-cuenta__contenido">{children}</div>
          </div>
        </div>
      </div>
    </Contenedor>
  );
}

/** Secciones seguidas del mismo grupo y apartado -> un bloque; sin grupo, bloque suelto. */
function agruparSecciones(
  secciones: SeccionDeCuenta[],
): { apartado: string | undefined; grupo: string | undefined; secciones: SeccionDeCuenta[] }[] {
  const bloques: {
    apartado: string | undefined;
    grupo: string | undefined;
    secciones: SeccionDeCuenta[];
  }[] = [];
  for (const seccion of secciones) {
    const ultimo = bloques.at(-1);
    if (
      ultimo &&
      ultimo.grupo === seccion.grupo &&
      ultimo.apartado === seccion.apartado &&
      seccion.grupo
    )
      ultimo.secciones.push(seccion);
    else bloques.push({ apartado: seccion.apartado, grupo: seccion.grupo, secciones: [seccion] });
  }
  return bloques;
}
