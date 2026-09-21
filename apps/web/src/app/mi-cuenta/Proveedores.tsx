"use client";

import { useState, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { Enrutador } from "@appweb/api";

import { TRPCProvider } from "@/lib/trpc";

/**
 * Cache de /mi-cuenta. Se monta una vez y sobrevive a los cambios de seccion:
 * volver a "Pedidos" despues de pasar por "Direcciones" no vuelve a pedir
 * nada al servidor.
 */
export function Proveedores({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    createTRPCClient<Enrutador>({
      links: [httpBatchLink({ url: "/api/trpc" })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
