import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const POR_FILA = 4;

interface PropsFilasDeCuatro {
  hijos: ReactNode[];
}

/**
 * Reparte los hijos en filas de cuatro, todos del mismo ancho. La ultima fila
 * se completa con huecos para que sus celdas midan igual que las de arriba.
 */
export function FilasDeCuatro({ hijos }: PropsFilasDeCuatro) {
  const filas: ReactNode[][] = [];
  for (let i = 0; i < hijos.length; i += POR_FILA) filas.push(hijos.slice(i, i + POR_FILA));

  return (
    <View style={estilos.bloque}>
      {filas.map((fila, indice) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: las filas se derivan del orden.
        <View key={indice} style={estilos.fila}>
          {Array.from({ length: POR_FILA }, (_, i) => (
            <View key={i} style={estilos.celda}>
              {fila[i] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: t.espacio[1],
  },
  fila: {
    flexDirection: "row",
    gap: t.espacio[1],
  },
  // Cuadro de tamano fijo y juntos: no se reparten el ancho de la columna.
  celda: {
    width: t.espacio[8],
  },
});
