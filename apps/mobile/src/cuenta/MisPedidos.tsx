import { ETIQUETAS, tonoDeEstado } from "@appweb/core/estados-pedido";
import { FECHA, MONEDA } from "@appweb/core/formato";
import { IconoPedidos } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api, urlDeImagen } from "../api";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { Etiqueta } from "../componentes/Etiqueta";

type Pedido = Awaited<ReturnType<typeof api.cuenta.pedidos.query>>[number];

interface PropsMisPedidos {
  onVolver: () => void;
  onAbrir: (codigo: string) => void;
}

/** Los pedidos del cliente, el mas reciente arriba, con su estado y total. */
export function MisPedidos({ onVolver, onAbrir }: PropsMisPedidos) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    api.cuenta.pedidos
      .query()
      .then(setPedidos)
      .catch((error: unknown) => setFallo(error instanceof Error ? error.message : String(error)));
  }, []);

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Mis pedidos" onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : pedidos === null ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : pedidos.length === 0 ? (
        <View style={estilos.centro}>
          <IconoPedidos tamano={32} color={t.color.textoSuave} />
          <Text style={estilos.titulo}>Aún no tienes pedidos</Text>
          <Text style={estilos.suave}>Cuando compres, los verás aquí con su estado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.lista} showsVerticalScrollIndicator={false}>
          {pedidos.map((pedido) => (
            <Pressable
              key={pedido.codigo}
              accessibilityRole="button"
              onPress={() => onAbrir(pedido.codigo)}
              style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
            >
              <View style={estilos.foto}>
                {pedido.imagen ? (
                  <Image source={{ uri: urlDeImagen(pedido.imagen) }} style={estilos.imagen} />
                ) : null}
              </View>
              <View style={estilos.datos}>
                <View style={estilos.filaSuperior}>
                  <Text style={estilos.codigo}>N.º {pedido.codigo}</Text>
                  <Text style={estilos.total}>{MONEDA.format(pedido.total)}</Text>
                </View>
                <Text style={estilos.suaveIzq} numberOfLines={1}>
                  {pedido.primerProducto ?? "Pedido"}
                  {pedido.lineas > 1 ? ` y ${pedido.lineas - 1} más` : ""}
                </Text>
                <View style={estilos.filaSuperior}>
                  <Etiqueta texto={ETIQUETAS[pedido.estado]} tono={tonoDeEstado(pedido.estado)} />
                  <Text style={estilos.fecha}>{FECHA.format(new Date(pedido.creadoEn))}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[2],
    padding: t.espacio[6],
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
  lista: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingBottom: t.espacio[16],
  },
  fila: {
    flexDirection: "row",
    gap: t.espacio[3],
    padding: t.espacio[2],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  presionada: {
    transform: [{ scale: 0.98 }],
  },
  foto: {
    width: t.espacio[20],
    height: t.espacio[20],
    overflow: "hidden",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoFoto,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  datos: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: t.espacio[1],
    paddingRight: t.espacio[1],
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[2],
  },
  codigo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  total: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "700",
  },
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  fecha: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
});
