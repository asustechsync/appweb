import { MAX_POR_LINEA } from "@appweb/core/carrito";
import { FECHA, MONEDA } from "@appweb/core/formato";
import {
  IconoEstrellaRellena,
  IconoFavorito,
  IconoFlechaIzquierda,
  IconoWhatsAppLinea,
} from "@appweb/ui/iconos.nativos";
import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "./api";
import { useCarrito } from "./estado-carrito";
import { useFavoritos } from "./estado-favoritos";
import { Aparecer } from "./componentes/Aparecer";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { Cantidad } from "./componentes/Cantidad";
import { Estrellas } from "./componentes/Estrellas";
import { GaleriaFotos } from "./componentes/GaleriaFotos";
import { Selector } from "./componentes/Selector";
import { SelectorColor } from "./componentes/SelectorColor";

type Ficha = Awaited<ReturnType<typeof api.catalogo.ficha.query>>;

/** Cuantas reseñas se ven en la ficha; la nota cuenta todas. */
const RESENAS_VISIBLES = 3;

/** La talla unica se escribe "U" en el chip, como en el SKU; las demas, tal cual. */
function letraDeTalla(talla: string): string {
  return talla.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase() === "UNICA" ? "U" : talla;
}

interface PropsDetalleProducto {
  slug: string;
  onVolver: () => void;
  onCarrito: () => void;
  onMarca: (slug: string) => void;
}

/**
 * Ficha de producto: galeria, marca, nombre, nota, precio, talla y color con
 * stock, cantidad, descripcion y reseñas. Arriba, favorito; abajo,
 * fija, la barra con el total y el boton de agregar.
 */
export function DetalleProducto({ slug, onVolver, onCarrito, onMarca }: PropsDetalleProducto) {
  const margenes = useSafeAreaInsets();
  const carrito = useCarrito();
  const favoritos = useFavoritos();
  const favorito = favoritos.esFavorito(slug);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [talla, setTalla] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    api.catalogo.ficha
      .query({ slug })
      .then((datos) => {
        setFicha(datos);
        // Entra con la primera talla y su primer color ya elegidos.
        const primera = datos.opciones[0];
        if (primera) {
          setTalla(primera.talla);
          setColor(primera.colores[0]?.color ?? null);
        }
      })
      .catch((error: unknown) =>
        setFallo(error instanceof Error ? error.message : "No se pudo cargar el producto."),
      );
  }, [slug]);

  // Los colores dependen de la talla: solo los que tienen stock en ella.
  const colores = ficha?.opciones.find((o) => o.talla === talla)?.colores ?? [];

  function elegirTalla(nueva: string) {
    setTalla(nueva);
    // Se conserva el color si la nueva talla lo tiene; si no, el primero.
    const disponibles = ficha?.opciones.find((o) => o.talla === nueva)?.colores ?? [];
    const sigue = disponibles.some((c) => c.color === color);
    setColor(sigue ? color : (disponibles[0]?.color ?? null));
  }

  const variante = colores.find((c) => c.color === color) ?? null;

  function agregar() {
    if (!variante) {
      Alert.alert("Elige talla y color", "Así sabemos qué prenda enviarte.");
      return;
    }
    carrito.agregar(variante.varianteId, cantidad);
    Alert.alert("Agregado al carrito", `${ficha?.nombre ?? "Producto"} · ${talla} · ${color}`, [
      { text: "Seguir comprando", style: "cancel" },
      { text: "Ver carrito", onPress: onCarrito },
    ]);
  }

  // WhatsApp de la tienda con el mensaje que ya nombra la prenda, y la talla y
  // el color si estan elegidos: la duda llega con su contexto.
  async function consultar() {
    try {
      const { whatsapp } = await api.tienda.contacto.query({
        producto: { nombre: ficha?.nombre ?? slug, talla, color },
      });
      if (whatsapp) {
        await Linking.openURL(whatsapp);
        return;
      }
      Alert.alert("Escríbenos", "Pronto podrás chatear con la tienda desde aquí.");
    } catch {
      Alert.alert("Sin conexión", "No pudimos abrir el chat. Inténtalo de nuevo.");
    }
  }

  const cabecera = (
    <View style={estilos.cabecera}>
      {/* Centrado sobre toda la fila: a la derecha hay dos botones y a la izquierda uno.
          Va primero para quedar debajo de los botones y no taparles el toque. */}
      <Text style={estilos.tituloCabecera}>Detalle</Text>
      <BotonRedondo etiqueta="Volver" onPress={onVolver}>
        <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
      </BotonRedondo>
      <View style={estilos.accionesCabecera}>
        <BotonRedondo
          etiqueta={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          onPress={() => favoritos.alternar(slug)}
        >
          <IconoFavorito tamano={20} color={favorito ? t.color.ofertaTexto : t.color.texto} />
        </BotonRedondo>
      </View>
    </View>
  );

  if (fallo || !ficha) {
    return (
      <View style={estilos.pantalla}>
        {cabecera}
        <View style={estilos.centro}>
          {fallo ? (
            <Text style={estilos.suave}>{fallo}</Text>
          ) : (
            <ActivityIndicator color={t.color.texto} />
          )}
        </View>
      </View>
    );
  }

  // Cada bloque entra un poco despues del anterior; el contador salta los que no se muestran.
  let paso = 0;
  const orden = () => paso++;

  return (
    <View style={estilos.pantalla}>
      {cabecera}
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        <Aparecer orden={orden()} disparador={slug}>
          <GaleriaFotos imagenes={ficha.imagenes} />
        </Aparecer>

        <View style={estilos.cuerpo}>
          <Aparecer orden={orden()} disparador={slug} estilo={estilos.encabezado}>
            <View style={estilos.nombres}>
              <Text style={estilos.nombre}>{ficha.nombre}</Text>
              {/* Bajo el nombre: la marca y, a su lado, la calificacion (en 0 si aun no hay reseñas). */}
              <View style={estilos.nota}>
                {ficha.marca ? (
                  <>
                    <Pressable
                      accessibilityRole="link"
                      disabled={!ficha.marcaSlug}
                      onPress={() => ficha.marcaSlug && onMarca(ficha.marcaSlug)}
                      hitSlop={6}
                    >
                      <Text style={[estilos.marca, estilos.marcaMayusculas]}>{ficha.marca}</Text>
                    </Pressable>
                    <Text style={estilos.separador}>·</Text>
                  </>
                ) : null}
                <IconoEstrellaRellena
                  tamano={12}
                  color={ficha.calificacion ? t.color.calificacion : t.color.textoTenue}
                />
                <Text style={estilos.marca}>
                  {(ficha.calificacion?.promedio ?? 0).toFixed(1)} ({ficha.calificacion?.total ?? 0}
                  )
                </Text>
              </View>
            </View>
          </Aparecer>

          {/* Precio a la izquierda y cantidad a la derecha, en la misma linea. */}
          <Aparecer orden={orden()} disparador={slug} estilo={estilos.filaPrecio}>
            <View style={estilos.precios}>
              <View style={estilos.ofertaApilada}>
                {ficha.precioLista ? (
                  <Text style={estilos.precioLista}>{MONEDA.format(ficha.precioLista)}</Text>
                ) : null}
                <View style={estilos.precioYDescuento}>
                  <Text style={estilos.precio} numberOfLines={1} adjustsFontSizeToFit>
                    {MONEDA.format(ficha.precio)}
                  </Text>
                  {ficha.descuentoPct ? (
                    <Text style={estilos.descuento}>-{ficha.descuentoPct}%</Text>
                  ) : null}
                </View>
              </View>
            </View>
            <Cantidad valor={cantidad} maximo={MAX_POR_LINEA} onCambiar={setCantidad} />
          </Aparecer>

          {!ficha.disponible || ficha.stockBajo ? (
            <Aparecer orden={orden()} disparador={slug} estilo={estilos.pegado}>
              {!ficha.disponible ? (
                <Text style={estilos.agotado}>AGOTADO</Text>
              ) : (
                <Text style={estilos.pocas}>¡QUEDAN POCAS UNIDADES!</Text>
              )}
            </Aparecer>
          ) : null}

          {/* Talla y color en la misma fila, mitad y mitad del ancho. */}
          {ficha.opciones.length > 0 || colores.length > 0 ? (
            <Aparecer orden={orden()} disparador={slug} estilo={estilos.filaVariante}>
              {ficha.opciones.length > 0 ? (
                <View style={estilos.mitad}>
                  <Selector
                    titulo="Talla"
                    opciones={ficha.opciones.map((o) => o.talla)}
                    elegida={talla}
                    onElegir={elegirTalla}
                    texto={letraDeTalla}
                  />
                </View>
              ) : null}
              {colores.length > 0 ? (
                <View style={estilos.mitadColor}>
                  <SelectorColor
                    opciones={colores.map((c) => c.color)}
                    elegida={color}
                    onElegir={setColor}
                    muestras={ficha.muestras}
                  />
                </View>
              ) : null}
            </Aparecer>
          ) : null}

          <Aparecer orden={orden()} disparador={slug}>
            <Pressable
              accessibilityRole="button"
              onPress={consultar}
              style={({ pressed }) => [estilos.consulta, pressed && estilos.presionado]}
            >
              <View style={estilos.iconoConsulta}>
                <IconoWhatsAppLinea tamano={20} color={t.color.textoInverso} />
              </View>
              <View style={estilos.textoConsulta}>
                <Text style={estilos.tituloConsulta}>¿Dudas con la talla o el color?</Text>
                <Text style={estilos.suave}>Escríbenos por WhatsApp</Text>
              </View>
            </Pressable>
          </Aparecer>

          {ficha.descripcion ? (
            <Aparecer orden={orden()} disparador={slug} estilo={estilos.bloque}>
              <Text style={estilos.subtitulo}>Descripción</Text>
              <Text style={estilos.parrafo}>{ficha.descripcion}</Text>
            </Aparecer>
          ) : null}

          {ficha.resenas.length > 0 ? (
            <Aparecer orden={orden()} disparador={slug} estilo={estilos.bloque}>
              <Text style={estilos.subtitulo}>Reseñas</Text>
              {ficha.resenas.slice(0, RESENAS_VISIBLES).map((resena) => (
                <View key={resena.id} style={estilos.resena}>
                  <View style={estilos.filaResena}>
                    <Text style={estilos.autor}>{resena.autor}</Text>
                    <Text style={estilos.fecha}>{FECHA.format(new Date(resena.fecha))}</Text>
                  </View>
                  <Estrellas nota={resena.estrellas} tamano={12} />
                  {resena.comentario ? (
                    <Text style={estilos.parrafo}>{resena.comentario}</Text>
                  ) : null}
                </View>
              ))}
            </Aparecer>
          ) : null}
        </View>
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: margenes.bottom + t.espacio[3] }]}>
        <View style={estilos.precioTotal}>
          {ficha.precioLista && ficha.descuentoPct ? (
            <Text style={estilos.listaTotal}>{MONEDA.format(ficha.precioLista * cantidad)}</Text>
          ) : (
            <Text style={estilos.etiquetaTotal}>Total</Text>
          )}
          <Text style={estilos.total} numberOfLines={1} adjustsFontSizeToFit>
            {MONEDA.format(ficha.precio * cantidad)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!ficha.disponible}
          onPress={agregar}
          style={({ pressed }) => [
            estilos.agregar,
            !ficha.disponible && estilos.agregarApagado,
            pressed && estilos.presionado,
          ]}
        >
          <Text style={[estilos.textoAgregar, !ficha.disponible && estilos.textoAgregarApagado]}>
            {ficha.disponible ? "Agregar" : "Agotado"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: t.espacio[6],
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
  },
  tituloCabecera: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    pointerEvents: "none",
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  accionesCabecera: {
    flexDirection: "row",
    gap: t.espacio[2],
  },
  contenido: {
    gap: t.espacio[5],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[32] + t.espacio[4],
  },
  cuerpo: {
    gap: t.espacio[5],
    paddingHorizontal: t.espacio[4],
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: t.espacio[3],
  },
  nombres: {
    flex: 1,
    gap: t.espacio[1],
  },
  marca: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontFamily: FUENTE_NATIVA.texto[600],
    lineHeight: t.tipo.tamano.xl * t.tipo.altura.apretada,
  },
  nota: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: t.espacio[1],
  },
  marcaMayusculas: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  separador: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  /** Pegado al bloque de arriba: la nota bajo el nombre, la etiqueta bajo el precio. */
  pegado: {
    marginTop: -t.espacio[3],
  },
  // Talla y color lado a lado.
  filaVariante: {
    flexDirection: "row",
    gap: t.espacio[4],
  },
  // minWidth 0: sin el, una fila larga de chips empuja a la otra mitad.
  // Mitad y mitad: cuatro tallas y cuatro colores, simetricos.
  mitad: {
    flex: 1,
    minWidth: 0,
  },
  mitadColor: {
    flex: 1,
    minWidth: 0,
  },
  filaPrecio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[3],
  },
  // Alto de los botones de icono: el precio queda centrado en esa altura.
  precios: {
    flex: 1,
    height: t.espacio[12],
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  // Precio anterior pequeno arriba y, debajo, el precio con el descuento a su lado.
  ofertaApilada: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  precioYDescuento: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  precio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  precioLista: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
    textDecorationLine: "line-through",
  },
  descuento: {
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  agotado: {
    alignSelf: "flex-start",
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.fondoSutil,
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  pocas: {
    alignSelf: "flex-start",
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.tendenciaFondo,
    color: t.color.tendenciaTexto,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  consulta: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.difusa,
  },
  iconoConsulta: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.whatsapp,
  },
  textoConsulta: {
    flex: 1,
  },
  tituloConsulta: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  bloque: {
    gap: t.espacio[2],
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  parrafo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
    lineHeight: t.tipo.tamano.sm * t.tipo.altura.normal,
  },
  resena: {
    gap: t.espacio[1],
    padding: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.difusa,
  },
  filaResena: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  autor: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  fecha: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  // Hoja anclada al borde de abajo. Con la app de borde a borde, la barra de
  // navegacion de Android es transparente y deja ver este blanco: las dos se
  // funden. El margen inferior es el de la barra del sistema.
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    paddingTop: t.espacio[4],
    paddingHorizontal: t.espacio[5],
    borderTopLeftRadius: t.radio.xl,
    borderTopRightRadius: t.radio.xl,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.lg,
  },
  // Total y boton se reparten la barra por igual, cada uno centrado en su mitad.
  precioTotal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listaTotal: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
    textDecorationLine: "line-through",
  },
  etiquetaTotal: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  total: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  agregar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[2],
    height: t.espacio[12],
    paddingHorizontal: t.espacio[4],
    borderRadius: t.radio.md,
    backgroundColor: t.color.acentoMovil,
  },
  // Como BotonPrincipal apagado: gris solido y texto tenue.
  agregarApagado: {
    backgroundColor: t.color.fondoBoton,
  },
  textoAgregarApagado: {
    color: t.color.textoTenue,
  },
  presionado: {
    transform: [{ scale: 0.97 }],
  },
  textoAgregar: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
});
