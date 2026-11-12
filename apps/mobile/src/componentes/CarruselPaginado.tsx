import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Children, type ReactNode, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

/** Carrusel horizontal que ocupa una pagina completa por elemento. */
export function CarruselPaginado({ children }: { children: ReactNode }) {
  const [ancho, setAncho] = useState(0);
  const paginas = Children.toArray(children);

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onLayout={(evento) => {
          const nuevoAncho = evento.nativeEvent.layout.width;
          if (nuevoAncho !== ancho) setAncho(nuevoAncho);
        }}
      >
        {paginas.map((contenido, indice) => (
          <View key={indice} style={[estilos.pagina, ancho > 0 && { width: ancho }]}>
            {contenido}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    paddingHorizontal: t.espacio[1],
  },
});
