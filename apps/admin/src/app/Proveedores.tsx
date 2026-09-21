"use client";

import { useState, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { Enrutador } from "@appweb/api";

import { TRPCProvider } from "@/lib/trpc";

/**
 * Cache del panel. Se monta una vez y sobrevive a todos los cambios de
 * seccion: eso es lo que hace que navegar cueste 0 ms.
 *
 * `staleTime` alto a proposito — un listado de usuarios no cambia entre dos
 * clics, y cada mutacion invalida lo que toca por su cuenta.
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
