import { ARCHIVOS_FUENTES_NATIVAS } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { type ComponentProps, useEffect, useState } from "react";
import { BackHandler, Linking, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Carrito } from "./src/Carrito";
import { Catalogo } from "./src/Catalogo";
import { BarraInferior, type Pestana } from "./src/componentes/BarraInferior";
import { Cuenta, type PantallaCuenta } from "./src/Cuenta";
import { CambiarClave } from "./src/cuenta/CambiarClave";
import { DetallePedido } from "./src/cuenta/DetallePedido";
import { Direcciones } from "./src/cuenta/Direcciones";
import { MisDatos } from "./src/cuenta/MisDatos";
import { MisPedidos } from "./src/cuenta/MisPedidos";
import { MisResenas } from "./src/cuenta/MisResenas";
import { DetalleProducto } from "./src/DetalleProducto";
import { tokenDeRecuperacion } from "./src/enlaces";
import { ProveedorCarrito } from "./src/estado-carrito";
import { ProveedorFavoritos } from "./src/estado-favoritos";
import { ProveedorSesion, useSesion } from "./src/estado-sesion";
import { Favoritos } from "./src/Favoritos";
import { Marca } from "./src/Marca";
import { NuevaClave } from "./src/NuevaClave";
import { DetallePedidoPanel } from "./src/panel/DetallePedidoPanel";
import { Panel, type PantallaPanel } from "./src/panel/Panel";
import { PedidosPanel } from "./src/panel/PedidosPanel";
import { ResenasPanel } from "./src/panel/ResenasPanel";
import { StockPanel } from "./src/panel/StockPanel";
import { Portada } from "./src/Portada";

/** Pantallas que se apilan sobre la pestaña. */
type Pantalla =
  | { tipo: "producto"; slug: string }
  | { tipo: "marca"; slug: string }
  | { tipo: "carrito" }
  | { tipo: "pedido"; codigo: string }
  | { tipo: "panel-pedido"; pedidoId: string }
  | { tipo: "nueva-clave"; token: string }
  | { tipo: PantallaCuenta | PantallaPanel };

/** La barra inferior, salvo en el ingreso: como en la web, esa pantalla va sola. */
function BarraDeNavegacion(props: ComponentProps<typeof BarraInferior>) {
  const { sesion } = useSesion();
  if (props.actual === "cuenta" && sesion === null) return null;
  return <BarraInferior {...props} />;
}

/**
 * Espera a las fuentes del proyecto antes de pintar: sin esto el primer cuadro
 * sale con la del sistema y salta. Si fallan, sigue con la del sistema.
 */
export default function App() {
  const [cargadas, fallo] = useFonts(ARCHIVOS_FUENTES_NATIVAS);
  if (!cargadas && !fallo) return null;
  return <Aplicacion />;
}

function Aplicacion() {
  const [pestana, setPestana] = useState<Pestana>("inicio");
  // Navegacion minima hasta que entre un navegador de verdad: una pila de
  // pantallas sobre la pestaña elegida.
  const [pila, setPila] = useState<Pantalla[]>([]);
  const encima = pila.at(-1);

  const abrir = (pantalla: Pantalla) => setPila((actual) => [...actual, pantalla]);
  const volver = () => setPila((actual) => actual.slice(0, -1));
  const abrirProducto = (slug: string) => abrir({ tipo: "producto", slug });
  const abrirCarrito = () => abrir({ tipo: "carrito" });

  // El enlace de recuperacion del correo abre la app (si esta instalada) en vez de
  // la web: al arrancar con el enlace o si ya estaba abierta.
  useEffect(() => {
    function alAbrir(url: string | null | undefined) {
      const token = url ? tokenDeRecuperacion(url) : null;
      if (token) setPila((actual) => [...actual, { tipo: "nueva-clave", token }]);
    }
    Linking.getInitialURL().then(alAbrir);
    const suscripcion = Linking.addEventListener("url", ({ url }) => alAbrir(url));
    return () => suscripcion.remove();
  }, []);

  // El boton "atras" de Android cierra la pantalla de encima en vez de salir.
  useEffect(() => {
    if (pila.length === 0) return;
    const suscripcion = BackHandler.addEventListener("hardwareBackPress", () => {
      setPila((actual) => actual.slice(0, -1));
      return true;
    });
    return () => suscripcion.remove();
  }, [pila.length]);

  function pantallaDeEncima(pantalla: Pantalla) {
    switch (pantalla.tipo) {
      case "producto":
        return (
          <DetalleProducto
            key={pantalla.slug}
            slug={pantalla.slug}
            onVolver={volver}
            onCarrito={abrirCarrito}
            onMarca={(slug) => abrir({ tipo: "marca", slug })}
          />
        );
      case "marca":
        return (
          <Marca
            key={pantalla.slug}
            slug={pantalla.slug}
            onVolver={volver}
            onAbrir={abrirProducto}
          />
        );
      case "carrito":
        return <Carrito onVolver={volver} onAbrir={abrirProducto} />;
      case "pedidos":
        return (
          <MisPedidos onVolver={volver} onAbrir={(codigo) => abrir({ tipo: "pedido", codigo })} />
        );
      case "pedido":
        return <DetallePedido codigo={pantalla.codigo} onVolver={volver} />;
      case "direcciones":
        return <Direcciones onVolver={volver} />;
      case "datos":
        return <MisDatos onVolver={volver} />;
      case "clave":
        return <CambiarClave onVolver={volver} />;
      case "resenas":
        return <MisResenas onVolver={volver} />;
      case "panel":
        return <Panel onVolver={volver} onAbrir={(tipo) => abrir({ tipo })} />;
      case "panel-pedidos":
        return (
          <PedidosPanel
            onVolver={volver}
            onAbrir={(pedidoId) => abrir({ tipo: "panel-pedido", pedidoId })}
          />
        );
      case "panel-pedido":
        return <DetallePedidoPanel pedidoId={pantalla.pedidoId} onVolver={volver} />;
      case "panel-stock":
        return <StockPanel onVolver={volver} />;
      case "panel-resenas":
        return <ResenasPanel onVolver={volver} />;
      case "nueva-clave":
        return (
          <NuevaClave
            key={pantalla.token}
            token={pantalla.token}
            onVolver={volver}
            onIngresar={() => {
              setPila([]);
              setPestana("cuenta");
            }}
          />
        );
    }
  }

  function pestanaActual() {
    switch (pestana) {
      case "inicio":
        return <Portada onAbrir={abrirProducto} onCuenta={() => setPestana("cuenta")} />;
      case "catalogo":
        return <Catalogo onAbrir={abrirProducto} />;
      case "favoritos":
        return <Favoritos onAbrir={abrirProducto} />;
      case "cuenta":
        return <Cuenta onAbrir={(tipo) => abrir({ tipo })} onVolver={() => setPestana("inicio")} />;
    }
  }

  return (
    <SafeAreaProvider>
      <ProveedorSesion>
        <ProveedorCarrito>
          <ProveedorFavoritos>
            <SafeAreaView style={estilos.pantalla} edges={["top", "left", "right"]}>
              {encima ? pantallaDeEncima(encima) : pestanaActual()}
              {encima ? null : (
                <BarraDeNavegacion
                  actual={pestana}
                  onCambiar={setPestana}
                  onCarrito={abrirCarrito}
                />
              )}
              <StatusBar style="dark" />
            </SafeAreaView>
          </ProveedorFavoritos>
        </ProveedorCarrito>
      </ProveedorSesion>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: t.color.fondoPortada,
  },
});
