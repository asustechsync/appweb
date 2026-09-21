"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { Enrutador } from "@appweb/api";

/**
 * Cliente tipado del panel.
 *
 * `useTRPC()` devuelve las opciones de cada procedimiento para TanStack Query:
 * los tipos de entrada y salida salen del enrutador de @appweb/api, asi que si
 * una ruta cambia de forma, esto deja de compilar en vez de fallar en runtime.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<Enrutador>();
