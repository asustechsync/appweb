import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FilasDeCuatro } from "./FilasDeCuatro";

interface PropsSelectorColor {
  opciones: string[];
  elegida: string | null;
  onElegir: (color: string) => void;
  /** Hex de cada color por nombre. El que no tiene muestra se ve como palabra. */
  muestras: Record<string, string>;
}

/**
 * Colores como cuadros de su tono, con las esquinas de la app. El elegido lleva
 * un marco; su nombre no se escribe, solo lo lee el lector de pantalla. Cuatro
 * por fila, como las tallas.
 */
export function SelectorColor({ opciones, elegida, onElegir, muestras }: PropsSelectorColor) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.titulo}>Color</Text>
      <FilasDeCuatro
        hijos={opciones.map((opcion) => {
          const activa = opcion === elegida;
          const muestra = muestras[opcion];
          return (
            <Pressable
              key={opcion}
              accessibilityRole="button"
              accessibilityLabel={opcion}
              accessibilityState={{ selected: activa }}
              onPress={() => onElegir(opcion)}
              hitSlop={4}
              style={estilos.anillo}
            >
              {muestra ? (
                <View
                  style={[
                    estilos.circulo,
                    { backgroundColor: muestra },
                    activa && estilos.circuloActivo,
                  ]}
                />
              ) : (
                <Text style={[estilos.texto, activa && estilos.textoActivo]}>{opcion}</Text>
              )}
            </Pressable>
          );
        })}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: t.espacio[2],
  },
  titulo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  // Mismo tamano y forma que el chip de talla: el color llena toda la celda.
  anillo: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: t.sombra.difusa,
    borderRadius: t.radio.etiqueta,
  },
  circulo: {
    width: "100%",
    height: "100%",
    borderRadius: t.radio.etiqueta,
    // Borde tenue para que el blanco y los claros no se pierdan en el fondo.
    borderWidth: 1,
    borderColor: t.color.borde,
  },
  circuloActivo: {
    borderWidth: 2,
    borderColor: t.color.acentoMovil,
  },
  texto: {
    paddingHorizontal: t.espacio[2],
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  textoActivo: {
    fontFamily: FUENTE_NATIVA.texto[600],
  },
});
