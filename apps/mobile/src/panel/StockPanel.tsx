import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api, revalidarTienda } from "../api";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { CampoTexto } from "../componentes/CampoTexto";
import { Etiqueta } from "../componentes/Etiqueta";

type Inventario = Awaited<ReturnType<typeof api.panel.stock.listar.query>>;
type Variante = Inventario["variantes"][number];

/**
 * Stock por variante, las que se acaban primero. Tocar una abre el ingreso de
 * unidades. El saldo sale de la suma de movimientos: aqui solo se registra un
 * INGRESO, nunca se escribe el numero (regla de MovimientoStock).
 */
export function StockPanel({ onVolver }: { onVolver: () => void }) {
  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [soloBajas, setSoloBajas] = useState(true);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    api.panel.stock.listar
      .query()
      .then((datos) => {
        setInventario(datos);
        setFallo(null);
      })
      .catch((e: unknown) => setFallo(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(cargar, [cargar]);

  async function ingresar(variante: Variante) {
    const unidades = Number.parseInt(cantidad, 10);
    if (!Number.isInteger(unidades) || unidades <= 0) {
      Alert.alert("Cantidad", "Escribe cuántas unidades entraron.");
      return;
    }
    setGuardando(true);
    try {
      const resultado = await api.panel.stock.registrar.mutate({
        varianteId: variante.id,
        tipo: "INGRESO",
        cantidad: unidades,
      });
      // Pasar de agotado a disponible cambia la ficha y los listados de la tienda.
      await revalidarTienda(resultado.revalidar.productos);
      setAbierta(null);
      setCantidad("");
      cargar();
    } catch (e) {
      Alert.alert("No se pudo", e instanceof Error ? e.message : "Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const variantes = (inventario?.variantes ?? []).filter(
    (v) => !soloBajas || v.stock <= (inventario?.umbralBajo ?? 0),
  );

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Inventario" onVolver={onVolver} />
      <View style={estilos.filtro}>
        {[
          { valor: true, texto: "Stock bajo" },
          { valor: false, texto: "Todo" },
        ].map(({ valor, texto }) => (
          <Pressable
            key={texto}
            accessibilityRole="button"
            accessibilityState={{ selected: soloBajas === valor }}
            onPress={() => setSoloBajas(valor)}
            style={[estilos.opcion, soloBajas === valor && estilos.opcionActiva]}
          >
            <Text style={[estilos.textoOpcion, soloBajas === valor && estilos.textoActivo]}>
              {texto}
            </Text>
          </Pressable>
        ))}
      </View>

      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : !inventario ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : variantes.length === 0 ? (
        <Text style={[estilos.suave, estilos.centro]}>No hay variantes con stock bajo.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
        >
          {variantes.map((variante) => (
            <View key={variante.id} style={estilos.fila}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setAbierta(abierta === variante.id ? null : variante.id);
                  setCantidad("");
                }}
                style={estilos.cabecera}
              >
                <View style={estilos.datos}>
                  <Text style={estilos.nombre} numberOfLines={2}>
                    {variante.producto}
                  </Text>
                  <Text style={estilos.suaveIzq}>
                    Talla {variante.talla} · {variante.color} · {variante.sku}
                  </Text>
                </View>
                <View style={estilos.saldo}>
                  <Text style={estilos.unidades}>{variante.stock}</Text>
                  {variante.stock === 0 ? (
                    <Etiqueta texto="Agotado" tono="error" />
                  ) : variante.stock <= inventario.umbralBajo ? (
                    <Etiqueta texto="Bajo" tono="alerta" />
                  ) : null}
                </View>
              </Pressable>
              {abierta === variante.id ? (
                <View style={estilos.ingreso}>
                  <CampoTexto
                    etiqueta="Unidades que entraron"
                    value={cantidad}
                    onChangeText={setCantidad}
                    keyboardType="number-pad"
                    placeholder="Ej. 24"
                  />
                  <BotonPrincipal
                    texto="Registrar ingreso"
                    onPress={() => ingresar(variante)}
                    cargando={guardando}
                  />
                </View>
              ) : null}
            </View>
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
  filtro: {
    flexDirection: "row",
    alignSelf: "center",
    padding: t.espacio[1],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  opcion: {
    paddingHorizontal: t.espacio[5],
    paddingVertical: t.espacio[2],
    borderRadius: t.radio.completo,
  },
  opcionActiva: {
    backgroundColor: t.color.marca[500],
  },
  textoOpcion: {
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
    overflow: "hidden",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
  },
  datos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  saldo: {
    alignItems: "flex-end",
    gap: t.espacio[1],
  },
  unidades: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "700",
  },
  ingreso: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingTop: 0,
  },
});
