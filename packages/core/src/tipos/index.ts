/**
 * Esquemas de validacion (zod).
 *
 * Validan lo mismo en la web, en el panel y en la app movil: un solo sitio
 * define que es un email valido o cuantos caracteres tiene una clave.
 */

import { z } from "zod";

import { TIPOS_DOCUMENTO } from "../usuarios/documento";
import { GENEROS } from "../usuarios/genero";
import { ROLES } from "../usuarios/permisos";

// ── Cuenta ─────────────────────────────────────────────────────────────────

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.email("Revisa el correo").toLowerCase(),
  clave: z.string().min(8, "Minimo 8 caracteres").max(72),
  telefono: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Numero de 9 digitos que empieza en 9")
    .optional(),
});

export const esquemaIngreso = z.object({
  email: z.email("Revisa el correo").toLowerCase(),
  clave: z.string().min(1, "Escribe tu clave"),
});

/** Actualizacion del perfil desde /mi-cuenta. El tipo y numero de documento
    van juntos o no van: uno sin el otro no sirve para precargar el checkout
    ni para identificar al cliente. */
export const esquemaPerfil = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  apellido: z.string().trim().min(2, "Escribe tu apellido").max(80).optional(),
  telefono: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Numero de 9 digitos que empieza en 9")
    .optional(),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO).optional(),
  numeroDocumento: z.string().trim().min(6).max(20).optional(),
  fechaNacimiento: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida")
    .optional(),
  genero: z.enum(GENEROS).optional(),
}).refine((datos) => !datos.tipoDocumento === !datos.numeroDocumento, {
  message: "Elige el tipo y escribe el numero de documento",
  path: ["numeroDocumento"],
});

// ── Usuarios (panel) ───────────────────────────────────────────────────────

/** Alta de cuenta desde el panel: lo mismo que un registro, mas el rol. El
    autorregistro publico nunca elige rol; siempre sale CLIENTE. */
export const esquemaUsuarioPanel = esquemaRegistro.extend({
  rol: z.enum(ROLES),
});

export const esquemaCambioRol = z.object({
  usuarioId: z.string().min(1),
  rol: z.enum(ROLES),
});

export const esquemaCambioActivo = z.object({
  usuarioId: z.string().min(1),
  activo: z.boolean(),
});

// ── Direccion ──────────────────────────────────────────────────────────────

export const esquemaDireccion = z.object({
  departamento: z.string().trim().min(1, "Elige el departamento"),
  provincia: z.string().trim().min(1, "Elige la provincia"),
  distrito: z.string().trim().min(1, "Elige el distrito"),
  calle: z.string().trim().min(5, "Escribe la direccion completa").max(200),
  referencia: z.string().trim().max(200).optional(),
  principal: z.boolean().default(false),
});

// ── Catalogo (panel) ───────────────────────────────────────────────────────

export const esquemaProducto = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minusculas, numeros y guiones"),
  nombre: z.string().trim().min(3).max(140),
  descripcion: z.string().trim().max(4000).optional(),
  marca: z.string().trim().max(60).optional(),
  categoriaId: z.string().min(1, "Elige una categoria"),
  precio: z.number().positive("El precio tiene que ser mayor que cero"),
  precioLista: z.number().positive().nullable().optional(),
  activo: z.boolean().default(true),
});

export const esquemaVariante = z.object({
  talla: z.string().trim().min(1).max(12),
  color: z.string().trim().min(1).max(40),
  sku: z.string().trim().min(1).max(40),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  activa: z.boolean().default(true),
});

// ── Compra ─────────────────────────────────────────────────────────────────

export const esquemaLineaCarrito = z.object({
  varianteId: z.string().min(1),
  cantidad: z.number().int().min(1).max(20),
});

export const esquemaCheckout = z.object({
  direccionId: z.string().min(1, "Elige una direccion"),
  metodoEnvioId: z.string().min(1, "Elige como recibir tu pedido"),
  medioPago: z.enum(["yape", "plin", "transferencia", "contra_entrega"]),
  // Se piden DESDE AHORA aunque la boleta electronica llegue despues: si no se
  // capturan al inicio, luego no hay forma de conseguirlos.
  comprobante: z.enum(["boleta", "factura"]).default("boleta"),
  documento: z.string().trim().min(8).max(11),
  razonSocial: z.string().trim().max(200).optional(),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosIngreso = z.infer<typeof esquemaIngreso>;
export type DatosPerfil = z.infer<typeof esquemaPerfil>;
export type DatosUsuarioPanel = z.infer<typeof esquemaUsuarioPanel>;
export type DatosDireccion = z.infer<typeof esquemaDireccion>;
export type DatosProducto = z.infer<typeof esquemaProducto>;
export type DatosVariante = z.infer<typeof esquemaVariante>;
export type DatosCheckout = z.infer<typeof esquemaCheckout>;
