import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsCantidad {
  valor: number;
  minimo?: number;
  maximo: number;
  onCambiar: (valor: number) => void;
}

/** Contador "− 1 +" en una caja blanca de esquinas suaves. Los extremos se apagan al llegar al limite. */
export function Cantidad({ valor, minimo = 1, maximo, onCambiar }: PropsCantidad) {
  return (
    <View style={estilos.caja}>
      <Boton
        signo="−"
        etiqueta="Quitar uno"
        apagado={valor <= minimo}
        onPress={() => onCambiar(valor - 1)}
      />
      <Text style={estilos.valor}>{valor}</Text>
      <Boton
        signo="+"
        etiqueta="Añadir uno"
        apagado={valor >= maximo}
        onPress={() => onCambiar(valor + 1)}
      />
    </View>
  );
}

interface PropsBoton {
  signo: string;
  etiqueta: string;
  apagado: boolean;
  onPress: () => void;
}

function Boton({ signo, etiqueta, apagado, onPress }: PropsBoton) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      disabled={apagado}
      onPress={onPress}
      style={[estilos.boton, apagado && estilos.apagado]}
    >
      <Text style={estilos.signo}>{signo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
    padding: t.espacio[1],
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoBloque,
  },
  boton: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.etiqueta,
    backgroundColor: t.color.fondoControl,
  },
  apagado: {
    opacity: 0.4,
  },
  signo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  valor: {
    minWidth: t.espacio[8],
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontFamily: FUENTE_NATIVA.texto[600],
    textAlign: "center",
  },
});
