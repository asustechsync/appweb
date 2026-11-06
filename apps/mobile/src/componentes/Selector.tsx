import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FilasDeCuatro } from "./FilasDeCuatro";

interface PropsSelector {
  titulo: string;
  opciones: string[];
  elegida: string | null;
  onElegir: (opcion: string) => void;
  /** Lo que se escribe en el chip, si no es la opcion tal cual ("Única" -> "U"). */
  texto?: (opcion: string) => string;
}

/** Fila de opciones (tallas o colores). La elegida va en negro; el resto, blanco con sombra. */
export function Selector({ titulo, opciones, elegida, onElegir, texto }: PropsSelector) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <View style={estilos.barra}>
        <FilasDeCuatro
          hijos={opciones.map((opcion) => {
            const activa = opcion === elegida;
            return (
              <Pressable
                key={opcion}
                accessibilityRole="button"
                accessibilityLabel={opcion}
                accessibilityState={{ selected: activa }}
                onPress={() => onElegir(opcion)}
                style={[estilos.opcion, activa && estilos.opcionActiva]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[estilos.texto, activa && estilos.textoActivo]}
                >
                  {texto ? texto(opcion) : opcion}
                </Text>
              </Pressable>
            );
          })}
        />
      </View>
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
  barra: {
    width: "100%",
  },
  opcion: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    borderRadius: t.radio.etiqueta,
    boxShadow: t.sombra.difusa,
    backgroundColor: t.color.fondoBloque,
  },
  opcionActiva: {
    backgroundColor: t.color.acentoMovil,
  },
  texto: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  textoActivo: {
    color: t.color.textoInverso,
  },
});
