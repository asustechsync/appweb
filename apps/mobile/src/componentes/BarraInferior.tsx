import {
  IconoCarrito,
  IconoCatalogo,
  IconoFavorito,
  IconoInicio,
  IconoUsuario,
  type PropsIconoNativo,
} from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCarrito } from "../estado-carrito";

export type Pestana = "inicio" | "catalogo" | "favoritos" | "cuenta";

interface PropsBarraInferior {
  actual: Pestana;
  onCambiar: (pestana: Pestana) => void;
  onCarrito: () => void;
}

/**
 * Barra de navegacion pegada al borde inferior, con las esquinas de arriba
 * redondeadas: cinco iconos sin texto. La pestaña activa va dentro de un
 * fondo cuadrado de color suave. El carrito va al centro, siempre a un toque y con
 * su globo de unidades; abre una pantalla encima, no es una pestaña.
 */
export function BarraInferior({ actual, onCambiar, onCarrito }: PropsBarraInferior) {
  const margenes = useSafeAreaInsets();
  // El globo sobre la bolsa: unidades en el carrito.
  const { unidades } = useCarrito();
  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(margenes.bottom, t.espacio[3]) }]}>
      <Icono
        etiqueta="Inicio"
        Icono={IconoInicio}
        activo={actual === "inicio"}
        onPress={() => onCambiar("inicio")}
      />
      <Icono
        etiqueta="Catálogo"
        Icono={IconoCatalogo}
        activo={actual === "catalogo"}
        onPress={() => onCambiar("catalogo")}
      />
      <Icono etiqueta="Carrito" Icono={IconoCarrito} contador={unidades} onPress={onCarrito} />
      <Icono
        etiqueta="Favoritos"
        Icono={IconoFavorito}
        activo={actual === "favoritos"}
        onPress={() => onCambiar("favoritos")}
      />
      <Icono
        etiqueta="Cuenta"
        Icono={IconoUsuario}
        activo={actual === "cuenta"}
        onPress={() => onCambiar("cuenta")}
      />
    </View>
  );
}

interface PropsIcono {
  etiqueta: string;
  Icono: ComponentType<PropsIconoNativo>;
  activo?: boolean;
  contador?: number;
  onPress: () => void;
}

function Icono({ etiqueta, Icono: Dibujo, activo = false, contador, onPress }: PropsIcono) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={estilos.boton}
    >
      <View style={estilos.celda}>
        {activo ? <View style={estilos.fondoActivo} /> : null}
        <Dibujo tamano={22} color={activo ? t.color.texto : t.color.textoSuave} />
        {contador ? (
          <View style={estilos.globo}>
            <Text style={estilos.numero}>{contador}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: t.espacio[3],
    paddingHorizontal: t.espacio[3],
    borderTopLeftRadius: t.radio.xl,
    borderTopRightRadius: t.radio.xl,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.lg,
  },
  boton: {
    flex: 1,
    alignItems: "center",
  },
  celda: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
  },
  // Gris claro de los controles (#EFF1F3): el de los selectores y campos del panel.
  fondoActivo: {
    ...StyleSheet.absoluteFill,
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoControl,
  },
  globo: {
    position: "absolute",
    top: t.espacio[1],
    right: 0,
    minWidth: t.espacio[4],
    height: t.espacio[4],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: t.radio.completo,
    backgroundColor: t.color.oferta,
  },
  numero: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
  },
});
