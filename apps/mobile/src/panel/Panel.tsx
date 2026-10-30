import { MONEDA } from "@appweb/core/formato";
import {
  IconoCatalogo,
  IconoEstrella,
  IconoPedidos,
  type PropsIconoNativo,
} from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { type ComponentType, useEffect, useState } from "react";
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
import { TarjetaMetrica } from "../componentes/TarjetaMetrica";

type Resumen = Awaited<ReturnType<typeof api.panel.resumen.datos.query>>;
type Periodo = "dia" | "semana" | "mes";

/** Lo que se abre desde el panel. */
export type PantallaPanel = "panel-pedidos" | "panel-stock" | "panel-resenas";

const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: "dia", texto: "Día" },
  { valor: "semana", texto: "Semana" },
  { valor: "mes", texto: "Mes" },
];

interface PropsPanel {
  onVolver: () => void;
  onAbrir: (pantalla: PantallaPanel) => void;
}

/**
 * Panel de administracion en la app: ventas del periodo contra el anterior y
 * lo que espera al equipo (pedidos por atender, stock bajo, reseñas por
 * moderar). Los datos y los permisos son los de @appweb/api: la app solo
 * pinta lo que el rol puede ver.
 */
export function Panel({ onVolver, onAbrir }: PropsPanel) {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `recargas` fuerza recargar
  useEffect(() => {
    let vigente = true;
    api.panel.resumen.datos
      .query({ periodo })
      .then((resumen) => {
        if (vigente) {
          setDatos(resumen);
          setFallo(null);
        }
      })
      .catch((e: unknown) => {
        if (vigente) setFallo(e instanceof Error ? e.message : String(e));
      });
    return () => {
      vigente = false;
    };
  }, [periodo, recargas]);

  const metricas = datos?.metricas;
  const contra = datos ? `vs ${datos.etiquetaAnterior.toLowerCase()}` : undefined;

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Panel de administración" onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : !datos ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : (
        <ScrollView
          contentContainerStyle={estilos.contenido}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => setRecargas((n) => n + 1)} />
          }
        >
          <View style={estilos.periodos}>
            {PERIODOS.map(({ valor, texto }) => (
              <Pressable
                key={valor}
                accessibilityRole="button"
                accessibilityState={{ selected: valor === periodo }}
                onPress={() => setPeriodo(valor)}
                style={[estilos.periodo, valor === periodo && estilos.periodoActivo]}
              >
                <Text style={[estilos.textoPeriodo, valor === periodo && estilos.textoActivo]}>
                  {texto}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={estilos.suave}>{datos.titulo}</Text>

          {metricas ? (
            <>
              <View style={estilos.fila}>
                <TarjetaMetrica
                  titulo="Ventas"
                  valor={MONEDA.format(metricas.ventas)}
                  cambio={metricas.cambioVentas}
                  {...(contra ? { contra } : {})}
                />
                <TarjetaMetrica
                  titulo="Pedidos"
                  valor={String(metricas.pedidos)}
                  cambio={metricas.cambioPedidos}
                  {...(contra ? { contra } : {})}
                />
              </View>
              <View style={estilos.fila}>
                <TarjetaMetrica
                  titulo="Ticket promedio"
                  valor={MONEDA.format(metricas.ticket)}
                  cambio={metricas.cambioTicket}
                  {...(contra ? { contra } : {})}
                />
                <TarjetaMetrica
                  titulo="Clientes nuevos"
                  valor={String(metricas.clientesNuevos)}
                  cambio={metricas.cambioClientesNuevos}
                  {...(contra ? { contra } : {})}
                />
              </View>
            </>
          ) : null}

          <Text style={estilos.seccion}>Por atender</Text>
          <Atajo
            Icono={IconoPedidos}
            texto="Pedidos"
            detalle={`${datos.alertas.pedidosPendientes.length} esperando atención`}
            onPress={() => onAbrir("panel-pedidos")}
          />
          <Atajo
            Icono={IconoCatalogo}
            texto="Stock bajo"
            detalle={`${datos.alertas.variantesBajas.length} variantes por reponer`}
            onPress={() => onAbrir("panel-stock")}
          />
          <Atajo
            Icono={IconoEstrella}
            texto="Reseñas"
            detalle={`${datos.resenasPendientes.length} por moderar`}
            onPress={() => onAbrir("panel-resenas")}
          />
        </ScrollView>
      )}
    </View>
  );
}

interface PropsAtajo {
  Icono: ComponentType<PropsIconoNativo>;
  texto: string;
  detalle: string;
  onPress: () => void;
}

function Atajo({ Icono, texto, detalle, onPress }: PropsAtajo) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [estilos.atajo, pressed && estilos.presionado]}
    >
      <View style={estilos.iconoAtajo}>
        <Icono tamano={20} color={t.color.texto} />
      </View>
      <View style={estilos.textoAtajo}>
        <Text style={estilos.tituloAtajo}>{texto}</Text>
        <Text style={estilos.suaveIzq}>{detalle}</Text>
      </View>
    </Pressable>
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
  periodos: {
    flexDirection: "row",
    padding: t.espacio[1],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  periodo: {
    flex: 1,
    alignItems: "center",
    paddingVertical: t.espacio[2],
    borderRadius: t.radio.completo,
  },
  periodoActivo: {
    backgroundColor: t.color.marca[500],
  },
  textoPeriodo: {
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
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  fila: {
    flexDirection: "row",
    gap: t.espacio[3],
  },
  seccion: {
    marginTop: t.espacio[3],
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  atajo: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  presionado: {
    opacity: 0.7,
  },
  iconoAtajo: {
    width: t.espacio[10],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoControl,
  },
  textoAtajo: {
    flex: 1,
  },
  tituloAtajo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
});
