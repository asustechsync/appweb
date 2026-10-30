import { ESTADOS_PEDIDO, ETIQUETAS, tonoDeEstado } from "@appweb/core/estados-pedido";
import { FECHA_HORA, MONEDA } from "@appweb/core/formato";
import { ETIQUETAS_MEDIO_PAGO } from "@appweb/core/gestion-pedidos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "../api";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { Etiqueta } from "../componentes/Etiqueta";

type Lista = Awaited<ReturnType<typeof api.panel.pedidos.listar.query>>;
type Estado = (typeof ESTADOS_PEDIDO)[number];

interface PropsPedidosPanel {
  onVolver: () => void;
  onAbrir: (pedidoId: string) => void;
}

/** Pedidos de la tienda con una pestaña por estado y su conteo. Abre en los que esperan pago. */
export function PedidosPanel({ onVolver, onAbrir }: PropsPedidosPanel) {
  const [estado, setEstado] = useState<Estado>("PENDIENTE_PAGO");
  const [lista, setLista] = useState<Lista | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `recargas` fuerza recargar
  useEffect(() => {
    let vigente = true;
    api.panel.pedidos.listar
      .query({ estados: [estado] })
      .then((datos) => {
        if (vigente) {
          setLista(datos);
          setFallo(null);
        }
      })
      .catch((e: unknown) => {
        if (vigente) setFallo(e instanceof Error ? e.message : String(e));
      });
    return () => {
      vigente = false;
    };
  }, [estado, recargas]);

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Pedidos" onVolver={onVolver} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.pestanas}
        style={estilos.franja}
      >
        {ESTADOS_PEDIDO.map((valor) => (
          <Pressable
            key={valor}
            accessibilityRole="button"
            accessibilityState={{ selected: valor === estado }}
            onPress={() => setEstado(valor)}
            style={[estilos.pestana, valor === estado && estilos.pestanaActiva]}
          >
            <Text style={[estilos.textoPestana, valor === estado && estilos.textoActivo]}>
              {ETIQUETAS[valor]}
              {lista ? ` · ${lista.porEstado[valor]}` : ""}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : !lista ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : lista.pedidos.length === 0 ? (
        <Text style={[estilos.suave, estilos.centro]}>No hay pedidos en este estado.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => setRecargas((n) => n + 1)} />
          }
        >
          {lista.pedidos.map((pedido) => (
            <Pressable
              key={pedido.id}
              accessibilityRole="button"
              onPress={() => onAbrir(pedido.id)}
              style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}
            >
              <View style={estilos.filaSuperior}>
                <Text style={estilos.codigo}>N.º {pedido.codigo}</Text>
                <Text style={estilos.total}>{MONEDA.format(pedido.total)}</Text>
              </View>
              <Text style={estilos.suaveIzq} numberOfLines={1}>
                {pedido.cliente} · {pedido.unidades} {pedido.unidades === 1 ? "unidad" : "unidades"}{" "}
                · {ETIQUETAS_MEDIO_PAGO[pedido.medioPago]}
              </Text>
              <View style={estilos.filaSuperior}>
                <View style={estilos.etiquetas}>
                  <Etiqueta texto={ETIQUETAS[pedido.estado]} tono={tonoDeEstado(pedido.estado)} />
                  {pedido.porConfirmar ? <Etiqueta texto="Por confirmar" tono="alerta" /> : null}
                </View>
                <Text style={estilos.fecha}>{FECHA_HORA.format(new Date(pedido.creadoEn))}</Text>
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
    alignSelf: "center",
    padding: t.espacio[6],
  },
  franja: {
    flexGrow: 0,
  },
  pestanas: {
    gap: t.espacio[2],
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
  },
  pestana: {
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  pestanaActiva: {
    backgroundColor: t.color.marca[500],
  },
  textoPestana: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  textoActivo: {
    color: t.color.textoInverso,
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
    gap: t.espacio[2],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  presionado: {
    transform: [{ scale: 0.98 }],
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[2],
  },
  etiquetas: {
    flexDirection: "row",
    gap: t.espacio[1],
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
