import { calcularTotales, MAX_POR_LINEA } from "@appweb/core/carrito";
import { MONEDA } from "@appweb/core/formato";
import { IconoCarrito, IconoFlechaIzquierda, IconoPapelera } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, urlDeImagen } from "./api";
import { useCarrito } from "./estado-carrito";
import { useSesion } from "./estado-sesion";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { Cantidad } from "./componentes/Cantidad";

type Variante = Awaited<ReturnType<typeof api.catalogo.lineas.query>>[number];

interface PropsCarrito {
  onVolver: () => void;
  onAbrir: (slug: string) => void;
}

/**
 * El carrito: cada linea con foto, talla y color, precio de hoy y su contador.
 * Los totales salen de `calcularTotales` de @appweb/core, la misma funcion que
 * cerrara el pedido: lo que se ve aqui es lo que se cobrara.
 */
export function Carrito({ onVolver, onAbrir }: PropsCarrito) {
  const margenes = useSafeAreaInsets();
  const carrito = useCarrito();
  const [variantes, setVariantes] = useState<Variante[] | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  // Se piden de nuevo solo si cambia que variantes hay, no cada cantidad.
  const ids = carrito.lineas.map((l) => l.varianteId).join(",");
  const { conservar } = carrito;
  // `conservar` cambia en cada render; lo que decide recargar son los ids.
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo los ids deciden recargar
  useEffect(() => {
    const varianteIds = ids ? ids.split(",") : [];
    if (varianteIds.length === 0) {
      setVariantes([]);
      return;
    }
    api.catalogo.lineas
      .query({ varianteIds })
      .then((encontradas) => {
        setFallo(null);
        setVariantes(encontradas);
        // Lo que el servidor ya no reconoce sale del carrito guardado.
        if (encontradas.length < varianteIds.length) {
          conservar(encontradas.map((v) => v.varianteId));
        }
      })
      .catch((error: unknown) =>
        setFallo(error instanceof Error ? error.message : "No se pudo cargar el carrito."),
      );
  }, [ids]);

  const lineas = useMemo(
    () =>
      carrito.lineas.flatMap((guardada) => {
        const variante = variantes?.find((v) => v.varianteId === guardada.varianteId);
        return variante ? [{ ...variante, cantidad: guardada.cantidad }] : [];
      }),
    [carrito.lineas, variantes],
  );

  // Con sesion, el descuento del nivel del cliente: el mismo que aplicara el checkout.
  const { sesion } = useSesion();
  const [nivel, setNivel] = useState<{ nombre: string; descuentoPct: number } | null>(null);
  useEffect(() => {
    if (!sesion) {
      setNivel(null);
      return;
    }
    api.cuenta.nivel
      .query()
      .then((estado) => setNivel(estado.nivel))
      .catch(() => setNivel(null));
  }, [sesion]);

  const totales = useMemo(
    () =>
      // Sin metodo de envio: el costo y la direccion se eligen en el checkout.
      calcularTotales(
        lineas.map((l) => ({
          varianteId: l.varianteId,
          precioUnitario: l.precio,
          cantidad: l.cantidad,
          stock: l.stock,
        })),
        { descuentoNivelPct: nivel?.descuentoPct ?? 0 },
      ),
    [lineas, nivel],
  );
  const sinStock = new Set(totales.lineasSinStock);

  function pagar() {
    if (sinStock.size > 0) {
      Alert.alert("Revisa tu carrito", "Hay productos sin stock suficiente.");
      return;
    }
    // El checkout de la app llega en la siguiente pantalla.
    Alert.alert("Pronto", "El pago desde la app está en camino.");
  }

  const cabecera = (
    <View style={estilos.cabecera}>
      <BotonRedondo etiqueta="Volver" onPress={onVolver}>
        <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
      </BotonRedondo>
      <Text style={estilos.tituloCabecera}>Mi carrito</Text>
      <View style={estilos.hueco} />
    </View>
  );

  if (carrito.lineas.length === 0) {
    return (
      <View style={estilos.pantalla}>
        {cabecera}
        <View style={estilos.centro}>
          <View style={estilos.iconoVacio}>
            <IconoCarrito tamano={32} color={t.color.textoSuave} />
          </View>
          <Text style={estilos.tituloVacio}>Tu carrito está vacío</Text>
          <Text style={estilos.suave}>Agrega tus básicos favoritos y vuelve aquí.</Text>
          <Pressable accessibilityRole="button" onPress={onVolver} style={estilos.botonOscuro}>
            <Text style={estilos.textoBotonOscuro}>Ver productos</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (fallo || !variantes) {
    return (
      <View style={estilos.pantalla}>
        {cabecera}
        <View style={estilos.centro}>
          {fallo ? (
            <Text style={estilos.suave}>{fallo}</Text>
          ) : (
            <ActivityIndicator color={t.color.texto} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      {cabecera}
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        <Text style={estilos.contador}>
          {totales.unidades} {totales.unidades === 1 ? "producto" : "productos"}
        </Text>

        {lineas.map((linea) => (
          <View key={linea.varianteId} style={estilos.linea}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={linea.nombre}
              onPress={() => onAbrir(linea.slug)}
              style={estilos.foto}
            >
              {linea.imagenUrl ? (
                <Image source={{ uri: urlDeImagen(linea.imagenUrl) }} style={estilos.imagen} />
              ) : null}
            </Pressable>
            <View style={estilos.datos}>
              <View style={estilos.filaNombre}>
                <Text style={estilos.nombre} numberOfLines={2}>
                  {linea.nombre}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${linea.nombre}`}
                  hitSlop={8}
                  onPress={() => carrito.quitar(linea.varianteId)}
                >
                  <IconoPapelera tamano={18} color={t.color.textoTenue} />
                </Pressable>
              </View>
              <Text style={estilos.variante}>
                Talla {linea.talla} · {linea.color}
              </Text>
              {sinStock.has(linea.varianteId) ? (
                <Text style={estilos.aviso}>
                  {linea.stock === 0 ? "AGOTADO" : `SOLO QUEDAN ${linea.stock}`}
                </Text>
              ) : null}
              <View style={estilos.filaPrecio}>
                <View>
                  <Text style={estilos.precio}>{MONEDA.format(linea.precio * linea.cantidad)}</Text>
                  {linea.cantidad > 1 ? (
                    <Text style={estilos.unitario}>{MONEDA.format(linea.precio)} c/u</Text>
                  ) : null}
                </View>
                <Cantidad
                  valor={linea.cantidad}
                  maximo={Math.max(1, Math.min(MAX_POR_LINEA, linea.stock))}
                  onCambiar={(cantidad) => carrito.cambiar(linea.varianteId, cantidad)}
                />
              </View>
            </View>
          </View>
        ))}

        <View style={estilos.resumen}>
          <View style={estilos.filaResumen}>
            <Text style={estilos.suave}>Subtotal</Text>
            <Text style={estilos.cifra}>{MONEDA.format(totales.subtotal)}</Text>
          </View>
          {totales.descuento > 0 ? (
            <View style={estilos.filaResumen}>
              <Text style={estilos.suave}>
                Descuento nivel {nivel?.nombre} ({nivel?.descuentoPct}%)
              </Text>
              <Text style={estilos.descuento}>−{MONEDA.format(totales.descuento)}</Text>
            </View>
          ) : null}
          <View style={estilos.filaResumen}>
            <Text style={estilos.suave}>Envío</Text>
            <Text style={estilos.suave}>Se calcula al pagar</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[estilos.barra, { bottom: Math.max(margenes.bottom, t.espacio[3]) }]}>
        <View>
          <Text style={estilos.etiquetaTotal}>Total</Text>
          <Text style={estilos.total}>{MONEDA.format(totales.total)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={pagar}
          style={({ pressed }) => [estilos.botonOscuro, pressed && estilos.presionado]}
        >
          <Text style={estilos.textoBotonOscuro}>Ir a pagar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
  },
  tituloCabecera: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  hueco: {
    width: t.espacio[12],
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[2],
    padding: t.espacio[6],
  },
  iconoVacio: {
    width: t.espacio[20],
    height: t.espacio[20],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  tituloVacio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  contenido: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingBottom: t.espacio[32],
  },
  contador: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  linea: {
    flexDirection: "row",
    gap: t.espacio[3],
    padding: t.espacio[2],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  foto: {
    width: t.espacio[24],
    height: t.espacio[24],
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
    gap: t.espacio[1],
    paddingVertical: t.espacio[1],
    paddingRight: t.espacio[1],
  },
  filaNombre: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: t.espacio[2],
  },
  nombre: {
    flex: 1,
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  variante: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  aviso: {
    alignSelf: "flex-start",
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
  },
  filaPrecio: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  precio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "700",
  },
  unitario: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.etiqueta,
  },
  resumen: {
    gap: t.espacio[2],
    marginTop: t.espacio[2],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  descuento: {
    color: t.color.acentoTexto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  cifra: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
  barra: {
    position: "absolute",
    left: t.espacio[4],
    right: t.espacio[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[3],
    paddingVertical: t.espacio[2],
    paddingLeft: t.espacio[5],
    paddingRight: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.lg,
  },
  etiquetaTotal: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  total: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
  },
  botonOscuro: {
    alignItems: "center",
    justifyContent: "center",
    height: t.espacio[12],
    marginTop: t.espacio[2],
    paddingHorizontal: t.espacio[6],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.marca[500],
  },
  textoBotonOscuro: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  presionado: {
    transform: [{ scale: 0.97 }],
  },
});
