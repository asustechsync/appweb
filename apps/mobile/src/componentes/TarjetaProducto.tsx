import { MONEDA } from "@appweb/core/formato";
import { IconoFavorito } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { urlDeImagen } from "../api";
import { useFavoritos } from "../estado-favoritos";

export interface ProductoDeTarjeta {
  slug: string;
  nombre: string;
  marca: string | null;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  disponible: boolean;
}

interface PropsTarjetaProducto {
  producto: ProductoDeTarjeta;
  /** Ancho fijo para las filas deslizables; sin el, ocupa su columna. */
  ancho?: number;
  onAbrir?: (slug: string) => void;
}

/** Tarjeta de producto: foto con descuento y favorito encima, marca, nombre y precio. */
export function TarjetaProducto({ producto, ancho, onAbrir }: PropsTarjetaProducto) {
  const favoritos = useFavoritos();
  const favorito = favoritos.esFavorito(producto.slug);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={producto.nombre}
      onPress={() => onAbrir?.(producto.slug)}
      style={({ pressed }) => [
        estilos.tarjeta,
        ancho ? { width: ancho } : estilos.columna,
        pressed && estilos.presionada,
      ]}
    >
      <View style={estilos.foto}>
        {producto.imagenUrl ? (
          <Image source={{ uri: urlDeImagen(producto.imagenUrl) }} style={estilos.imagen} />
        ) : null}
        {producto.descuentoPct ? (
          <Text style={estilos.descuento}>-{producto.descuentoPct}%</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          accessibilityState={{ selected: favorito }}
          hitSlop={6}
          onPress={() => favoritos.alternar(producto.slug)}
          style={[estilos.favorito, favorito && estilos.favoritoActivo]}
        >
          <IconoFavorito tamano={16} color={favorito ? t.color.ofertaTexto : t.color.texto} />
        </Pressable>
        {!producto.disponible ? <Text style={estilos.agotado}>AGOTADO</Text> : null}
      </View>
      <View style={estilos.datos}>
        {producto.marca ? <Text style={estilos.marca}>{producto.marca}</Text> : null}
        <Text style={estilos.nombre} numberOfLines={2}>
          {producto.nombre}
        </Text>
        <View style={estilos.precios}>
          <Text style={estilos.precio}>{MONEDA.format(producto.precio)}</Text>
          {producto.precioLista ? (
            <Text style={estilos.precioLista}>{MONEDA.format(producto.precioLista)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: t.espacio[2],
    padding: t.espacio[2],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  columna: {
    flex: 1,
  },
  presionada: {
    transform: [{ scale: 0.98 }],
  },
  foto: {
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoFoto,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  descuento: {
    position: "absolute",
    top: t.espacio[2],
    left: t.espacio[2],
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
  },
  favorito: {
    position: "absolute",
    top: t.espacio[2],
    right: t.espacio[2],
    width: t.espacio[8],
    height: t.espacio[8],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondo,
  },
  favoritoActivo: {
    backgroundColor: t.color.ofertaFondo,
  },
  agotado: {
    position: "absolute",
    bottom: t.espacio[2],
    left: t.espacio[2],
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.fondoSutil,
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
  },
  datos: {
    gap: 2,
    paddingHorizontal: t.espacio[1],
    paddingBottom: t.espacio[1],
  },
  marca: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.etiqueta,
    fontWeight: "500",
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
    lineHeight: t.tipo.tamano.sm * 1.3,
  },
  precios: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: t.espacio[2],
    marginTop: t.espacio[1],
  },
  precio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "700",
  },
  precioLista: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    textDecorationLine: "line-through",
  },
});
