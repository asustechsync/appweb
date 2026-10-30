import { IconoEstrella, IconoEstrellaRellena } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, View } from "react-native";

const ESCALA = [1, 2, 3, 4, 5];

/** Cinco estrellas: rellenas hasta la nota redondeada, vacias el resto. */
export function Estrellas({ nota, tamano = 14 }: { nota: number; tamano?: number }) {
  const llenas = Math.round(nota);
  return (
    <View style={estilos.fila} accessibilityLabel={`${nota.toFixed(1)} de 5 estrellas`}>
      {ESCALA.map((n) =>
        n <= llenas ? (
          <IconoEstrellaRellena key={n} tamano={tamano} color={t.color.calificacion} />
        ) : (
          <IconoEstrella key={n} tamano={tamano} color={t.color.textoTenue} />
        ),
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    gap: 2,
  },
});
