import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { BackHandler, StyleSheet } from "react-native";
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
import { ProveedorCarrito } from "./src/estado-carrito";
import { ProveedorFavoritos } from "./src/estado-favoritos";
import { ProveedorSesion } from "./src/estado-sesion";
import { Favoritos } from "./src/Favoritos";
import { Marca } from "./src/Marca";
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
  | { tipo: PantallaCuenta | PantallaPanel };

export default function App() {
  const [pestana, setPestana] = useState<Pestana>("inicio");
  // Navegacion minima hasta que entre un navegador de verdad: una pila de
  // pantallas sobre la pestaña elegida.
  const [pila, setPila] = useState<Pantalla[]>([]);
  const encima = pila.at(-1);

  const abrir = (pantalla: Pantalla) => setPila((actual) => [...actual, pantalla]);
  const volver = () => setPila((actual) => actual.slice(0, -1));
  const abrirProducto = (slug: string) => abrir({ tipo: "producto", slug });
  const abrirCarrito = () => abrir({ tipo: "carrito" });

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
        return <Cuenta onAbrir={(tipo) => abrir({ tipo })} />;
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
                <BarraInferior actual={pestana} onCambiar={setPestana} onCarrito={abrirCarrito} />
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
