import { ETIQUETAS, siguientesEstados, tonoDeEstado } from "@appweb/core/estados-pedido";
import { FECHA_HORA, MONEDA } from "@appweb/core/formato";
import { ETIQUETAS_MEDIO_PAGO } from "@appweb/core/gestion-pedidos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, revalidarTienda } from "../api";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { CampoTexto } from "../componentes/CampoTexto";
import { Etiqueta } from "../componentes/Etiqueta";

type Pedido = Awaited<ReturnType<typeof api.panel.pedidos.detalle.query>>;
type Estado = Pedido["estado"];

interface PropsDetallePedidoPanel {
  pedidoId: string;
  onVolver: () => void;
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar.";
}

/**
 * Un pedido del panel: cliente, productos, pagos, envio e historial, y abajo
 * las acciones que su estado permite. Las transiciones validas salen de
 * `siguientesEstados` de @appweb/core y el servidor las vuelve a comprobar.
 */
export function DetallePedidoPanel({ pedidoId, onVolver }: PropsDetallePedidoPanel) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [referencia, setReferencia] = useState("");
  const [transportista, setTransportista] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(() => {
    api.panel.pedidos.detalle
      .query({ pedidoId })
      .then(setPedido)
      .catch((e: unknown) => setFallo(mensajeDe(e)));
  }, [pedidoId]);

  useEffect(cargar, [cargar]);

  async function ejecutar(
    accion: () => Promise<{ productosTocados: { slug: string; slugCategoria: string }[] }>,
  ) {
    setTrabajando(true);
    try {
      const resultado = await accion();
      // El stock cambio: la tienda regenera esas fichas y listados.
      await revalidarTienda(resultado.productosTocados);
      cargar();
    } catch (e) {
      Alert.alert("No se pudo", mensajeDe(e));
    } finally {
      setTrabajando(false);
    }
  }

  function confirmarPago(pagoId: string) {
    ejecutar(() =>
      api.panel.pedidos.confirmarPago.mutate({ pedidoId, pagoId, referencia: referencia.trim() }),
    );
  }

  function cambiar(estado: Estado) {
    const pasar = () =>
      ejecutar(() =>
        api.panel.pedidos.cambiarEstado.mutate({
          pedidoId,
          estado,
          ...(estado === "ENVIADO" && transportista.trim()
            ? { transportista: transportista.trim() }
            : {}),
          ...(estado === "ENVIADO" && seguimiento.trim()
            ? { codigoSeguimiento: seguimiento.trim() }
            : {}),
        }),
      );
    if (estado === "CANCELADO") {
      Alert.alert("Cancelar pedido", "Se devolverá el stock si ya estaba descontado.", [
        { text: "Volver", style: "cancel" },
        { text: "Cancelar pedido", style: "destructive", onPress: pasar },
      ]);
      return;
    }
    pasar();
  }

  const contraEntrega = pedido?.medioPago === "CONTRA_ENTREGA";
  const siguientes: readonly Estado[] = pedido
    ? siguientesEstados(pedido.estado, { contraEntrega })
    : [];
  // Pendiente de pago: el cambio a PAGADO pasa por confirmar el pago con su operacion.
  const pagoPendiente =
    pedido?.estado === "PENDIENTE_PAGO" && !contraEntrega
      ? pedido.pagos.find((p) => p.estado === "PENDIENTE")
      : undefined;
  const otrasAcciones = siguientes.filter((e) => !(e === "PAGADO" && !contraEntrega));

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo={pedido ? `N.º ${pedido.codigo}` : "Pedido"} onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : !pedido ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : (
        <ScrollView
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.bloque}>
            <View style={estilos.fila}>
              <Etiqueta texto={ETIQUETAS[pedido.estado]} tono={tonoDeEstado(pedido.estado)} />
              <Text style={estilos.suaveIzq}>{FECHA_HORA.format(new Date(pedido.creadoEn))}</Text>
            </View>
            <Text style={estilos.subtitulo}>{pedido.cliente.nombre}</Text>
            <Text style={estilos.suaveIzq}>{pedido.cliente.email}</Text>
            {pedido.cliente.telefono ? (
              <Text style={estilos.suaveIzq}>{pedido.cliente.telefono}</Text>
            ) : null}
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Productos</Text>
            {pedido.items.map((item) => (
              <View key={`${item.sku}`} style={estilos.fila}>
                <View style={estilos.item}>
                  <Text style={estilos.nombre}>{item.nombreProducto}</Text>
                  <Text style={estilos.suaveIzq}>
                    Talla {item.talla} · {item.color} · {item.cantidad} ×{" "}
                    {MONEDA.format(item.precioUnitario)} · stock {item.stockActual}
                  </Text>
                </View>
                <Text style={estilos.cifra}>
                  {MONEDA.format(item.precioUnitario * item.cantidad)}
                </Text>
              </View>
            ))}
            <View style={estilos.separador} />
            <Linea texto="Subtotal" valor={MONEDA.format(pedido.subtotal)} />
            {pedido.descuento > 0 ? (
              <Linea texto="Descuento" valor={`−${MONEDA.format(pedido.descuento)}`} />
            ) : null}
            <Linea texto="Envío" valor={MONEDA.format(pedido.costoEnvio)} />
            <Linea texto="Total" valor={MONEDA.format(pedido.total)} fuerte />
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Pago · {ETIQUETAS_MEDIO_PAGO[pedido.medioPago]}</Text>
            {pedido.pagos.map((pago) => (
              <View key={pago.id} style={estilos.fila}>
                <Text style={estilos.suaveIzq}>
                  {pago.estado}
                  {pago.referencia ? ` · op. ${pago.referencia}` : ""}
                  {pago.confirmadoPor ? ` · ${pago.confirmadoPor}` : ""}
                </Text>
                <Text style={estilos.cifra}>{MONEDA.format(pago.monto)}</Text>
              </View>
            ))}
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Envío</Text>
            <Text style={estilos.suaveIzq}>
              {pedido.envio.destinatario} · {pedido.envio.telefono}
            </Text>
            <Text style={estilos.suaveIzq}>{pedido.envio.direccion}</Text>
            {pedido.envio.referencia ? (
              <Text style={estilos.suaveIzq}>Ref.: {pedido.envio.referencia}</Text>
            ) : null}
            {pedido.envio.transportista ? (
              <Text style={estilos.suaveIzq}>
                {pedido.envio.transportista}
                {pedido.envio.codigoSeguimiento ? ` · ${pedido.envio.codigoSeguimiento}` : ""}
              </Text>
            ) : null}
          </View>

          {pedido.historial.length > 0 ? (
            <View style={estilos.bloque}>
              <Text style={estilos.subtitulo}>Historial</Text>
              {pedido.historial.map((h) => (
                <View key={h.id} style={estilos.item}>
                  <Text style={estilos.nombre}>
                    {ETIQUETAS[h.estadoNuevo]}
                    {h.usuario ? ` · ${h.usuario}` : ""}
                  </Text>
                  <Text style={estilos.suaveIzq}>
                    {FECHA_HORA.format(new Date(h.creadoEn))}
                    {h.nota ? ` · ${h.nota}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {pagoPendiente || otrasAcciones.length > 0 ? (
            <View style={estilos.bloque}>
              <Text style={estilos.subtitulo}>Acciones</Text>
              {pagoPendiente ? (
                <>
                  <CampoTexto
                    etiqueta="Número de operación del pago"
                    value={referencia}
                    onChangeText={setReferencia}
                    placeholder="Ej. 123456"
                  />
                  <BotonPrincipal
                    texto="Confirmar pago"
                    onPress={() => confirmarPago(pagoPendiente.id)}
                    cargando={trabajando}
                  />
                </>
              ) : null}
              {otrasAcciones.includes("ENVIADO") ? (
                <>
                  <CampoTexto
                    etiqueta="Transportista (opcional)"
                    value={transportista}
                    onChangeText={setTransportista}
                    placeholder="Olva, Shalom..."
                  />
                  <CampoTexto
                    etiqueta="Código de seguimiento (opcional)"
                    value={seguimiento}
                    onChangeText={setSeguimiento}
                  />
                </>
              ) : null}
              {otrasAcciones.map((estado) => (
                <BotonPrincipal
                  key={estado}
                  texto={
                    estado === "CANCELADO" ? "Cancelar pedido" : `Pasar a ${ETIQUETAS[estado]}`
                  }
                  onPress={() => cambiar(estado)}
                  cargando={trabajando}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Linea({ texto, valor, fuerte }: { texto: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={estilos.fila}>
      <Text style={fuerte ? estilos.subtitulo : estilos.suaveIzq}>{texto}</Text>
      <Text style={fuerte ? estilos.subtitulo : estilos.cifra}>{valor}</Text>
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
  item: {
    flex: 1,
    gap: 2,
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
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
