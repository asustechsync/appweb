/**
 * Variables de entorno del servidor: TODAS se leen aqui, validadas, y el resto
 * del codigo pide `entorno()`. Asi una variable mal escrita o faltante se
 * descubre al arrancar (ver `revisarEntorno`, que corre desde
 * instrumentation.ts de cada app) y no el dia que un cliente intenta pagar.
 *
 * Solo servidor: aqui hay claves. Las URLs publicas viven en ./urls.ts.
 * Excepciones a proposito: `DATABASE_URL` tambien la lee @appweb/db (que no
 * depende de este paquete) y `SUPABASE_URL` el next.config de la tienda.
 */

import { z } from "zod";

/** "" cuenta como no puesta: .env.example deja las claves vacias. */
const texto = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

const esquema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: texto,
  AUTH_SECRETO: texto,
  COOKIE_DOMINIO: texto,

  TIENDA_NOMBRE: texto,
  TIENDA_RAZON_SOCIAL: texto,
  TIENDA_RUC: texto,
  TIENDA_DIRECCION: texto,
  TIENDA_CORREO: texto,

  YAPE_NUMERO: texto,
  PLIN_NUMERO: texto,
  CUENTA_BANCARIA: texto,
  TITULAR_CUENTA: texto,
  // "si" muestra "Tarjeta (prueba)" en el checkout para ver pagos con tarjeta
  // en el panel antes de la pasarela. No cobra nada y en produccion se ignora.
  PAGO_TARJETA_PRUEBA: texto,

  RESEND_API_KEY: texto,
  CORREO_REMITENTE: texto,
  NOTIFICAR_PEDIDOS_A: texto,

  WHATSAPP_TIENDA: texto,
  WHATSAPP_MAYORISTA: texto,

  SUPABASE_URL: texto,
  SUPABASE_SERVICE_ROLE_KEY: texto,
  SUPABASE_BUCKET: texto,
});

export type Entorno = z.infer<typeof esquema> & {
  produccion: boolean;
  /** A quien avisar de pedidos nuevos. */
  avisosPedidos: string | undefined;
  /** A quien avisar de reclamos nuevos: atencion al cliente o, si no hay, el de pedidos. */
  avisosReclamos: string | undefined;
  /** El checkout ofrece la tarjeta de prueba. Nunca en produccion. */
  tarjetaDePrueba: boolean;
};

let cache: Entorno | null = null;

/** Las variables ya leidas y tipadas. Se leen una vez por proceso. */
export function entorno(): Entorno {
  if (cache) return cache;
  const leido = esquema.parse(process.env);
  const produccion = leido.NODE_ENV === "production";
  cache = {
    ...leido,
    produccion,
    tarjetaDePrueba:
      !produccion && ["si", "1", "true"].includes((leido.PAGO_TARJETA_PRUEBA ?? "").toLowerCase()),
    avisosPedidos: leido.NOTIFICAR_PEDIDOS_A,
    avisosReclamos: leido.TIENDA_CORREO ?? leido.NOTIFICAR_PEDIDOS_A,
  };
  return cache;
}

export interface Revision {
  /** Sin esto la app no funciona: en produccion no arranca. */
  fatales: string[];
  /** Sin esto no se puede vender legalmente o el cliente no sabe como pagar. */
  paraVender: string[];
}

/** Que falta, sin lanzar. Lo usa `revisarEntorno` y sirve para un chequeo manual. */
export function faltantes(e: Entorno = entorno()): Revision {
  const fatales: string[] = [];
  if (!e.DATABASE_URL) fatales.push("DATABASE_URL");
  if (!e.AUTH_SECRETO) fatales.push("AUTH_SECRETO");
  else if (e.produccion && e.AUTH_SECRETO.length < 32) {
    fatales.push("AUTH_SECRETO (muy corto: mínimo 32 caracteres)");
  }

  const paraVender: string[] = [];
  if (!e.TIENDA_RAZON_SOCIAL) paraVender.push("TIENDA_RAZON_SOCIAL");
  if (!e.TIENDA_RUC) paraVender.push("TIENDA_RUC");
  else if (!/^(10|15|17|20)\d{9}$/.test(e.TIENDA_RUC))
    paraVender.push("TIENDA_RUC (no es un RUC válido)");
  if (!e.TIENDA_DIRECCION) paraVender.push("TIENDA_DIRECCION");
  if (!e.TIENDA_CORREO) paraVender.push("TIENDA_CORREO");
  if (!e.YAPE_NUMERO && !e.PLIN_NUMERO && !e.CUENTA_BANCARIA) {
    paraVender.push("YAPE_NUMERO, PLIN_NUMERO o CUENTA_BANCARIA (al menos uno)");
  }
  if (!e.RESEND_API_KEY) paraVender.push("RESEND_API_KEY (sin ella no salen los correos)");
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) {
    paraVender.push("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (fotos de producto)");
  }

  return { fatales, paraVender };
}

/**
 * Corre al arrancar cada app. En produccion: si falta algo fatal, no arranca;
 * si falta algo para vender, lo grita en el log. En desarrollo solo avisa una
 * vez, para no estorbar.
 */
export function revisarEntorno(app: string): void {
  const e = entorno();
  const { fatales, paraVender } = faltantes(e);

  if (fatales.length > 0) {
    const mensaje = `[${app}] Faltan variables de entorno: ${fatales.join(", ")}. Revisa .env.example.`;
    if (e.produccion) throw new Error(mensaje);
    console.warn(mensaje);
  }
  if (paraVender.length > 0) {
    const mensaje = `[${app}] Falta configurar para vender:\n  - ${paraVender.join("\n  - ")}`;
    if (e.produccion) console.error(mensaje);
    else console.warn(mensaje);
  }
}
