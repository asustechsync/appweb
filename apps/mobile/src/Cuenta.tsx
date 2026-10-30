import { type IdNivel, textoQueFalta } from "@appweb/core/niveles";
import { MONEDA } from "@appweb/core/formato";
import {
  IconoCandado,
  IconoEscudo,
  IconoEstrella,
  IconoFlechaDerecha,
  IconoPedidos,
  IconoPerfil,
  IconoSalir,
  IconoUbicacion,
  type PropsIconoNativo,
} from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { type ComponentType, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Acceso } from "./Acceso";
import { api } from "./api";
import { useSesion } from "./estado-sesion";

type EstadoNivel = Awaited<ReturnType<typeof api.cuenta.nivel.query>>;

/** Las pantallas de la cuenta que se abren encima. */
export type PantallaCuenta = "pedidos" | "direcciones" | "datos" | "clave" | "resenas" | "panel";

/** El color de cada nivel sale de sus tokens, los mismos de la escalera del panel. */
const COLOR_NIVEL: Record<IdNivel, string> = {
  BASICO: t.color.nivelBasico,
  BRONCE: t.color.nivelBronce,
  PLATA: t.color.nivelPlata,
  ORO: t.color.nivelOro,
  PLATINO: t.color.nivelPlatino,
};

const MENU: { pantalla: PantallaCuenta; texto: string; Icono: ComponentType<PropsIconoNativo> }[] =
  [
    { pantalla: "pedidos", texto: "Mis pedidos", Icono: IconoPedidos },
    { pantalla: "resenas", texto: "Mis reseñas", Icono: IconoEstrella },
    { pantalla: "direcciones", texto: "Mis direcciones", Icono: IconoUbicacion },
    { pantalla: "datos", texto: "Mis datos", Icono: IconoPerfil },
    { pantalla: "clave", texto: "Contraseña", Icono: IconoCandado },
  ];

/**
 * Pestaña Cuenta. Sin sesion, el acceso. Con sesion: el saludo con el nivel y
 * su avance, el acceso al panel (solo ADMIN) y el menu de pedidos, reseñas,
 * direcciones, datos y contraseña.
 */
export function Cuenta({ onAbrir }: { onAbrir: (pantalla: PantallaCuenta) => void }) {
  const { sesion, cerrar } = useSesion();
  const [nivel, setNivel] = useState<EstadoNivel | null>(null);

  useEffect(() => {
    if (!sesion) {
      setNivel(null);
      return;
    }
    api.cuenta.nivel
      .query()
      .then(setNivel)
      .catch(() => setNivel(null));
  }, [sesion]);

  if (sesion === undefined) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={t.color.texto} />
      </View>
    );
  }

  if (sesion === null) return <Acceso />;

  function confirmarSalida() {
    Alert.alert("Cerrar sesión", "¿Quieres salir de tu cuenta en este celular?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: cerrar },
    ]);
  }

  const color = nivel ? COLOR_NIVEL[nivel.nivel.id] : t.color.acento;

  return (
    <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
      <View style={estilos.tarjeta}>
        <View style={estilos.filaTarjeta}>
          <View style={[estilos.avatar, { backgroundColor: color }]}>
            <Text style={estilos.inicial}>{sesion.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={estilos.datos}>
            <Text style={estilos.saludo}>Hola,</Text>
            <Text style={estilos.nombre}>{sesion.nombre}</Text>
          </View>
          {nivel ? (
            <Text style={[estilos.nivel, { backgroundColor: color }]}>
              {nivel.nivel.nombre.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {nivel ? (
          <View style={estilos.avance}>
            <View style={estilos.barra}>
              <View
                style={[
                  estilos.relleno,
                  { width: `${nivel.progresoPct}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={estilos.textoAvance}>
              {nivel.siguiente
                ? `Te falta ${textoQueFalta(nivel.siguiente)} para ${nivel.siguiente.nivel.nombre}`
                : "Estás en el nivel más alto"}
            </Text>
            <Text style={estilos.textoAvance}>
              {MONEDA.format(nivel.totalComprado)} en {nivel.pedidos}{" "}
              {nivel.pedidos === 1 ? "pedido" : "pedidos"}
              {nivel.nivel.descuentoPct > 0
                ? ` · ${nivel.nivel.descuentoPct}% de descuento en cada compra`
                : ""}
            </Text>
          </View>
        ) : null}
      </View>

      {sesion.rol === "ADMIN" ? (
        // Solo el administrador lo ve; el servidor comprueba el rol en cada consulta del panel.
        <Pressable
          accessibilityRole="button"
          onPress={() => onAbrir("panel")}
          style={({ pressed }) => [estilos.panel, pressed && estilos.presionada]}
        >
          <View style={estilos.iconoPanel}>
            <IconoEscudo tamano={20} color={t.color.acentoTexto} />
          </View>
          <View style={estilos.textoPanel}>
            <Text style={estilos.tituloPanel}>Panel de administración</Text>
            <Text style={estilos.detallePanel}>Ventas, pedidos, stock y reseñas</Text>
          </View>
          <IconoFlechaDerecha tamano={16} color={t.color.textoInverso} />
        </Pressable>
      ) : null}

      <View style={estilos.menu}>
        {MENU.map(({ pantalla, texto, Icono }, i) => (
          <Pressable
            key={pantalla}
            accessibilityRole="button"
            onPress={() => onAbrir(pantalla)}
            style={({ pressed }) => [
              estilos.fila,
              i > 0 && estilos.filaConLinea,
              pressed && estilos.presionada,
            ]}
          >
            <View style={estilos.iconoFila}>
              <Icono tamano={18} color={t.color.texto} />
            </View>
            <Text style={estilos.textoFila}>{texto}</Text>
            <IconoFlechaDerecha tamano={16} color={t.color.textoTenue} />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={confirmarSalida}
        style={({ pressed }) => [estilos.salir, pressed && estilos.presionada]}
      >
        <IconoSalir tamano={20} color={t.color.ofertaTexto} />
        <Text style={estilos.textoSalir}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contenido: {
    gap: t.espacio[4],
    padding: t.espacio[4],
    paddingTop: t.espacio[6],
    paddingBottom: t.espacio[8],
  },
  tarjeta: {
    gap: t.espacio[4],
    padding: t.espacio[5],
    borderRadius: t.radio.xl,
    backgroundColor: t.color.fondoDestacado,
  },
  filaTarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[4],
  },
  avatar: {
    width: t.espacio[16],
    height: t.espacio[16],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
  },
  inicial: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  datos: {
    flex: 1,
  },
  saludo: {
    color: t.color.textoInverso,
    opacity: 0.7,
    fontSize: t.tipo.tamano.sm,
  },
  nombre: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "600",
  },
  nivel: {
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  avance: {
    gap: t.espacio[1],
  },
  barra: {
    height: t.espacio[2],
    marginBottom: t.espacio[1],
    overflow: "hidden",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.velo,
  },
  relleno: {
    height: "100%",
    borderRadius: t.radio.completo,
  },
  textoAvance: {
    color: t.color.textoInverso,
    opacity: 0.8,
    fontSize: t.tipo.tamano.xs,
  },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoDestacado,
  },
  iconoPanel: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.md,
    backgroundColor: t.color.acento,
  },
  textoPanel: {
    flex: 1,
  },
  tituloPanel: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  detallePanel: {
    color: t.color.textoInverso,
    opacity: 0.7,
    fontSize: t.tipo.tamano.xs,
  },
  menu: {
    overflow: "hidden",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
  },
  filaConLinea: {
    borderTopWidth: 1,
    borderTopColor: t.color.borde,
  },
  presionada: {
    opacity: 0.7,
  },
  iconoFila: {
    width: t.espacio[8],
    height: t.espacio[8],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoControl,
  },
  textoFila: {
    flex: 1,
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  salir: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  textoSalir: {
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
});
