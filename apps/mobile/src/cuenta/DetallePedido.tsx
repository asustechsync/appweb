import { ETIQUETAS, pasosDelPedido, tonoDeEstado } from "@appweb/core/estados-pedido";
import { FECHA_HORA, MONEDA } from "@appweb/core/formato";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { Etiqueta } from "../componentes/Etiqueta";

type Pedido = Awaited<ReturnType<typeof api.cuenta.pedido.query>>;

interface PropsDetallePedido {
  codigo: string;
  onVolver: () => void;
}

/**
 * Un pedido propio: estado con sus pasos, lo que se compro (con el precio
 * congelado de ese dia), los totales y la direccion de envio.
 */
export function DetallePedido({ codigo, onVolver }: PropsDetallePedido) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    api.cuenta.pedido
      .query({ codigo })
      .then(setPedido)
      .catch((error: unknown) => setFallo(error instanceof Error ? error.message : String(error)));
  }, [codigo]);

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo={`N.º ${codigo}`} onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : pedido === null ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : (
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <View style={estilos.bloque}>
            <View style={estilos.fila}>
              <Etiqueta texto={ETIQUETAS[pedido.estado]} tono={tonoDeEstado(pedido.estado)} />
              <Text style={estilos.suave}>{FECHA_HORA.format(new Date(pedido.creadoEn))}</Text>
            </View>
            {pasosDelPedido(pedido.estado).map((paso) => (
              <View key={paso.estado} style={estilos.paso}>
                <View
                  style={[
                    estilos.punto,
                    paso.situacion === "hecho" && estilos.puntoHecho,
                    paso.situacion === "actual" && estilos.puntoActual,
                  ]}
                />
                <Text
                  style={[estilos.textoPaso, paso.situacion !== "pendiente" && estilos.pasoVivo]}
                >
                  {paso.etiqueta}
                </Text>
              </View>
            ))}
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Productos</Text>
            {pedido.items.map((item, i) => (
              <View
                key={`${item.nombreProducto}-${item.talla}-${item.color}-${i}`}
                style={estilos.fila}
              >
                <View style={estilos.item}>
                  <Text style={estilos.nombre}>{item.nombreProducto}</Text>
                  <Text style={estilos.suaveIzq}>
                    Talla {item.talla} · {item.color} · {item.cantidad} ×{" "}
                    {MONEDA.format(item.precioUnitario)}
                  </Text>
                </View>
                <Text style={estilos.cifra}>
                  {MONEDA.format(item.precioUnitario * item.cantidad)}
                </Text>
              </View>
            ))}
          </View>

          <View style={estilos.bloque}>
            <Linea texto="Subtotal" valor={MONEDA.format(pedido.subtotal)} />
            {pedido.descuento > 0 ? (
              <Linea texto="Descuento" valor={`−${MONEDA.format(pedido.descuento)}`} />
            ) : null}
            <Linea texto="Envío" valor={MONEDA.format(pedido.costoEnvio)} />
            <View style={estilos.separador} />
            <Linea texto="Total" valor={MONEDA.format(pedido.total)} fuerte />
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Envío</Text>
            <Text style={estilos.suaveIzq}>{pedido.envioMetodo}</Text>
            {pedido.envioCalle ? (
              <Text style={estilos.suaveIzq}>
                {pedido.envioCalle}, {pedido.envioDistrito}, {pedido.envioProvincia},{" "}
                {pedido.envioDepartamento}
              </Text>
            ) : null}
            {pedido.envioReferencia ? (
              <Text style={estilos.suaveIzq}>Ref.: {pedido.envioReferencia}</Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Linea({ texto, valor, fuerte }: { texto: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={estilos.fila}>
      <Text style={fuerte ? estilos.subtitulo : estilos.suaveIzq}>{texto}</Text>
      <Text style={fuerte ? estilos.total : estilos.cifra}>{valor}</Text>
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
  contenido: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingBottom: t.espacio[16],
  },
  bloque: {
    gap: t.espacio[2],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[3],
  },
  paso: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
  },
  punto: {
    width: t.espacio[3],
    height: t.espacio[3],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondoSutil,
  },
  puntoHecho: {
    backgroundColor: t.color.acentoFuerte,
  },
  puntoActual: {
    backgroundColor: t.color.marca[500],
  },
  textoPaso: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.sm,
  },
  pasoVivo: {
    color: t.color.texto,
    fontWeight: "500",
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
  },
  item: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  cifra: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  total: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
  },
  separador: {
    height: 1,
    backgroundColor: t.color.borde,
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
});
