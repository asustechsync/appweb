import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, View } from "react-native";

import { type ProductoDeTarjeta, TarjetaProducto } from "./TarjetaProducto";

interface PropsRejilla {
  productos: ProductoDeTarjeta[];
  onAbrir: (slug: string) => void;
}

/** Productos en dos columnas, con el mismo hueco entre filas y columnas. */
export function Rejilla({ productos, onAbrir }: PropsRejilla) {
  return (
    <View style={estilos.rejilla}>
      {productos.map((producto) => (
        <View key={producto.slug} style={estilos.celda}>
          <TarjetaProducto producto={producto} onAbrir={onAbrir} />
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  rejilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
  },
  celda: {
    width: "48%",
    flexGrow: 1,
    maxWidth: "50%",
  },
});
