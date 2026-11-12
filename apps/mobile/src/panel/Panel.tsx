import { seriesPorTramo, type SeriesResumen } from "@appweb/core/panel-resumen";
import { MONEDA } from "@appweb/core/formato";
import {
  IconoCatalogo,
  IconoEstrella,
  IconoPedidos,
  type PropsIconoNativo,
} from "@appweb/ui/iconos.nativos";
import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
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
import { CarruselPaginado } from "../componentes/CarruselPaginado";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { GraficoTendenciaNativo } from "../componentes/GraficoTendenciaNativo";
import { TarjetaMetrica } from "../componentes/TarjetaMetrica";

type Resumen = Awaited<ReturnType<typeof api.panel.resumen.datos.query>>;
type Periodo = "dia" | "semana" | "mes";
type Metrica = "ventas" | "pedidos" | "ticket" | "clientes";

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
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<Metrica>("ventas");

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
  const seriesBase: SeriesResumen | null = metricas
    ? {
        ventas: metricas.serieVentas,
        pedidos: metricas.seriePedidos,
        ticket: metricas.serieTicket,
        clientesNuevos: metricas.serieClientesNuevos,
      }
    : null;
  const seriesPrevias: SeriesResumen | null = metricas
    ? {
        ventas: metricas.serieVentasPrevia,
        pedidos: metricas.seriePedidosPrevia,
        ticket: metricas.serieTicketPrevia,
        clientesNuevos: metricas.serieClientesNuevosPrevia,
      }
    : null;
  const series =
    seriesBase && seriesPrevias
      ? periodo === "dia"
        ? { actual: seriesBase, previa: seriesPrevias }
        : { actual: seriesPorTramo(seriesBase), previa: seriesPorTramo(seriesPrevias) }
      : null;
  const grafica =
    metricas && series
      ? {
          ventas: {
            titulo: "Ventas",
            detalle:
              periodo === "dia"
                ? "Ventas acumuladas del periodo contra el anterior"
                : "Ventas por tramo del periodo contra el anterior",
            valor: MONEDA.format(metricas.ventas),
            previo: MONEDA.format(metricas.anteriores.ventas),
            serie: series.actual.ventas,
            previa: series.previa.ventas,
            formatear: (valor: number) => MONEDA.format(valor),
          },
          pedidos: {
            titulo: "Pedidos",
            detalle: "Pedidos del periodo contra el anterior",
            valor: String(metricas.pedidos),
            previo: String(metricas.anteriores.pedidos),
            serie: series.actual.pedidos,
            previa: series.previa.pedidos,
            formatear: (valor: number) => String(Math.round(valor)),
          },
          ticket: {
            titulo: "Ticket promedio",
            detalle: "Ticket promedio del periodo contra el anterior",
            valor: MONEDA.format(metricas.ticket),
            previo: MONEDA.format(metricas.anteriores.ticket),
            serie: series.actual.ticket,
            previa: series.previa.ticket,
            formatear: (valor: number) => MONEDA.format(valor),
          },
          clientes: {
            titulo: "Clientes nuevos",
            detalle: "Clientes nuevos del periodo contra el anterior",
            valor: String(metricas.clientesNuevos),
            previo: String(metricas.anteriores.clientesNuevos),
            serie: series.actual.clientesNuevos,
            previa: series.previa.clientesNuevos,
            formatear: (valor: number) => String(Math.round(valor)),
          },
        }[metricaSeleccionada]
      : null;
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
              <CarruselPaginado>
                <TarjetaMetrica
                  titulo="Ventas"
                  valor={MONEDA.format(metricas.ventas)}
                  cambio={metricas.cambioVentas}
                  contra={datos.etiquetaAnterior.toLowerCase()}
                  anterior={MONEDA.format(metricas.anteriores.ventas)}
                  seleccionada={metricaSeleccionada === "ventas"}
                  onSeleccionar={() => setMetricaSeleccionada("ventas")}
                />
                <TarjetaMetrica
                  titulo="Pedidos"
                  valor={String(metricas.pedidos)}
                  cambio={metricas.cambioPedidos}
                  contra={datos.etiquetaAnterior.toLowerCase()}
                  anterior={String(metricas.anteriores.pedidos)}
                  seleccionada={metricaSeleccionada === "pedidos"}
                  onSeleccionar={() => setMetricaSeleccionada("pedidos")}
                />
                <TarjetaMetrica
                  titulo="Ticket promedio"
                  valor={MONEDA.format(metricas.ticket)}
                  cambio={metricas.cambioTicket}
                  contra={datos.etiquetaAnterior.toLowerCase()}
                  anterior={MONEDA.format(metricas.anteriores.ticket)}
                  seleccionada={metricaSeleccionada === "ticket"}
                  onSeleccionar={() => setMetricaSeleccionada("ticket")}
                />
                <TarjetaMetrica
                  titulo="Clientes nuevos"
                  valor={String(metricas.clientesNuevos)}
                  cambio={metricas.cambioClientesNuevos}
                  contra={datos.etiquetaAnterior.toLowerCase()}
                  anterior={String(metricas.anteriores.clientesNuevos)}
                  seleccionada={metricaSeleccionada === "clientes"}
                  onSeleccionar={() => setMetricaSeleccionada("clientes")}
                />
              </CarruselPaginado>
              {grafica ? (
                <GraficoTendenciaNativo
                  titulo={grafica.titulo}
                  detalle={grafica.detalle}
                  etiquetaActual={datos.titulo}
                  valorActual={grafica.valor}
                  etiquetaPrevia={datos.etiquetaAnterior}
                  valorPrevio={grafica.previo}
                  serie={grafica.serie}
                  seriePrevia={grafica.previa}
                  marcas={datos.marcasEje}
                  formatear={grafica.formatear}
                  suavizado={periodo === "dia"}
                />
              ) : null}
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
    backgroundColor: t.color.fondoBloque,
  },
  periodo: {
    flex: 1,
    alignItems: "center",
    paddingVertical: t.espacio[2],
    borderRadius: t.radio.completo,
  },
  periodoActivo: {
    backgroundColor: t.color.acentoMovil,
  },
  textoPeriodo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  textoActivo: {
    color: t.color.textoInverso,
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
    textAlign: "center",
  },
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  seccion: {
    marginTop: t.espacio[3],
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  atajo: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
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
    fontFamily: FUENTE_NATIVA.titulos[600],
  },
});
