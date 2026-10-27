"use client";

import { useQuery } from "@tanstack/react-query";

import { textoQueFalta } from "@appweb/core";
import {
  Alerta,
  Cargando,
  EscaleraNiveles,
  ProgresoNivel,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  TONO_NIVEL,
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

  const { nivel, totalComprado, pedidos, siguiente, progresoPct, niveles } = consulta.data;

  return (
    <>
      <Tarjeta titulo="Tu nivel">
        <ProgresoNivel
          titulo={`Nivel ${nivel.nombre}`}
          detalle={nivel.beneficio}
          progresoPct={progresoPct}
          pie={
            siguiente
              ? `Te faltan ${textoQueFalta(siguiente)} para llegar a ${siguiente.nivel.nombre}`
              : "Estás en el nivel más alto"
          }
          tono={TONO_NIVEL[nivel.id]}
        />
      </Tarjeta>

      <RejillaMetricas>
        <TarjetaMetrica
          etiqueta="Comprado"
          valor={MONEDA.format(totalComprado)}
          contexto="Suma de tus pedidos pagados"
        />
        <TarjetaMetrica
          etiqueta="Pedidos"
          valor={String(pedidos)}
          contexto={pedidos === 1 ? "1 pedido hasta hoy" : `${pedidos} pedidos hasta hoy`}
        />
        <TarjetaMetrica
          etiqueta="Descuento"
          valor={`${nivel.descuentoPct} %`}
          contexto={
            nivel.descuentoPct > 0 ? "Se aplica solo al pagar" : "Sube de nivel para tenerlo"
          }
        />
      </RejillaMetricas>

      <Tarjeta titulo="Niveles">
        <EscaleraNiveles
          tramos={niveles.map((n) => ({
            id: n.id,
            nombre: n.nombre,
            desde: n.desde,
            etiquetaDesde:
              n.desde > 0
                ? `desde ${MONEDA.format(n.desde)} y ${n.pedidosMinimos} pedidos`
                : "al crear tu cuenta",
            detalle: n.descuentoPct > 0 ? `${n.descuentoPct}% de descuento` : "sin descuento",
            tono: TONO_NIVEL[n.id],
          }))}
        />
      </Tarjeta>
    </>
  );
}
