import { MAX_POR_LINEA } from "@appweb/core/carrito";
import { FECHA, MONEDA } from "@appweb/core/formato";
import {
  IconoCarrito,
  IconoFavorito,
  IconoFlechaIzquierda,
  IconoWhatsAppLinea,
} from "@appweb/ui/iconos.nativos";
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
import { BotonRedondo } from "./componentes/BotonRedondo";
import { Cantidad } from "./componentes/Cantidad";
import { Estrellas } from "./componentes/Estrellas";
import { GaleriaFotos } from "./componentes/GaleriaFotos";
import { Selector } from "./componentes/Selector";

type Ficha = Awaited<ReturnType<typeof api.catalogo.ficha.query>>;

/** Cuantas reseñas se ven en la ficha; la nota cuenta todas. */
const RESENAS_VISIBLES = 3;

interface PropsDetalleProducto {
  slug: string;
  onVolver: () => void;
  onCarrito: () => void;
  onMarca: (slug: string) => void;
}

/**
 * Ficha de producto: galeria, marca, nombre, nota, precio, talla y color con
 * stock, cantidad, descripcion y reseñas. Abajo, fija, la barra con el total
 * y el boton de agregar.
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
        // Con una sola talla no hay nada que elegir.
        const unica = datos.opciones.length === 1 ? datos.opciones[0] : undefined;
        if (unica) {
          setTalla(unica.talla);
          setColor(unica.colores.length === 1 ? (unica.colores[0]?.color ?? null) : null);
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
    // Si en esa talla queda un solo color, ya va elegido.
    const disponibles = ficha?.opciones.find((o) => o.talla === nueva)?.colores ?? [];
    setColor(disponibles.length === 1 ? (disponibles[0]?.color ?? null) : null);
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
      <BotonRedondo etiqueta="Volver" onPress={onVolver}>
        <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
      </BotonRedondo>
      <Text style={estilos.tituloCabecera}>Detalle</Text>
      <BotonRedondo etiqueta="Carrito" contador={carrito.unidades} onPress={onCarrito}>
        <IconoCarrito tamano={22} color={t.color.texto} />
      </BotonRedondo>
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

  return (
    <View style={estilos.pantalla}>
      {cabecera}
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        <GaleriaFotos imagenes={ficha.imagenes} />

        <View style={estilos.cuerpo}>
          <View style={estilos.encabezado}>
            <View style={estilos.nombres}>
              {ficha.marca ? (
                <Pressable
                  accessibilityRole="link"
                  disabled={!ficha.marcaSlug}
                  onPress={() => ficha.marcaSlug && onMarca(ficha.marcaSlug)}
                  hitSlop={6}
                >
                  <Text style={estilos.marca}>{ficha.marca} ›</Text>
                </Pressable>
              ) : null}
              <Text style={estilos.nombre}>{ficha.nombre}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
              accessibilityState={{ selected: favorito }}
              onPress={() => favoritos.alternar(slug)}
              style={[estilos.favorito, favorito && estilos.favoritoActivo]}
            >
              <IconoFavorito tamano={20} color={favorito ? t.color.ofertaTexto : t.color.texto} />
            </Pressable>
          </View>

          {ficha.calificacion ? (
            <View style={estilos.nota}>
              <Estrellas nota={ficha.calificacion.promedio} />
              <Text style={estilos.suave}>
                {ficha.calificacion.promedio.toFixed(1)} · {ficha.calificacion.total}{" "}
                {ficha.calificacion.total === 1 ? "reseña" : "reseñas"}
              </Text>
            </View>
          ) : null}

          <View style={estilos.precios}>
            <Text style={estilos.precio}>{MONEDA.format(ficha.precio)}</Text>
            {ficha.precioLista ? (
              <Text style={estilos.precioLista}>{MONEDA.format(ficha.precioLista)}</Text>
            ) : null}
            {ficha.descuentoPct ? (
              <Text style={estilos.descuento}>-{ficha.descuentoPct}%</Text>
            ) : null}
          </View>

          {!ficha.disponible ? (
            <Text style={estilos.agotado}>AGOTADO</Text>
          ) : ficha.stockBajo ? (
            <Text style={estilos.pocas}>¡QUEDAN POCAS UNIDADES!</Text>
          ) : null}

          {ficha.opciones.length > 0 ? (
            <Selector
              titulo="Talla"
              opciones={ficha.opciones.map((o) => o.talla)}
              elegida={talla}
              onElegir={elegirTalla}
            />
          ) : null}

          {colores.length > 0 ? (
            <Selector
              titulo="Color"
              opciones={colores.map((c) => c.color)}
              elegida={color}
              onElegir={setColor}
            />
          ) : null}

          <View style={estilos.filaCantidad}>
            <Text style={estilos.subtitulo}>Cantidad</Text>
            <Cantidad valor={cantidad} maximo={MAX_POR_LINEA} onCambiar={setCantidad} />
          </View>

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

          {ficha.descripcion ? (
            <View style={estilos.bloque}>
              <Text style={estilos.subtitulo}>Descripción</Text>
              <Text style={estilos.parrafo}>{ficha.descripcion}</Text>
            </View>
          ) : null}

          {ficha.resenas.length > 0 ? (
            <View style={estilos.bloque}>
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
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[estilos.barra, { bottom: Math.max(margenes.bottom, t.espacio[3]) }]}>
        <View>
          <Text style={estilos.etiquetaTotal}>Precio total</Text>
          <Text style={estilos.total}>{MONEDA.format(ficha.precio * cantidad)}</Text>
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
          <IconoCarrito tamano={18} color={t.color.textoInverso} />
          <Text style={estilos.textoAgregar}>
            {ficha.disponible ? "Agregar al carrito" : "Agotado"}
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
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  contenido: {
    gap: t.espacio[5],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[32],
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
    fontWeight: "500",
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "600",
    lineHeight: t.tipo.tamano.xl * t.tipo.altura.apretada,
  },
  favorito: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  favoritoActivo: {
    backgroundColor: t.color.ofertaFondo,
  },
  nota: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
    marginTop: -t.espacio[3],
  },
  precios: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  precio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  precioLista: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.sm,
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
    fontWeight: "700",
  },
  agotado: {
    alignSelf: "flex-start",
    marginTop: -t.espacio[3],
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.fondoSutil,
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.etiqueta,
    fontWeight: "700",
  },
  pocas: {
    alignSelf: "flex-start",
    marginTop: -t.espacio[3],
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.tendenciaFondo,
    color: t.color.tendenciaTexto,
    fontSize: t.tipo.tamano.etiqueta,
    fontWeight: "700",
  },
  consulta: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  iconoConsulta: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.whatsapp,
  },
  textoConsulta: {
    flex: 1,
  },
  tituloConsulta: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  filaCantidad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bloque: {
    gap: t.espacio[2],
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
  },
  parrafo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    lineHeight: t.tipo.tamano.sm * t.tipo.altura.normal,
  },
  resena: {
    gap: t.espacio[1],
    padding: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
  },
  filaResena: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  autor: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  fecha: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  barra: {
    position: "absolute",
    left: t.espacio[4],
    right: t.espacio[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[3],
    paddingVertical: t.espacio[2],
    paddingLeft: t.espacio[5],
    paddingRight: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.lg,
  },
  etiquetaTotal: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  total: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
  },
  agregar: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
    height: t.espacio[12],
    paddingHorizontal: t.espacio[5],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.marca[500],
  },
  agregarApagado: {
    backgroundColor: t.color.textoTenue,
  },
  presionado: {
    transform: [{ scale: 0.97 }],
  },
  textoAgregar: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
});
