import type { ReactNode } from "react";

import {
  IconoBanco,
  IconoCamion,
  IconoFlechaDerecha,
  IconoMastercard,
  IconoPlin,
  IconoTarjetaPersonal,
  IconoVisa,
  IconoYape,
} from "../../iconos";
import "./lista-actividad.css";

export interface PropsListaActividad {
  /** Titulo arriba a la izquierda: "Pagos recientes". */
  titulo: string;
  /** Texto cuando no hay nada que mostrar. */
  vacio: string;
  /** "Ver todos" arriba a la derecha; sin esto no se muestra. */
  onVerTodos?: () => void;
  /** Las `TarjetaActividad`, de la mas reciente a la mas vieja. */
  children?: ReactNode;
}

/** Bloque con titulo, "Ver todos" opcional y una pila de `TarjetaActividad`. */
export function ListaActividad({ titulo, vacio, onVerTodos, children }: PropsListaActividad) {
  const hay = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="ui-lista-actividad">
      <div className="ui-lista-actividad__cabecera">
        <h3 className="ui-lista-actividad__titulo">{titulo}</h3>
        {onVerTodos ? (
          <button type="button" className="ui-lista-actividad__ver-todos" onClick={onVerTodos}>
            Ver todos
            <span className="ui-lista-actividad__flecha" aria-hidden="true">
              <IconoFlechaDerecha tamano={12} />
            </span>
          </button>
        ) : null}
      </div>
      {hay ? (
        <ul className="ui-lista-actividad__lista">{children}</ul>
      ) : (
        <p className="ui-lista-actividad__vacio">{vacio}</p>
      )}
    </section>
  );
}

export interface PropsTarjetaActividad {
  /** Arriba a la izquierda: "Recibido". */
  estado: string;
  /** Icono del estado, ya renderizado: `<IconoFlechaSubida tamano={12} />`. */
  iconoEstado: ReactNode;
  /** Color del estado: verde, ambar, rojo o gris. */
  tonoEstado: "exito" | "alerta" | "error" | "neutro";
  /** Arriba a la derecha, ya formateado: "10:42 a. m." o "Ayer, 6:05 p. m.". */
  fecha: string;
  /** Logo a la izquierda, ya renderizado: `<LogoMedioPago medio="yape" />`. */
  logo: ReactNode;
  /** Linea principal: "P-1042". */
  titulo: string;
  /** Bajo el titulo, opcional: "•••• 4242". */
  subtitulo?: string;
  /** Cifra a la derecha, ya formateada: "S/ 129.90". */
  valor: string;
  /** La cifra no cuenta (pago rechazado): va tachada y en gris. */
  anulado?: boolean;
}

/**
 * Un hecho reciente: el logo grande a la izquierda y, a su lado, estado y
 * fecha arriba; que fue y cuanto, abajo.
 */
export function TarjetaActividad({
  estado,
  iconoEstado,
  tonoEstado,
  fecha,
  logo,
  titulo,
  subtitulo,
  valor,
  anulado = false,
}: PropsTarjetaActividad) {
  return (
    <li className="ui-tarjeta-actividad">
      <div className="ui-tarjeta-actividad__cuerpo">
        <span className="ui-tarjeta-actividad__logo">{logo}</span>
        <div className="ui-tarjeta-actividad__datos">
          <div className="ui-tarjeta-actividad__fila">
            <span
              className={`ui-tarjeta-actividad__estado ui-tarjeta-actividad__estado--${tonoEstado}`}
            >
              <span className="ui-tarjeta-actividad__icono" aria-hidden="true">
                {iconoEstado}
              </span>
              {estado}
            </span>
            <span className="ui-tarjeta-actividad__fecha">{fecha}</span>
          </div>
          <div className="ui-tarjeta-actividad__fila">
            <span className="ui-tarjeta-actividad__que">
              <span className="ui-tarjeta-actividad__titulo">{titulo}</span>
              {subtitulo ? (
                <span className="ui-tarjeta-actividad__subtitulo">{subtitulo}</span>
              ) : null}
            </span>
            {anulado ? (
              <del className="ui-tarjeta-actividad__valor ui-tarjeta-actividad__valor--anulado">
                {valor}
              </del>
            ) : (
              <span className="ui-tarjeta-actividad__valor">{valor}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Visa y Mastercard ya tienen su logo aunque la base todavia no guarde pagos
 * con tarjeta: llegan con la pasarela, y el resumen no tendra que cambiar.
 */
export type MedioLogo =
  | "yape"
  | "plin"
  | "visa"
  | "mastercard"
  | "tarjeta"
  | "transferencia"
  | "contraEntrega";

export interface PropsLogoMedioPago {
  medio: MedioLogo;
  /** Nombre para lectores de pantalla: "Yape". */
  nombre: string;
}

/**
 * Logo cuadrado del medio de pago. Yape y Plin con su color y su nombre; los
 * medios sin marca, con un icono. Cuando lleguen los SVG oficiales, van en
 * iconos/fuente/marcas/ y reemplazan el texto.
 */
export function LogoMedioPago({ medio, nombre }: PropsLogoMedioPago) {
  return (
    <span
      className={`ui-logo-medio-pago ui-logo-medio-pago--${medio}`}
      role="img"
      aria-label={nombre}
    >
      {medio === "yape" ? <IconoYape /> : null}
      {medio === "plin" ? <IconoPlin /> : null}
      {medio === "visa" ? <IconoVisa /> : null}
      {medio === "mastercard" ? <IconoMastercard /> : null}
      {medio === "tarjeta" ? <IconoTarjetaPersonal tamano={16} /> : null}
      {medio === "transferencia" ? <IconoBanco /> : null}
      {medio === "contraEntrega" ? <IconoCamion tamano={16} /> : null}
    </span>
  );
}
