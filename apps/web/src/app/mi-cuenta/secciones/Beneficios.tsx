"use client";

import { useQuery } from "@tanstack/react-query";

import { textoQueFalta } from "@appweb/core";
import {
  Alerta,
  Cargando,
  IconoEtiqueta,
  IconoMoneda,
  IconoPedidos,
  IconoPremio,
  MenuCuenta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { MONEDA } from "@appweb/core/formato";

/**
 * Nivel de recompensa del cliente: en cual esta, cuanto lleva comprado (monto
 * y pedidos) y cuanto le falta de cada uno para el siguiente. Los niveles y
 * sus beneficios salen de la tabla `niveles`, que edita el panel; el descuento
 * se aplica solo en el checkout.
 */
export function Beneficios() {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.cuenta.nivel.queryOptions());

  if (consulta.isPending) return <Cargando texto="Cargando tus beneficios…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  const { nivel, totalComprado, pedidos, siguiente, niveles } = consulta.data;

  return (
    <>
      <Alerta tono="info">
        {siguiente
          ? `Te faltan ${textoQueFalta(siguiente)} para llegar a ${siguiente.nivel.nombre}. ${nivel.beneficio}`
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
              {
                id: "pedidos",
                etiqueta: "Pedidos hasta hoy",
                icono: <IconoPedidos />,
                valor: String(pedidos),
              },
            ],
          },
          {
            titulo: "Niveles",
            opciones: niveles.map((n) => ({
              id: `nivel-${n.id}`,
              etiqueta: `${n.nombre}${n.desde > 0 ? ` · ${MONEDA.format(n.desde)} y ${n.pedidosMinimos} pedidos` : " · al crear tu cuenta"}`,
              icono: n.id === nivel.id ? <IconoPremio /> : <IconoEtiqueta />,
              valor: n.descuentoPct > 0 ? `${n.descuentoPct}% dcto.` : "Sin descuento",
            })),
          },
        ]}
      />
    </>
  );
}
