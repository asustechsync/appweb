import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useState } from "react";
import { FlatList, Image, StyleSheet, useWindowDimensions, View } from "react-native";

import { urlDeImagen } from "../api";

const MARGEN = t.espacio[4];

/** Fotos del producto que se deslizan de una en una, con sus puntos debajo. */
export function GaleriaFotos({ imagenes }: { imagenes: { url: string; alt: string }[] }) {
  const { width } = useWindowDimensions();
  const ancho = width - MARGEN * 2;
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return <View style={[estilos.foto, { width: ancho, marginHorizontal: MARGEN }]} />;
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={imagenes}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(imagen, i) => `${imagen.url}#${i}`}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: MARGEN }}>
            <View style={estilos.foto}>
              <Image
                source={{ uri: urlDeImagen(item.url) }}
                accessibilityLabel={item.alt}
                style={estilos.imagen}
              />
            </View>
          </View>
        )}
      />
      {imagenes.length > 1 ? (
        <View style={estilos.puntos}>
          {imagenes.map((imagen, i) => (
            <View
              key={`${imagen.url}#${i}`}
              style={[estilos.punto, i === actual && estilos.puntoActivo]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: t.espacio[3],
  },
  foto: {
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: t.radio.xl,
    backgroundColor: t.color.fondo,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  puntos: {
    flexDirection: "row",
    justifyContent: "center",
    gap: t.espacio[1],
  },
  punto: {
    width: t.espacio[2],
    height: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondoSutil,
  },
  puntoActivo: {
    width: t.espacio[5],
    backgroundColor: t.color.marca[500],
  },
});
