import { IconoFlechaIzquierda } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BotonRedondo } from "./BotonRedondo";

interface PropsCabeceraPantalla {
  titulo: string;
  /** Sin el no hay boton de volver (pantallas de pestaña). */
  onVolver?: () => void;
  /** Lo que va a la derecha: carrito, filtros... */
  derecha?: ReactNode;
}

/** Cabecera de las pantallas: volver, titulo centrado y un hueco a la derecha. */
export function CabeceraPantalla({ titulo, onVolver, derecha }: PropsCabeceraPantalla) {
  return (
    <View style={estilos.cabecera}>
      {onVolver ? (
        <BotonRedondo etiqueta="Volver" onPress={onVolver}>
          <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
        </BotonRedondo>
      ) : (
        <View style={estilos.hueco} />
      )}
      <Text style={estilos.titulo} numberOfLines={1}>
        {titulo}
      </Text>
      {derecha ?? <View style={estilos.hueco} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
  },
  titulo: {
    flex: 1,
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
    textAlign: "center",
  },
  hueco: {
    width: t.espacio[12],
  },
});
