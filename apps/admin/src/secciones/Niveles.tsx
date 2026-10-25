"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clientesPorNivel,
  impactoDeNiveles,
  MAX_BENEFICIO,
  nivelPorCompras,
  revisarNiveles,
  textoQueFalta,
  type Compras,
  type IdNivel,
  type Nivel,
} from "@appweb/core";
import { MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";
import {
  Alerta,
  Boton,
  Campo,
  CampoTexto,
  Cargando,
  CuadroBento,
  CuadroMonto,
  EscaleraNiveles,
  FilaMovimiento,
  IconoPremio,
  InformacionGrid,
  ListaConLateral,
  LogoIcono,
  ProgresoNivel,
  RejillaBento,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { TONO_NIVEL } from "@/lib/tonos-nivel";
import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";

/** Lo que se escribe en el formulario: los montos como texto, tal cual. */
interface Borrador {
  id: IdNivel;
  nombre: string;
  desde: string;
  pedidosMinimos: string;
  descuentoPct: string;
  beneficio: string;
}

function aBorrador(niveles: readonly Nivel[]): Borrador[] {
  return niveles.map((nivel) => ({
    id: nivel.id,
    nombre: nivel.nombre,
    desde: String(nivel.desde),
    pedidosMinimos: String(nivel.pedidosMinimos),
    descuentoPct: String(nivel.descuentoPct),
    beneficio: nivel.beneficio,
  }));
}

function aNiveles(borrador: readonly Borrador[]): Nivel[] {
  return borrador.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre.trim(),
    desde: numeroDesdeTexto(fila.desde),
    pedidosMinimos: numeroDesdeTexto(fila.pedidosMinimos),
    descuentoPct: numeroDesdeTexto(fila.descuentoPct),
    beneficio: fila.beneficio.trim(),
  }));
}

function mismos(a: readonly Nivel[], b: readonly Nivel[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Seccion "Niveles" del grupo Cuentas: los cinco niveles, con cuanto monto y
 * cuantos pedidos pide cada uno, cuanto descuenta y que texto ve el cliente.
 *
 * Mientras se edita, la escalera, el reparto de clientes y la vista previa se
 * recalculan aqui con las funciones de @appweb/core. Ninguna regla se decide en
 * esta pantalla: `revisarNiveles` dice que no se puede guardar, y la API la
 * vuelve a aplicar antes de escribir.
 */
export function Niveles() {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.panel.niveles.listar.queryOptions());

  if (consulta.isPending) return <Cargando texto="Cargando niveles…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  // La clave reinicia el formulario cuando llegan niveles nuevos (al guardar).
  return (
    <EditorNiveles
      key={JSON.stringify(consulta.data.niveles)}
      vigentes={consulta.data.niveles}
      compras={consulta.data.compras}
    />
  );
}

function EditorNiveles({ vigentes, compras }: { vigentes: Nivel[]; compras: Compras[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [borrador, setBorrador] = useState<Borrador[]>(() => aBorrador(vigentes));
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // El nivel que se edita al lado de la lista; por defecto, el primero que se
  // puede mover (Basico tiene monto y pedidos fijos).
  const [elegido, setElegido] = useState<IdNivel | null>(null);
  const escritorio = useEscritorio();

  const propuestos = useMemo(() => aNiveles(borrador), [borrador]);
  const motivo = revisarNiveles(propuestos);
  const cambiado = !mismos(propuestos, vigentes);

  // Con niveles invalidos (p. ej. Oro por debajo de Plata) los calculos no
  // significan nada: se muestran los vigentes hasta que se corrija.
  const mostrados = motivo === null ? propuestos : vigentes;
  const reparto = clientesPorNivel(compras, mostrados);
  const impacto = motivo === null ? impactoDeNiveles(compras, vigentes, propuestos) : null;

  const guardar = useMutation(
    trpc.panel.niveles.guardar.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAviso("Niveles guardados. Desde ahora el checkout usa estos requisitos y descuentos.");
        void queryClient.invalidateQueries(trpc.panel.niveles.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(mensajeDeFallo(fallo));
      },
    }),
  );

  function cambiar(id: IdNivel, campo: keyof Omit<Borrador, "id">, valor: string) {
    setAviso(null);
    setBorrador((filas) =>
      filas.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)),
    );
  }

  // Ejemplo para la vista previa: un cliente a mitad de camino entre el
  // segundo y el tercer nivel, en monto y en pedidos.
  const segundo = mostrados[1];
  const tercero = mostrados[2];
  const ejemplo: Compras =
    segundo && tercero
      ? {
          total: Math.round((segundo.desde + tercero.desde) / 2),
          pedidos: Math.round((segundo.pedidosMinimos + tercero.pedidosMinimos) / 2),
        }
      : { total: 0, pedidos: 0 };
  const estadoEjemplo = nivelPorCompras(ejemplo, mostrados);

  const indice = Math.max(
    0,
    borrador.findIndex((fila) => fila.id === (elegido ?? borrador[1]?.id)),
  );
  const seleccion = borrador[indice];
  const fijo = indice === 0;

  const botones = (
    <>
      <Boton
        variante="secundario"
        disabled={!cambiado || guardar.isPending}
        onClick={() => {
          setBorrador(aBorrador(vigentes));
          setError(null);
        }}
      >
        Descartar
      </Boton>
      <Boton
        disabled={!cambiado || motivo !== null || guardar.isPending}
        onClick={() => guardar.mutate({ niveles: propuestos })}
      >
        {guardar.isPending ? "Guardando…" : "Guardar niveles"}
      </Boton>
    </>
  );

  const editor = seleccion ? (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoPremio tamano={16} />} nombre="Nivel" />}
        estado={{
          texto: `${reparto[seleccion.id] ?? 0} ${reparto[seleccion.id] === 1 ? "cliente" : "clientes"}`,
          tono: "neutro",
        }}
        etiqueta={fijo ? "Nivel de toda cuenta nueva" : `Nivel ${indice + 1} de ${borrador.length}`}
        monto={seleccion.nombre || seleccion.id}
        texto
      />
      <CuadroBento titulo="Nombre" ancho="ancho">
        <Campo
          id={`nivel-nombre-${seleccion.id}`}
          etiqueta="Nombre"
          etiquetaOculta
          valor={seleccion.nombre}
          onCambio={(valor) => cambiar(seleccion.id, "nombre", valor)}
        />
      </CuadroBento>
      <CuadroBento titulo={fijo ? "Monto S/ · fijo" : "Monto S/"}>
        <Campo
          id={`nivel-desde-${seleccion.id}`}
          etiqueta="Monto comprado (S/)"
          etiquetaOculta
          valor={seleccion.desde}
          onCambio={(valor) => cambiar(seleccion.id, "desde", valor)}
          disabled={fijo}
        />
      </CuadroBento>
      <CuadroBento titulo={fijo ? "Pedidos · fijo" : "Pedidos"}>
        <Campo
          id={`nivel-pedidos-${seleccion.id}`}
          etiqueta="Pedidos mínimos"
          etiquetaOculta
          valor={seleccion.pedidosMinimos}
          onCambio={(valor) => cambiar(seleccion.id, "pedidosMinimos", valor)}
          disabled={fijo}
        />
      </CuadroBento>
      <CuadroBento titulo="Descuento en cada compra (%)" ancho="ancho">
        <Campo
          id={`nivel-descuento-${seleccion.id}`}
          etiqueta="Descuento en cada compra (%)"
          etiquetaOculta
          valor={seleccion.descuentoPct}
          onCambio={(valor) => cambiar(seleccion.id, "descuentoPct", valor)}
        />
      </CuadroBento>
      <CuadroBento titulo="Lo que ve el cliente" ancho="ancho">
        <CampoTexto
          id={`nivel-beneficio-${seleccion.id}`}
          etiqueta={`${seleccion.beneficio.length} de ${MAX_BENEFICIO} caracteres`}
          valor={seleccion.beneficio}
          onCambio={(valor) => cambiar(seleccion.id, "beneficio", valor)}
          filas={3}
        />
      </CuadroBento>
    </RejillaBento>
  ) : null;

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Tarjeta titulo="Escalera de niveles">
        <EscaleraNiveles
          tramos={mostrados.map((nivel) => ({
            id: nivel.id,
            nombre: nivel.nombre,
            desde: nivel.desde,
            etiquetaDesde:
              nivel.desde > 0
                ? `${MONEDA.format(nivel.desde)} y ${nivel.pedidosMinimos} ${nivel.pedidosMinimos === 1 ? "pedido" : "pedidos"}`
                : "al crear la cuenta",
            detalle:
              nivel.descuentoPct > 0 ? `${nivel.descuentoPct}% de descuento` : "sin descuento",
            tono: TONO_NIVEL[nivel.id],
          }))}
        />
      </Tarjeta>

      <ListaConLateral
        lateral={
          seleccion ? (
            <VistaPrevia logo={null} estado={{ texto: "", tono: "neutro" }} etiqueta="" monto="">
              {editor}
            </VistaPrevia>
          ) : null
        }
      >
        <Tarjeta titulo="Editar cada nivel" acciones={botones}>
          <p>
            Para subir hay que cumplir los dos requisitos: el monto y los pedidos. Cada nivel pide
            más que el anterior y no descuenta menos.
          </p>
          {motivo !== null ? <Alerta tono="error">{motivo}</Alerta> : null}
          <div>
            {borrador.map((fila) => {
              const nivel = mostrados.find((n) => n.id === fila.id);
              const clientes = nivel ? reparto[nivel.id] : 0;
              return (
                <FilaMovimiento
                  key={fila.id}
                  logo={<LogoIcono icono={<IconoPremio tamano={16} />} nombre="Nivel" />}
                  titulo={fila.nombre || fila.id}
                  subtitulo={`S/ ${fila.desde || "0"} · ${fila.pedidosMinimos || "0"} ${fila.pedidosMinimos === "1" ? "pedido" : "pedidos"}`}
                  estado={{
                    texto: `${clientes} ${clientes === 1 ? "cliente" : "clientes"}`,
                    tono: "neutro",
                  }}
                  valor={`${fila.descuentoPct || "0"}%`}
                  seleccionada={seleccion?.id === fila.id}
                  onAbrir={() => setElegido(fila.id)}
                  etiquetaAbrir={`Editar nivel ${fila.nombre || fila.id}`}
                />
              );
            })}
          </div>
        </Tarjeta>
      </ListaConLateral>
      {/* Sin escritorio no hay columna lateral: el editor va debajo de la lista. */}
      {!escritorio && seleccion ? editor : null}

      <Tarjeta titulo="Clientes por nivel">
        <RejillaMetricas>
          {mostrados.map((nivel) => (
            <TarjetaMetrica
              key={nivel.id}
              etiqueta={`En ${nivel.nombre}`}
              valor={String(reparto[nivel.id])}
              contexto={cambiado && motivo === null ? "si guardas estos cambios" : "hoy"}
            />
          ))}
        </RejillaMetricas>
        {impacto === null || !cambiado ? null : impacto.suben + impacto.bajan === 0 ? (
          <Alerta tono="info">Con estos requisitos ningún cliente cambia de nivel.</Alerta>
        ) : (
          <Alerta tono={impacto.bajan > 0 ? "error" : "info"}>
            Si guardas: {impacto.suben} {impacto.suben === 1 ? "cliente sube" : "clientes suben"} de
            nivel y {impacto.bajan} {impacto.bajan === 1 ? "baja" : "bajan"}.
            {impacto.bajan > 0 ? " Quien baje pierde su descuento desde la próxima compra." : ""}
          </Alerta>
        )}
      </Tarjeta>

      <Tarjeta titulo="Reglas del programa">
        <InformacionGrid
          datos={[
            {
              titulo: "Qué se cuenta",
              contenido: "El monto comprado y la cantidad de pedidos: se piden los dos a la vez.",
            },
            {
              titulo: "Periodo",
              contenido: "Todo el historial: un cliente no baja de nivel por el paso del tiempo.",
            },
            {
              titulo: "Qué pedidos suman",
              contenido: "Pagados, en preparación, enviados y entregados.",
            },
            {
              titulo: "Con cupón",
              contenido: "No se suman: se aplica el que da más descuento.",
            },
            {
              titulo: "Envío",
              contenido: "Los niveles no dan envío gratis: dan descuento en productos y obsequios.",
            },
            {
              titulo: "Obsequios",
              contenido: "Van siempre dentro de un pedido pagado. Almacén los agrega a la caja.",
            },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Así lo ve el cliente">
        <p>
          Ejemplo de un cliente con {MONEDA.format(ejemplo.total)} comprados en {ejemplo.pedidos}{" "}
          pedidos:
        </p>
        <ProgresoNivel
          titulo={`Nivel ${estadoEjemplo.nivel.nombre}`}
          detalle={estadoEjemplo.nivel.beneficio}
          progresoPct={estadoEjemplo.progresoPct}
          pie={
            estadoEjemplo.siguiente
              ? `Te faltan ${textoQueFalta(estadoEjemplo.siguiente)} para llegar a ${estadoEjemplo.siguiente.nivel.nombre}`
              : "Estás en el nivel más alto"
          }
          tono={TONO_NIVEL[estadoEjemplo.nivel.id]}
        />
      </Tarjeta>
    </>
  );
}
