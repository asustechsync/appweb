import type { BannerDePortada } from "@appweb/core";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const MARGEN = t.espacio[4];

/** Promociones del panel en tarjetas claras y sobrias que se deslizan. */
export function CarruselBanners({ banners }: { banners: BannerDePortada[] }) {
  const { width } = useWindowDimensions();
  const ancho = width - MARGEN * 2;

  if (banners.length === 0) return null;

  return (
    <FlatList
      data={banners}
      horizontal
      pagingEnabled
      snapToInterval={ancho + t.espacio[3]}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.pista}
      keyExtractor={(banner) => `${banner.href}-${banner.titulo}`}
      renderItem={({ item }) => (
        <View style={[estilos.banner, { width: ancho }]}>
          <View style={estilos.textos}>
            <Text style={estilos.titulo} numberOfLines={2}>
              {item.titulo}
            </Text>
            <Text style={estilos.detalle} numberOfLines={1}>
              {item.detalle}
            </Text>
          </View>
          <Pressable accessibilityRole="button" style={estilos.accion}>
            <Text style={estilos.textoAccion}>{item.accion}</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  pista: {
    gap: t.espacio[3],
    paddingHorizontal: MARGEN,
  },
  banner: {
    alignItems: "flex-start",
    gap: t.espacio[4],
    paddingVertical: t.espacio[6],
    paddingHorizontal: t.espacio[5],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.lg,
  },
  textos: {
    gap: 2,
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
    lineHeight: t.tipo.tamano.lg * t.tipo.altura.apretada,
  },
  detalle: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  accion: {
    paddingVertical: t.espacio[2],
    paddingHorizontal: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.texto,
  },
  textoAccion: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "600",
  },
});
