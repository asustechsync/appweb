"use client";

import { useQuery } from "@tanstack/react-query";

import { Alerta, Cargando, InformacionGrid, Insignia, Tarjeta } from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

function Valor({ valor }: { valor: string | null }) {
  return valor ? <span>{valor}</span> : <Insignia tono="alerta">Sin configurar</Insignia>;
}

/**
 * Negocio: como esta configurada la tienda. Solo lectura, porque estos datos
 * salen del entorno del servidor; aqui se ve que falta para poder vender.
 */
export function Negocio() {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.panel.negocio.estado.queryOptions());

  if (consulta.isPending) return <Cargando texto="Cargando el negocio…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  const n = consulta.data;

  return (
    <>
      {n.listoParaVender ? (
        <Alerta tono="exito">La tienda tiene todo lo necesario para vender.</Alerta>
      ) : (
        <Alerta tono="error">
          Para vender falta configurar: {n.faltan.join(" · ")}. Se cambia en las variables de
          entorno del servidor.
        </Alerta>
      )}

      <Tarjeta titulo="Datos del proveedor">
        <InformacionGrid
          datos={[
            { titulo: "Nombre comercial", contenido: n.proveedor.nombre },
            { titulo: "Razón social", contenido: n.proveedor.razonSocial },
            { titulo: "RUC", contenido: n.proveedor.ruc },
            { titulo: "Dirección", contenido: n.proveedor.direccion },
            { titulo: "Correo de atención", contenido: n.proveedor.correo },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Medios de pago">
        <InformacionGrid
          datos={[
            { titulo: "Yape", contenido: <Valor valor={n.pagos.yape} /> },
            { titulo: "Plin", contenido: <Valor valor={n.pagos.plin} /> },
            { titulo: "Cuenta bancaria", contenido: <Valor valor={n.pagos.cuenta} /> },
            { titulo: "Titular", contenido: <Valor valor={n.pagos.titular} /> },
            {
              titulo: "Tarjeta de prueba",
              contenido: (
                <Insignia tono={n.pagos.tarjetaDePrueba ? "alerta" : "neutro"}>
                  {n.pagos.tarjetaDePrueba ? "Activa" : "Apagada"}
                </Insignia>
              ),
            },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Contacto y avisos">
        <InformacionGrid
          datos={[
            {
              titulo: "WhatsApp de la tienda",
              contenido: <Valor valor={n.contacto.whatsappTienda} />,
            },
            {
              titulo: "WhatsApp mayorista",
              contenido: <Valor valor={n.contacto.whatsappMayorista} />,
            },
            {
              titulo: "Avisos de pedidos a",
              contenido: <Valor valor={n.contacto.avisosPedidos} />,
            },
            {
              titulo: "Avisos de reclamos a",
              contenido: <Valor valor={n.contacto.avisosReclamos} />,
            },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Servicios">
        <InformacionGrid
          datos={[
            {
              titulo: "Correo (Resend)",
              contenido: (
                <Insignia tono={n.servicios.correo ? "exito" : "alerta"}>
                  {n.servicios.correo ? "Conectado" : "Sin configurar"}
                </Insignia>
              ),
            },
            {
              titulo: "Fotos de producto",
              contenido: (
                <Insignia tono={n.servicios.fotos ? "exito" : "alerta"}>
                  {n.servicios.fotos ? "Conectado" : "Sin configurar"}
                </Insignia>
              ),
            },
          ]}
        />
      </Tarjeta>
    </>
  );
}
