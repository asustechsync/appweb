"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { Enrutador } from "@appweb/api";

/**
 * Cliente tipado de /mi-cuenta. Solo lo usa esa rama de la app: el catalogo es
 * Clase A y se sirve cacheado, y el carrito y el checkout van por server
 * actions. Aqui hace falta porque es una SPA que pide JSON.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<Enrutador>();
