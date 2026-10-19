import type { Metadata } from "next";

import { datosTienda } from "@appweb/api/tienda";
import { PaginaInformativa } from "@appweb/ui";

import { FormularioReclamo } from "./FormularioReclamo";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Registra un reclamo o una queja en nuestro Libro de Reclamaciones virtual.",
};

/**
 * Libro de Reclamaciones virtual — CLASE A: la pagina es estatica (los datos
 * del proveedor salen del entorno al compilar) y el formulario es una isla
 * cliente que guarda con una server action.
 */
export default function PaginaLibroDeReclamaciones() {
  const tienda = datosTienda();
  return (
    <PaginaInformativa titulo="Libro de Reclamaciones">
      <p>
        Conforme al Código de Protección y Defensa del Consumidor, contamos con un Libro de
        Reclamaciones virtual a tu disposición.
      </p>
      <p>
        <strong>{tienda.razonSocial}</strong> · RUC {tienda.ruc}
        <br />
        {tienda.direccion}
      </p>

      <FormularioReclamo />

      <h2>Antes de enviar</h2>
      <ul>
        <li>
          <strong>Reclamo:</strong> disconformidad relacionada con los productos o servicios.
        </li>
        <li>
          <strong>Queja:</strong> disconformidad no relacionada con los productos o servicios, o
          malestar respecto a la atención al público.
        </li>
        <li>
          Responderemos al correo que indiques en un plazo no mayor a 15 días hábiles
          improrrogables.
        </li>
        <li>
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni
          es requisito previo para interponer una denuncia ante el INDECOPI.
        </li>
      </ul>
    </PaginaInformativa>
  );
}
