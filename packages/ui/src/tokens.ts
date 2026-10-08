// ═══════════════════════════════════════════════════════════════════════════
//  FUENTE UNICA DE VERDAD DEL SISTEMA VISUAL
//
//  Este archivo controla la identidad completa: web, panel y app movil.
//  Cambias un valor aqui y cambia en los tres.
//
//  Regla que lo sostiene:
//    Ninguna pagina define color, espaciado, tipografia, radio ni sombra.
//    Las paginas SOLO componen primitivos.
//
//    ¿Falta un color?  -> se añade aqui.
//    ¿Falta un estilo? -> primitivo nuevo en src/componentes/.
//
//  Al guardar hay que regenerar las salidas:
//      npm run ui:tokens
//
//  Genera:
//      src/theme.css         -> :root { --color-marca-500: ... }   (web, panel)
//      src/tokens.native.ts  -> { colorMarca500: '...' }           (movil)
// ═══════════════════════════════════════════════════════════════════════════

export const tokens = {
  color: {
    // Verde original del simbolo de la marca.
    logo: "#6F8463",
    marca: {
      50: "#F6F6F7",
      100: "#EEEEEF",
      200: "#D8D8DA",
      300: "#AAAAB0",
      400: "#6B6B70",
      500: "#171717",
      600: "#141414",
      700: "#101010",
      800: "#0C0C0C",
      900: "#080808",
    },
    neutro: {
      0: "#FFFFFF",
      25: "#F7F7F7",
      50: "#F6F6F7",
      100: "#F2F2F2",
      200: "#E3E3E6",
      300: "#D4D4D8",
      400: "#A1A1AA",
      500: "#6B6B70",
      600: "#52525B",
      700: "#3F3F46",
      800: "#1C1C1F",
      900: "#171717",
    },

    // Estado, no marca. Nunca como color decorativo.
    exito: "#17803D",
    exitoClaro: "#62B846",
    alerta: "#B54708",
    error: "#D92D20",
    info: "#2F7DB8",

    // De negocio: su significado no cambia aunque cambie la marca.
    oferta: "#E63945",
    agotado: "#B92A1F",
    favorito: "#EF7A1E",
    calificacion: "#F2A93B",
    envioGratis: "#0F9D70",
    // Mismas etiquetas pastel en otras tonalidades: ambar y menta.
    tendenciaFondo: "#FDEBD6",
    tendenciaTexto: "#B4540A",
    // Oferta en rosa y nuevo en celeste.
    ofertaFondo: "#FCE1E4",
    ofertaTexto: "#B42336",
    nuevoFondo: "#D9EEF9",
    nuevoTexto: "#0B6A94",
    // Disponible en menta: el estado normal, que no debe llamar la atencion.
    disponibleFondo: "#D8F3E5",
    disponibleTexto: "#17704A",
    // Degradado pastel detras del producto en la tarjeta de ofertas: de arriba a abajo.
    fondoImagen: "#DEE9FA",
    fondoImagenFin: "#FFFFFF",

    // Roles de superficie: son los que usan los componentes.
    // Invertido a proposito: el fondo de la pagina es blanco y los bloques
    // (tarjetas, cabecera, carrusel...) llevan el gris que antes era el
    // fondo. fondoSutil baja un poco para seguir distinguiendose encima de
    // superficie, que ya no es blanco puro.
    fondo: "#FFFFFF",
    fondoSutil: "#ECECED",
    // Fondo de la portada: gris con un toque azulado.
    fondoPortada: "#F1F5F9",
    // Escena de la portada: cielo que se funde con el fondo, y vidrio encima.
    escenaInicio: "#D4D6D9",
    escenaFin: "#EFF0F2",
    vidrio: "rgb(62 66 72 / 0.5)",
    vidrioBorde: "rgb(255 255 255 / 0.24)",
    textoVidrio: "#FFFFFF",
    // Acento: verde pistacho pastel junto al plomo. `acento` es superficie (botones,
    // con `acentoTexto` encima); `acentoFuerte` es la version con cuerpo para
    // trazos finos sobre fondo claro: puntos activos, barras.
    acento: "#E2F2B8",
    acentoTexto: "#3F5A12",
    acentoFuerte: "#9DC24A",
    // Capsulas de la cabecera (tema, carrito, cuenta).
    fondoCapsula: "#FFFFFF",
    // Paneles de la portada: blanco translucido, toma el tono del cielo de detras.
    fondoPanel: "rgb(255 255 255 / 0.55)",
    // Banda superior de la portada (texto en textoVidrio) y su tarjeta oscura.
    bandaInicio: "#3F444B",
    bandaFin: "#8C929A",
    fondoDestacado: "#1D1F21",
    // Botones de icono: un paso mas oscuro que el fondo de la web.
    fondoBoton: "#D3D3D3",
    superficie: "#F6F6F7",
    borde: "#E3E3E6",
    bordeFuerte: "#D4D4D8",
    texto: "#171717",
    textoSuave: "#52525B",
    textoTarjeta: "#505050",
    textoMarca: "#A6A6A6",
    textoTenue: "#6B6B70",
    textoLogo: "#5E5E5E",
    textoInverso: "#FFFFFF",
  },

  // Escala de 4 px: padding, margin y gap.
  espacio: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
    8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
  },

  radio: {
    ninguno: 0, sm: 4, md: 8, lg: 12, bloque: 10, xl: 18, completo: 9999,
  },

  tipo: {
    familia: {
      base: "'Bai Jamjuree', system-ui, -apple-system, 'Segoe UI', sans-serif",
      numeros: "'Urbanist', system-ui, -apple-system, sans-serif",
      acceso: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
      mono: "'IBM Plex Mono', ui-monospace, Consolas, monospace",
    },
    tamano: {
      etiqueta: 11, xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
      "2xl": 24, "3xl": 30, "4xl": 38, "5xl": 48,
    },
    // La web solo carga 400, 500 y 600 (ver apps/web/src/app/layout.tsx).
    // `ligero` y `negrita` siguen aqui para la app movil, que carga sus
    // propias fuentes; en la web caerian al peso cargado mas cercano sin
    // avisar, asi que antes de usarlos hay que añadir el peso a next/font.
    peso: { ligero: 300, normal: 400, medio: 500, fuerte: 600, negrita: 700 },
    altura: { apretada: 1.2, normal: 1.5, suelta: 1.7 },
  },

  sombra: {
    ninguna: "none",
    sm: "0 1px 2px rgb(24 24 27 / 0.04)",
    md: "0 2px 10px rgb(24 24 27 / 0.06)",
    lg: "0 10px 30px -8px rgb(24 24 27 / 0.10)",
    // Halo amplio y muy tenue, sin borde: la tarjeta flota sobre el fondo.
    // Una capa corta da el contacto; otra larga reparte la niebla alrededor.
    difusa: "0 0 2px rgb(24 24 27 / 0.008), 0 10px 56px -10px rgb(24 24 27 / 0.03)",
  },

  // Tokens de control: los heredan campo, selector y buscador a la vez.
  control: {
    alto: 40,
    altoSm: 32,
    paddingX: 12,
  },

  contenedor: { sm: 640, md: 768, lg: 1024, xl: 1280, ancho: 1240 },

  // Monitores grandes: el ancho maximo crece escalonado desde un quiebre, mas
  // despacio que la pantalla. Debajo de FHD se queda en `ancho` (1240).
  contenedorAmplio: {
    "3xl": 1520, // FHD al 100%
    "4xl": 1740, // 2K al 100%
    "5xl": 2100, // 4K al 100%
  },

  // FIRST MOBILE: la base es movil y estos solo añaden desde arriba.
  // Son px CSS, no fisicos: un monitor escalado reporta resolucion / escala.
  // CSS no acepta var() en @media: se escriben en rem (valor / 16) y
  // `npm run ui:quiebres` falla si algun @media se sale de esta escala.
  quiebre: {
    xs: 480, //    movil grande, movil horizontal
    sm: 640, //    phablet
    md: 768, //    tablet vertical
    lg: 1024, //   tablet horizontal, laptop 11-13"
    xl: 1280, //   laptop HD
    "2xl": 1536, // FHD al 125% (laptop Windows tipica)
    "3xl": 1920, // FHD al 100%, 2K al 133%, 4K al 200%
    "4xl": 2560, // 2K al 100%
    "5xl": 3840, // 4K al 100%
  },

  transicion: {
    rapida: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    lenta: "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  z: {
    base: 0, cabecera: 100, desplegable: 200,
    superposicion: 300, modal: 400, aviso: 500,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
//  Tema oscuro — redefine solo los roles semanticos.
// ═══════════════════════════════════════════════════════════════════════════

export const tokensOscuro = {
  color: {
    marca: {
      50: "#1C1C1F", 100: "#242428", 200: "#303035", 300: "#52525B",
      400: "#A1A1AA", 500: "#F2F2F2", 600: "#DEDEDE", 700: "#F7F7F7",
      800: "#FAFAFA", 900: "#FFFFFF",
    },
    fondo: "#121212",
    fondoSutil: "#1C1C1F",
    superficie: "#1E1E22",
    borde: "#303035",
    bordeFuerte: "#414148",
    texto: "#F2F2F2",
    textoSuave: "#A1A1AA",
    textoTarjeta: "#D4D4D8",
    textoMarca: "#A1A1AA",
    textoTenue: "#73737D",
    textoLogo: "#8A8D91",
    textoInverso: "#171717",

    oferta: "#F07C81",
    agotado: "#6B6B74",
    favorito: "#F79544",
    tendenciaFondo: "#4A3320",
    tendenciaTexto: "#F7B77A",
    ofertaFondo: "#4D2229",
    ofertaTexto: "#F5A3AD",
    nuevoFondo: "#1D3B4C",
    nuevoTexto: "#86CDEE",
    disponibleFondo: "#1E3D30",
    disponibleTexto: "#7ED9A6",
    fondoImagen: "#27272A",
    fondoPortada: "#121212",
    escenaInicio: "#26282B",
    escenaFin: "#151617",
    vidrio: "rgb(255 255 255 / 0.08)",
    vidrioBorde: "rgb(255 255 255 / 0.14)",
    textoVidrio: "#F2F2F2",
    acento: "#E2F2B8",
    acentoTexto: "#3F5A12",
    acentoFuerte: "#B6D96B",
    fondoCapsula: "#1E1E22",
    fondoPanel: "rgb(255 255 255 / 0.06)",
    bandaInicio: "#2E3135",
    bandaFin: "#1A1C1E",
    fondoDestacado: "#0D0E0F",
    fondoBoton: "#2A2A2F",
    fondoImagenFin: "#1F1F22",
    calificacion: "#F4BB5C",

    exito: "#3ED68C",
    exitoClaro: "#8FE388",
    alerta: "#EAB143",
    error: "#F07C81",
    info: "#4FA6E0",
  },
  sombra: {
    ninguna: "none",
    sm: "0 1px 2px rgb(0 0 0 / 0.4)",
    md: "0 2px 10px rgb(0 0 0 / 0.5)",
    lg: "0 12px 34px -8px rgb(0 0 0 / 0.65)",
    difusa: "0 2px 8px rgb(0 0 0 / 0.3), 0 16px 48px -4px rgb(0 0 0 / 0.5)",
  },
} as const;

export type Tokens = typeof tokens;
