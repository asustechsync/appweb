/**
 * Esquemas de validacion (zod).
 *
 * Validan lo mismo en la web, en el panel y en la app movil: un solo sitio
 * define que es un email valido o cuantos caracteres tiene una clave.
 */

import { z } from "zod";

import { errorNumeroDocumento, TIPOS_DOCUMENTO } from "../usuarios/documento";
import { GENEROS } from "../usuarios/genero";
import { PERIODOS } from "../panel/resumen";
import { ESTADOS_PEDIDO } from "../pedidos/estados";
import { ESTADOS_PAGO } from "../pedidos/gestion";
import { ESTADOS_RECLAMO, TIPOS_BIEN, TIPOS_RECLAMO } from "../reclamos/libro";
import {
  DECISIONES_RESENA,
  ESTADOS_RESENA,
  MAX_ESTRELLAS,
  MAX_LETRAS_COMENTARIO,
  MIN_ESTRELLAS,
} from "../resenas/resenas";
import { IDS_NIVEL, MAX_BENEFICIO, revisarNiveles } from "../clientes/niveles";
import { TIPOS_MOVIMIENTO_MANUAL } from "../stock/manual";
import { ROLES } from "../usuarios/permisos";
import { REQUISITOS_CLAVE } from "../usuarios/requisitos-clave";

// ── Cuenta ─────────────────────────────────────────────────────────────────

/** La clave, igual en registro, panel y recuperacion. */
const esquemaClave = z
  .string()
  .max(72)
  .refine(
    (c) => REQUISITOS_CLAVE.every((r) => r.cumple(c)),
    "La contraseña no cumple los requisitos",
  );

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.email("Escribe un correo válido").toLowerCase(),
  clave: esquemaClave,
  telefono: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Solo números, entre 6 y 15 dígitos")
    .optional(),
});

/** Recuperacion de clave: solo pide el correo. */
export const esquemaRecuperacion = z.object({
  email: z.email("Escribe un correo válido").toLowerCase(),
});

/** Clave nueva desde el enlace del correo. */
export const esquemaNuevaClave = z.object({
  token: z.string().min(10, "El enlace no es válido"),
  clave: esquemaClave,
});

/** Autorregistro publico: correo, contraseña y telefono (obligatorio). El
    nombre sale del correo; el panel si lo pide, por eso no se quita arriba. */
export const esquemaAutorregistro = esquemaRegistro.omit({ nombre: true }).extend({
  telefono: z
    .string()
    .trim()
    .min(1, "Ingresa tu número de celular")
    .regex(/^\d{6,15}$/, "Solo números, entre 6 y 15 dígitos"),
});

export const esquemaIngreso = z.object({
  email: z.email("Escribe un correo válido").toLowerCase(),
  clave: z.string().min(1, "Escribe tu contraseña"),
  /** Marcada: la sesion dura 30 dias. Sin marcar: hasta cerrar el navegador. */
  recordar: z.boolean().default(false),
});

/** Actualizacion del perfil desde /mi-cuenta. El tipo y numero de documento
    van juntos o no van: uno sin el otro no sirve para precargar el checkout
    ni para identificar al cliente. */
export const esquemaPerfil = z
  .object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    apellidoPaterno: z
      .string()
      .trim()
      .min(2, "Escribe tu apellido paterno")
      .max(80, "El apellido es demasiado largo")
      .optional(),
    apellidoMaterno: z
      .string()
      .trim()
      .min(2, "Escribe tu apellido materno")
      .max(80, "El apellido es demasiado largo")
      .optional(),
    apodo: z
      .string()
      .trim()
      .min(2, "El apodo debe tener al menos 2 caracteres")
      .max(30, "El apodo es demasiado largo")
      .optional(),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{6,15}$/, "Solo números, entre 6 y 15 dígitos")
      .optional(),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO).optional(),
    numeroDocumento: z.string().trim().optional(),
    fechaNacimiento: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de nacimiento no es válida")
      .optional(),
    genero: z.enum(GENEROS).optional(),
  })
  .superRefine((datos, ctx) => {
    const mensaje = !datos.tipoDocumento
      ? datos.numeroDocumento
        ? "Elige el tipo de documento."
        : null
      : errorNumeroDocumento(datos.tipoDocumento, datos.numeroDocumento ?? "");
    if (mensaje) ctx.addIssue({ code: "custom", message: mensaje, path: ["numeroDocumento"] });
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

export const esquemaIdUsuario = z.object({
  usuarioId: z.string().min(1),
});

/** Datos de contacto que corrige el panel. El perfil completo lo edita el cliente. */
export const esquemaEdicionUsuario = z.object({
  usuarioId: z.string().min(1),
  nombre: z.string().trim().min(2, "Escribe el nombre").max(80),
  email: z.email("Escribe un correo válido").toLowerCase(),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Solo números, entre 6 y 15 dígitos")
    .nullable(),
});

/** Clave nueva que pone el panel (la persona la cambia despues desde su cuenta). */
export const esquemaClavePanel = z.object({
  usuarioId: z.string().min(1),
  clave: esquemaClave,
});

// ── Pedidos (panel) ────────────────────────────────────────────────────────

export const esquemaFiltroPedidos = z.object({
  /** Sin estados: todos. Con varios, los pedidos en cualquiera de ellos. */
  estados: z.array(z.enum(ESTADOS_PEDIDO)).optional(),
});

export const esquemaIdPedido = z.object({
  pedidoId: z.string().min(1),
});

export const esquemaConfirmarPago = z.object({
  pedidoId: z.string().min(1),
  pagoId: z.string().min(1),
  referencia: z
    .string()
    .trim()
    .min(1, "Escribe el número de operación del pago")
    .max(40, "El número de operación es demasiado largo"),
  nota: z.string().trim().max(200, "La nota es demasiado larga").optional(),
});

export const esquemaCambioEstadoPedido = z.object({
  pedidoId: z.string().min(1),
  estado: z.enum(ESTADOS_PEDIDO),
  nota: z.string().trim().max(200, "La nota es demasiado larga").optional(),
  /** Solo al marcar ENVIADO. */
  transportista: z.string().trim().max(60).optional(),
  codigoSeguimiento: z.string().trim().max(60).optional(),
});

// ── Resumen (panel) ────────────────────────────────────────────────────────

/** Periodo de las tarjetas de metricas. Sin el, el dia de hoy. Con `fecha`
    (aaaa-mm-dd), ese dia manda sobre el periodo. */
export const esquemaResumen = z.object({
  periodo: z.enum(PERIODOS).default("dia"),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional(),
});

// ── Pagos y devoluciones (panel) ──────────────────────────────────────────

export const esquemaFiltroPagos = z.object({
  /** Sin estado: todos. */
  estado: z.enum(ESTADOS_PAGO).optional(),
  /** Pedido, cliente u operacion. Se busca en todos los pagos, no solo en los visibles. */
  busqueda: z.string().trim().max(80).optional(),
  /** Cuantos pagos trae la lista; "Ver mas" lo sube de diez en diez. */
  limite: z.number().int().min(1).max(100).default(10),
});

/** Las tarjetas de Pagos: el mismo periodo o dia que el resumen de Inicio. */
export const esquemaMetricasPagos = esquemaResumen;

/** Mismo periodo que el resumen: las tarjetas de la seccion Pedidos. */
export const esquemaMetricasPedidos = esquemaResumen;

/** Mismo periodo que el resumen: las tarjetas de la seccion Envios. */
export const esquemaMetricasEnvios = esquemaResumen;

/** Un pago concreto, para su detalle. */
export const esquemaDetallePago = z.object({ pagoId: z.string().min(1) });

export const esquemaRechazarPago = z.object({
  pedidoId: z.string().min(1),
  pagoId: z.string().min(1),
  motivo: z
    .string()
    .trim()
    .min(1, "Escribe por qué se rechaza el pago")
    .max(200, "El motivo es demasiado largo"),
});

export const esquemaBuscarPedido = z.object({
  codigo: z.string().trim().min(1, "Escribe el código del pedido").max(30),
});

export const esquemaDevolucion = z.object({
  pedidoId: z.string().min(1),
  lineas: z
    .array(
      z.object({
        varianteId: z.string().min(1),
        cantidad: z.number().int().min(0).max(999),
        /** Cambio: la variante que se envia a cambio. */
        reemplazoVarianteId: z.string().min(1).optional(),
      }),
    )
    .max(100),
  reembolso: z
    .number({ error: "Escribe el monto a reembolsar" })
    .min(0, "El reembolso no puede ser negativo")
    .max(99999),
  referencia: z.string().trim().max(40, "El número de operación es demasiado largo").optional(),
  motivo: z
    .string()
    .trim()
    .min(1, "Escribe el motivo de la devolución")
    .max(200, "El motivo es demasiado largo"),
});

// ── Envios (panel) ─────────────────────────────────────────────────────────

/** Metodo de envio. Sin `metodoId` se crea uno nuevo. */
export const esquemaMetodoEnvio = z.object({
  metodoId: z.string().min(1).optional(),
  nombre: z.string().trim().min(3, "Escribe el nombre del método").max(60),
  costo: z.number({ error: "Escribe el costo" }).min(0, "El costo no puede ser negativo").max(9999),
  gratisDesde: z.number().min(0, "No puede ser negativo").max(99999).nullable(),
  /** Vacio = todo el pais. */
  departamentos: z.array(z.string().trim().min(1).max(40)).max(30),
  activo: z.boolean(),
  orden: z.number().int().min(0).max(999),
});

// ── Promociones (panel) ────────────────────────────────────────────────────

/** Ruta interna: "/envios", "/categorias/hombres", "/#ofertas". Nunca otro sitio. */
const rutaInterna = z
  .string()
  .trim()
  .regex(/^\/(?!\/)[a-zA-Z0-9/_#-]*$/, "Usa una ruta de la tienda que empiece con /");

/** Banner del carrusel de la portada. Sin `bannerId` se crea uno nuevo. */
export const esquemaBanner = z.object({
  bannerId: z.string().min(1).optional(),
  etiqueta: z.string().trim().min(1, "Escribe la etiqueta").max(40, "Máximo 40 caracteres"),
  titulo: z.string().trim().min(1, "Escribe el título").max(80, "Máximo 80 caracteres"),
  texto: z.string().trim().min(1, "Escribe el detalle").max(140, "Máximo 140 caracteres"),
  accion: z.string().trim().min(1, "Escribe el texto del botón").max(30, "Máximo 30 caracteres"),
  href: rutaInterna,
  orden: z.number().int().min(0).max(999),
  activo: z.boolean(),
});

/** Fecha del panel ("2026-12-31") o vacia. */
const fechaOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa una fecha válida")
  .nullable();

/** Cupon de descuento. Sin `cuponId` se crea uno nuevo. */
export const esquemaCupon = z
  .object({
    cuponId: z.string().min(1).optional(),
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "De 3 a 30 letras o números, sin espacios"),
    porcentaje: z
      .number({ error: "Escribe el porcentaje" })
      .int("Usa un número entero")
      .min(1, "Mínimo 1%")
      .max(100, "Máximo 100%"),
    minimoCompra: z.number().min(0).max(99999).nullable(),
    usosMaximos: z.number().int().min(1, "Mínimo 1 uso").max(1000000).nullable(),
    desde: fechaOpcional,
    hasta: fechaOpcional,
    activo: z.boolean(),
  })
  .refine((c) => c.desde === null || c.hasta === null || c.desde <= c.hasta, {
    message: "La fecha final tiene que ser posterior a la inicial",
    path: ["hasta"],
  });

// ── Niveles ────────────────────────────────────────────────────────────────

/** Los cinco niveles tal como los guarda el panel. Las reglas entre niveles
    (orden, umbrales crecientes) las revisa `revisarNiveles`. */
export const esquemaNiveles = z
  .object({
    niveles: z.array(
      z.object({
        id: z.enum(IDS_NIVEL),
        nombre: z.string().trim().min(1, "Escribe el nombre").max(30),
        desde: z.number({ error: "Escribe el monto" }).min(0).max(999999),
        pedidosMinimos: z
          .number({ error: "Escribe los pedidos" })
          .int("Usa un número entero")
          .min(0, "Mínimo 0")
          .max(1000),
        descuentoPct: z
          .number({ error: "Escribe el descuento" })
          .int("Usa un número entero")
          .min(0, "Mínimo 0%")
          .max(100, "Máximo 100%"),
        beneficio: z.string().trim().min(1, "Escribe el beneficio").max(MAX_BENEFICIO),
      }),
    ),
  })
  .superRefine((datos, contexto) => {
    const motivo = revisarNiveles(datos.niveles);
    if (motivo !== null) contexto.addIssue({ code: "custom", message: motivo });
  });

// ── Direccion ──────────────────────────────────────────────────────────────

export const esquemaDireccion = z.object({
  departamento: z.string().trim().min(1, "Elige el departamento"),
  provincia: z.string().trim().min(1, "Elige la provincia"),
  distrito: z.string().trim().min(1, "Elige el distrito"),
  calle: z
    .string()
    .trim()
    .min(5, "Escribe la dirección completa")
    .max(200, "La dirección es demasiado larga"),
  referencia: z.string().trim().max(200, "La referencia es demasiado larga").optional(),
  principal: z.boolean().default(false),
});

// ── Catalogo (panel) ───────────────────────────────────────────────────────

const textoOpcional = (maximo: number, mensaje: string) =>
  z.string().trim().max(maximo, mensaje).optional();

/** Alta y edicion de producto. El precio anterior, si hay, tiene que ser mayor
    (es lo que lo vuelve "oferta"); la base tiene el mismo CHECK. */
export const esquemaProducto = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "Escribe el nombre del producto")
      .max(140, "El nombre es demasiado largo"),
    slug: z
      .string()
      .trim()
      .min(3, "La dirección web es demasiado corta")
      .max(80, "La dirección web es demasiado larga")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
    categoriaId: z.string().min(1, "Elige una categoría"),
    marcaId: z.string().min(1).nullable().optional(),
    precio: z
      .number({ error: "Escribe el precio" })
      .positive("El precio tiene que ser mayor que cero")
      .max(99999, "El precio es demasiado alto"),
    precioLista: z.number().positive().max(99999).nullable().optional(),
    descripcionCorta: textoOpcional(160, "El resumen admite hasta 160 caracteres"),
    descripcion: textoOpcional(4000, "La descripción es demasiado larga"),
    etiqueta: textoOpcional(20, "La insignia admite hasta 20 caracteres"),
    envioGratis: z.boolean().default(false),
    destacado: z.boolean().default(false),
    activo: z.boolean().default(true),
  })
  .refine((p) => p.precioLista == null || p.precioLista > p.precio, {
    message: "El precio anterior tiene que ser mayor que el precio actual",
    path: ["precioLista"],
  });

export const esquemaEdicionProducto = z.object({
  productoId: z.string().min(1),
  datos: esquemaProducto,
});

/** Variante nueva. El SKU lo arma `skuDeVariante`; el stock inicial entra
    como un INGRESO, nunca escrito directo en la columna. */
export const esquemaVarianteNueva = z.object({
  productoId: z.string().min(1),
  talla: z.string().trim().min(1, "Escribe la talla").max(12, "La talla es demasiado larga"),
  color: z.string().trim().min(1, "Escribe el color").max(40, "El color es demasiado largo"),
  stockInicial: z
    .number({ error: "Escribe el stock inicial" })
    .int("El stock tiene que ser un número entero")
    .min(0, "El stock no puede ser negativo")
    .max(100000),
});

export const esquemaCambioActivoVariante = z.object({
  varianteId: z.string().min(1),
  activo: z.boolean(),
});

/** Costo de una variante puesto a mano; `null` lo quita. Una compra lo vuelve a fijar. */
export const esquemaCostoVariante = z.object({
  varianteId: z.string().min(1),
  costo: z.number().min(0).max(99999999).nullable(),
});

const esquemaSlug = z
  .string()
  .trim()
  .min(2, "La dirección web es demasiado corta")
  .max(80, "La dirección web es demasiado larga")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

const esquemaOrden = z.number().int("El orden es un número entero").min(0).max(9999);

const urlOpcional = z
  .string()
  .trim()
  .max(500)
  .refine(
    (u) => u === "" || u.startsWith("/") || u.startsWith("https://"),
    "Escribe una URL https://",
  )
  .optional();

/** Categoria. Sin `categoriaId` se crea una nueva. */
export const esquemaCategoria = z.object({
  categoriaId: z.string().min(1).optional(),
  nombre: z.string().trim().min(2, "Escribe el nombre").max(60, "El nombre es demasiado largo"),
  slug: esquemaSlug,
  padreId: z.string().min(1).nullable(),
  descripcion: textoOpcional(500, "La descripción es demasiado larga"),
  imagenUrl: urlOpcional,
  tituloSeo: textoOpcional(70, "El título SEO admite hasta 70 caracteres"),
  descripcionSeo: textoOpcional(160, "La descripción SEO admite hasta 160 caracteres"),
  orden: esquemaOrden,
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
});

/** Marca. Sin `marcaId` se crea una nueva. */
export const esquemaMarca = z.object({
  marcaId: z.string().min(1).optional(),
  nombre: z.string().trim().min(2, "Escribe el nombre").max(60, "El nombre es demasiado largo"),
  slug: esquemaSlug,
  descripcion: textoOpcional(500, "La descripción es demasiado larga"),
  logoUrl: urlOpcional,
  tituloSeo: textoOpcional(70, "El título SEO admite hasta 70 caracteres"),
  descripcionSeo: textoOpcional(160, "La descripción SEO admite hasta 160 caracteres"),
  orden: esquemaOrden,
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
});

/** Proveedor. Sin `proveedorId` se crea uno nuevo. */
export const esquemaProveedor = z.object({
  proveedorId: z.string().min(1).optional(),
  nombre: z.string().trim().min(2, "Escribe el nombre").max(80, "El nombre es demasiado largo"),
  ruc: z
    .string()
    .trim()
    .regex(/^(\d{11})?$/, "El RUC tiene 11 dígitos")
    .optional(),
  contacto: textoOpcional(80, "El contacto es demasiado largo"),
  telefono: z
    .string()
    .trim()
    .regex(/^(\d{6,15})?$/, "Solo números, entre 6 y 15 dígitos")
    .optional(),
  email: z.union([z.literal(""), z.email("Escribe un correo válido")]).optional(),
  nota: textoOpcional(300, "La nota es demasiado larga"),
  activo: z.boolean().default(true),
});

/** Ingreso de mercaderia. Lo demas lo revisa `revisarCompra`. */
export const esquemaCompra = z.object({
  proveedorId: z.string().min(1, "Elige el proveedor"),
  documento: textoOpcional(40, "El documento es demasiado largo"),
  nota: textoOpcional(200, "La nota es demasiado larga"),
  lineas: z
    .array(
      z.object({
        varianteId: z.string().min(1),
        cantidad: z.number().int("La cantidad es un número entero").min(1).max(100000),
        costoUnitario: z.number({ error: "Escribe el costo" }).min(0).max(99999),
      }),
    )
    .min(1, "Agrega al menos una prenda")
    .max(200),
});

export const esquemaIdProveedor = z.object({ proveedorId: z.string().min(1) });

/** Pack o combo. Sin `packId` se crea uno nuevo. Lo demas, `revisarPack`. */
export const esquemaPack = z.object({
  packId: z.string().min(1).optional(),
  nombre: z.string().trim().min(3, "Escribe el nombre").max(80, "El nombre es demasiado largo"),
  slug: esquemaSlug,
  descripcion: textoOpcional(500, "La descripción es demasiado larga"),
  precio: z
    .number({ error: "Escribe el precio" })
    .positive("El precio tiene que ser mayor que cero")
    .max(99999),
  activo: z.boolean().default(true),
  componentes: z
    .array(
      z.object({
        varianteId: z.string().min(1),
        cantidad: z.number().int().min(1).max(50),
      }),
    )
    .max(30),
});

// ── Stock (panel) ──────────────────────────────────────────────────────────

/** Ingreso, ajuste por conteo o merma. Lo demas lo revisa `planMovimientoManual`. */
export const esquemaMovimientoStock = z.object({
  varianteId: z.string().min(1),
  tipo: z.enum(TIPOS_MOVIMIENTO_MANUAL),
  cantidad: z
    .number({ error: "Escribe la cantidad" })
    .int("La cantidad tiene que ser un número entero")
    .min(0, "La cantidad no puede ser negativa")
    .max(100000),
  nota: z.string().trim().max(200, "La nota es demasiado larga").optional(),
});

export const esquemaIdVariante = z.object({
  varianteId: z.string().min(1),
});

// ── Compra ─────────────────────────────────────────────────────────────────

export const esquemaLineaCarrito = z.object({
  varianteId: z.string().min(1),
  cantidad: z.number().int().min(1).max(20),
});

export const esquemaCheckout = z.object({
  direccionId: z.string().min(1, "Elige una direccion"),
  metodoEnvioId: z.string().min(1, "Elige como recibir tu pedido"),
  // "tarjeta" solo llega cuando el entorno enciende la tarjeta de prueba; el
  // servidor revisa que la pasarela lo soporte.
  medioPago: z.enum(["yape", "plin", "transferencia", "tarjeta"]),
  // Tarjeta de prueba: la marca y los ultimos 4 digitos, nunca el numero entero.
  tarjetaMarca: z.enum(["visa", "mastercard"]).optional(),
  tarjetaUltimos: z
    .string()
    .regex(/^\d{4}$/, "Escribe los últimos 4 dígitos de la tarjeta")
    .optional(),
  // Se piden DESDE AHORA aunque la boleta electronica llegue despues: si no se
  // capturan al inicio, luego no hay forma de conseguirlos.
  comprobante: z.enum(["boleta", "factura"]).default("boleta"),
  documento: z
    .string()
    .trim()
    .min(8, "El documento debe tener 8 dígitos (DNI) u 11 (RUC)")
    .max(11, "El documento debe tener 8 dígitos (DNI) u 11 (RUC)"),
  razonSocial: z.string().trim().max(200).optional(),
  cupon: z.string().trim().max(30).optional(),
});

// ── Libro de Reclamaciones ─────────────────────────────────────────────────

/**
 * Hoja de reclamacion. Los campos son los que pide la norma: quien reclama,
 * sobre que bien, si es reclamo o queja, el detalle y lo que pide. Si es menor
 * de edad, la hoja va a nombre de su padre, madre o apoderado.
 */
export const esquemaReclamo = z
  .object({
    tipo: z.enum(TIPOS_RECLAMO, { error: "Elige reclamo o queja" }),
    nombre: z.string().trim().min(3, "Escribe tu nombre completo").max(120),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: "Elige el tipo de documento" }),
    numeroDocumento: z.string().trim(),
    domicilio: z.string().trim().min(5, "Escribe tu domicilio").max(200),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{6,15}$/, "Solo números, entre 6 y 15 dígitos"),
    email: z.email("Escribe un correo válido").toLowerCase(),
    menorDeEdad: z.boolean().default(false),
    apoderado: z.string().trim().max(120).optional(),
    tipoBien: z.enum(TIPOS_BIEN, { error: "Elige producto o servicio" }),
    pedidoCodigo: z.string().trim().max(30).optional(),
    monto: z
      .number({ error: "Escribe un monto válido" })
      .min(0, "El monto no puede ser negativo")
      .max(99999)
      .optional(),
    descripcionBien: z
      .string()
      .trim()
      .min(3, "Describe el producto o servicio")
      .max(300, "Máximo 300 caracteres"),
    detalle: z
      .string()
      .trim()
      .min(10, "Cuéntanos qué pasó (mínimo 10 caracteres)")
      .max(3000, "Máximo 3000 caracteres"),
    pedido: z
      .string()
      .trim()
      .min(5, "Escribe qué solución esperas")
      .max(1000, "Máximo 1000 caracteres"),
    acepta: z.literal(true, { error: "Confirma que los datos son correctos" }),
  })
  .superRefine((datos, contexto) => {
    const error = errorNumeroDocumento(datos.tipoDocumento, datos.numeroDocumento);
    if (error) contexto.addIssue({ code: "custom", path: ["numeroDocumento"], message: error });
    if (datos.menorDeEdad && (datos.apoderado ?? "").length < 3) {
      contexto.addIssue({
        code: "custom",
        path: ["apoderado"],
        message: "Escribe el nombre de tu padre, madre o apoderado",
      });
    }
  });

export const esquemaFiltroReclamos = z.object({
  /** Sin estado: todos. */
  estado: z.enum(ESTADOS_RECLAMO).optional(),
});

export const esquemaIdReclamo = z.object({
  reclamoId: z.string().min(1),
});

export const esquemaRespuestaReclamo = z.object({
  reclamoId: z.string().min(1),
  respuesta: z
    .string()
    .trim()
    .min(20, "Explica la respuesta y lo que se hizo (mínimo 20 caracteres)")
    .max(3000, "Máximo 3000 caracteres"),
});

/** Reseña que escribe el cliente desde su cuenta. El comentario es opcional. */
export const esquemaResena = z.object({
  productoId: z.string().min(1),
  estrellas: z
    .number({ error: "Elige de 1 a 5 estrellas" })
    .int()
    .min(MIN_ESTRELLAS, "Elige de 1 a 5 estrellas")
    .max(MAX_ESTRELLAS, "Elige de 1 a 5 estrellas"),
  comentario: z
    .string()
    .trim()
    .max(MAX_LETRAS_COMENTARIO, `Máximo ${MAX_LETRAS_COMENTARIO} caracteres`)
    .optional(),
});

export const esquemaFiltroResenas = z.object({
  /** Sin estado: todas. */
  estado: z.enum(ESTADOS_RESENA).optional(),
});

export const esquemaModeracionResena = z.object({
  resenaId: z.string().min(1),
  estado: z.enum(DECISIONES_RESENA),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosAutorregistro = z.infer<typeof esquemaAutorregistro>;
export type DatosIngreso = z.infer<typeof esquemaIngreso>;
export type DatosPerfil = z.infer<typeof esquemaPerfil>;
export type DatosUsuarioPanel = z.infer<typeof esquemaUsuarioPanel>;
export type DatosDireccion = z.infer<typeof esquemaDireccion>;
export type DatosProducto = z.infer<typeof esquemaProducto>;
export type DatosVarianteNueva = z.infer<typeof esquemaVarianteNueva>;
export type DatosMovimientoStock = z.infer<typeof esquemaMovimientoStock>;
export type DatosCheckout = z.infer<typeof esquemaCheckout>;
export type DatosReclamo = z.infer<typeof esquemaReclamo>;
export type DatosResena = z.infer<typeof esquemaResena>;
