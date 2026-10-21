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
  EscaleraNiveles,
  InformacionGrid,
  ProgresoNivel,
  RejillaMetricas,
  RejillaNiveles,
  Tarjeta,
  TarjetaMetrica,
  TarjetaNivel,
  type TonoNivel,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

const TONO: Record<IdNivel, TonoNivel> = {
  BASICO: "basico",
  BRONCE: "bronce",
  PLATA: "plata",
  ORO: "oro",
  PLATINO: "platino",
};

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
            tono: TONO[nivel.id],
          }))}
        />
      </Tarjeta>

      <Tarjeta
        titulo="Editar cada nivel"
        acciones={
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
        }
      >
        <p>
          Para subir hay que cumplir los dos requisitos: el monto y los pedidos. Básico es el de
          toda cuenta nueva (S/ 0 y 0 pedidos). Cada nivel pide más que el anterior y no descuenta
          menos.
        </p>
        {motivo !== null ? <Alerta tono="error">{motivo}</Alerta> : null}
        <RejillaNiveles>
          {borrador.map((fila, i) => (
            <TarjetaNivel key={fila.id} nombre={fila.nombre || fila.id} tono={TONO[fila.id]}>
              <Campo
                id={`nivel-nombre-${fila.id}`}
                etiqueta="Nombre"
                valor={fila.nombre}
                onCambio={(valor) => cambiar(fila.id, "nombre", valor)}
              />
              <Campo
                id={`nivel-desde-${fila.id}`}
                etiqueta={i === 0 ? "Monto comprado (S/) · fijo" : "Monto comprado (S/)"}
                valor={fila.desde}
                onCambio={(valor) => cambiar(fila.id, "desde", valor)}
                disabled={i === 0}
              />
              <Campo
                id={`nivel-pedidos-${fila.id}`}
                etiqueta={i === 0 ? "Pedidos · fijo" : "Pedidos mínimos"}
                valor={fila.pedidosMinimos}
                onCambio={(valor) => cambiar(fila.id, "pedidosMinimos", valor)}
                disabled={i === 0}
              />
              <Campo
                id={`nivel-descuento-${fila.id}`}
                etiqueta="Descuento en cada compra (%)"
                valor={fila.descuentoPct}
                onCambio={(valor) => cambiar(fila.id, "descuentoPct", valor)}
              />
              <CampoTexto
                id={`nivel-beneficio-${fila.id}`}
                etiqueta={`Descuento y obsequio que ve el cliente (máx. ${MAX_BENEFICIO})`}
                valor={fila.beneficio}
                onCambio={(valor) => cambiar(fila.id, "beneficio", valor)}
                filas={2}
              />
            </TarjetaNivel>
          ))}
        </RejillaNiveles>
      </Tarjeta>

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
          tono={TONO[estadoEjemplo.nivel.id]}
        />
      </Tarjeta>
    </>
  );
}
