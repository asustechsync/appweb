import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsCantidad {
  valor: number;
  minimo?: number;
  maximo: number;
  onCambiar: (valor: number) => void;
}

/** Contador "− 1 +" en una pildora blanca. Los extremos se apagan al llegar al limite. */
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
    gap: t.espacio[1],
    padding: t.espacio[1],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  boton: {
    width: t.espacio[8],
    height: t.espacio[8],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondoControl,
  },
  apagado: {
    opacity: 0.4,
  },
  signo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "500",
  },
  valor: {
    minWidth: t.espacio[6],
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
    textAlign: "center",
  },
});
