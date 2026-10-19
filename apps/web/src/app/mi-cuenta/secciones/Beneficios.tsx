"use client";

import { useQuery } from "@tanstack/react-query";

import { Alerta, Cargando, IconoEtiqueta, IconoMoneda, IconoPremio, MenuCuenta } from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { MONEDA } from "@appweb/core/formato";

/**
 * Nivel de recompensa del cliente: en cual esta, cuanto lleva comprado y
 * cuanto le falta para el siguiente. Los niveles y sus beneficios salen de
 * `NIVELES` de @appweb/core; el descuento se aplica solo en el checkout.
 */
export function Beneficios() {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.cuenta.nivel.queryOptions());

  if (consulta.isPending) return <Cargando texto="Cargando tus beneficios…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  const { nivel, totalComprado, siguiente, niveles } = consulta.data;

  return (
    <>
      <Alerta tono="info">
        {siguiente
          ? `Te faltan ${MONEDA.format(siguiente.falta)} en compras para llegar a ${siguiente.nivel.nombre}.`
          : `Estás en el nivel más alto. ${nivel.beneficio}`}
      </Alerta>
      <MenuCuenta
        onSeccion={() => {}}
        grupos={[
          {
            titulo: "Tu nivel",
            opciones: [
              {
                id: "nivel",
                etiqueta: "Nivel actual",
                icono: <IconoPremio />,
                valor: nivel.nombre,
              },
              {
                id: "comprado",
                etiqueta: "Comprado hasta hoy",
                icono: <IconoMoneda />,
                valor: MONEDA.format(totalComprado),
              },
            ],
          },
          {
            titulo: "Niveles",
            opciones: niveles.map((n) => ({
              id: `nivel-${n.id}`,
              etiqueta: `${n.nombre}${n.desde > 0 ? ` · desde ${MONEDA.format(n.desde)}` : ""}`,
              icono: n.id === nivel.id ? <IconoPremio /> : <IconoEtiqueta />,
              valor: n.descuentoPct > 0 ? `${n.descuentoPct}% dcto.` : "Sin descuento",
            })),
          },
        ]}
      />
    </>
  );
}
