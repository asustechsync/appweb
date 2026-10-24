"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import {
  IconoLuna,
  IconoNotificacion,
  IconoPedidos,
  IconoPerfil,
  IconoUsuario,
} from "../../iconos";

import { AlternarTema } from "../base/AlternarTema";

import "../estilos.css";

const OPCIONES = [
  { href: "/mi-cuenta/perfil", nombre: "Perfil", Icono: IconoPerfil },
  { href: "/mi-cuenta/pedidos", nombre: "Pedidos", Icono: IconoPedidos },
  {
    href: "/mi-cuenta/notificaciones",
    nombre: "Notificaciones",
    Icono: IconoNotificacion,
  },
];

/**
 * Boton de usuario de la cabecera. En movil abre una hoja que sube desde abajo
 * con los accesos de la cuenta; en escritorio es un enlace directo a
 * /mi-cuenta. No lee la sesion: cada destino la valida y, sin ella, redirige a
 * /ingresar, asi la cabecera sigue siendo estatica.
 *
 * Es un <dialog> modal: trae el velo, el foco atrapado y el cierre con Escape.
 * Se monta en <body> con un portal para que no herede las reglas de los
 * enlaces de la cabecera.
 */
export function MenuUsuario() {
  const hoja = useRef<HTMLDialogElement>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  function abrir() {
    hoja.current?.showModal();
  }
  function cerrar() {
    hoja.current?.close();
  }
  // Un clic en el velo cae sobre el propio <dialog>, no sobre su contenido.
  function alTocarVelo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) cerrar();
  }

  return (
    <>
      <Link
        href="/mi-cuenta"
        className="ui-boton-icono ui-menu-usuario__enlace"
        aria-label="Mi cuenta"
        title="Mi cuenta"
      >
        <IconoUsuario />
      </Link>
      <button
        type="button"
        className="ui-boton-icono ui-menu-usuario__boton"
        aria-label="Mi cuenta"
        aria-haspopup="dialog"
        onClick={abrir}
      >
        <IconoUsuario />
      </button>

      {montado
        ? createPortal(
            <dialog
              ref={hoja}
              className="ui-menu-usuario__hoja"
              aria-label="Mi cuenta"
              onClick={alTocarVelo}
            >
              <div className="ui-menu-usuario__contenido">
                <span className="ui-menu-usuario__asa" aria-hidden="true" />
                <nav aria-label="Mi cuenta">
                  <ul className="ui-menu-usuario__lista">
                    {OPCIONES.map(({ href, nombre, Icono }) => (
                      <li key={href}>
                        <Link href={href} className="ui-menu-usuario__opcion" onClick={cerrar}>
                          <Icono tamano={20} />
                          {nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="ui-menu-usuario__ajuste">
                  <IconoLuna tamano={20} />
                  <span className="ui-menu-usuario__ajuste-texto">Modo oscuro</span>
                  <AlternarTema variante="interruptor" />
                </div>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
