"use client";

import { useEffect, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

/** Cada cuanto se pregunta si hay pedidos nuevos. */
const INTERVALO_MS = 60_000;

/**
 * Cuantos pedidos esperan a alguien, consultado cada minuto (tambien con la
 * pestaña en segundo plano). Cuando aparece un pendiente mas nuevo que el
 * ultimo visto, devuelve su codigo en `nuevo` para avisar, y refresca las
 * listas de pedidos y envios para que ya lo muestren.
 *
 * Tambien pone el numero en el titulo de la pestaña: "(2) Panel" se ve aunque
 * el panel este detras de otras pestañas.
 */
export function useAvisos() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const consulta = useQuery({
    ...trpc.panel.avisos.contadores.queryOptions(),
    refetchInterval: INTERVALO_MS,
    refetchIntervalInBackground: true,
  });

  const [nuevo, setNuevo] = useState<string | null>(null);
  // `undefined` = todavia no hubo primera lectura: lo que ya estaba al abrir
  // el panel no es "nuevo".
  const ultimoVisto = useRef<string | null | undefined>(undefined);

  const ultimo = consulta.data?.ultimoPendiente ?? null;
  useEffect(() => {
    if (!consulta.isSuccess) return;
    const marca = ultimo?.creadoEn ?? null;
    if (ultimoVisto.current === undefined) {
      ultimoVisto.current = marca;
      return;
    }
    if (marca !== null && (ultimoVisto.current === null || marca > ultimoVisto.current)) {
      ultimoVisto.current = marca;
      setNuevo(ultimo?.codigo ?? null);
      void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
      void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
    }
  }, [consulta.isSuccess, ultimo, queryClient, trpc]);

  const porConfirmar = consulta.data?.porConfirmar ?? 0;
  const porDespachar = consulta.data?.porDespachar ?? 0;
  const reclamosPendientes = consulta.data?.reclamosPendientes ?? 0;

  useEffect(() => {
    document.title = porConfirmar > 0 ? `(${porConfirmar}) Panel` : "Panel";
  }, [porConfirmar]);

  return {
    porConfirmar,
    porDespachar,
    reclamosPendientes,
    nuevo,
    descartar: () => setNuevo(null),
  };
}
