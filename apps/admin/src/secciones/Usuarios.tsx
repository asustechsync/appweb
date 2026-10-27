"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { estaAnonimizada, ROLES, type Rol } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelect,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  FilaPedido,
  Formulario,
  IconoBuscar,
  IconoEscudo,
  IconoUsuario,
  LimpiarFiltros,
  ListaConLateral,
  LogoIcono,
  Paginador,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";

import { CuadrosUsuario, estadoDeCuenta } from "./CuadrosUsuario";
import { DetalleUsuario } from "./DetalleUsuario";
import { FECHA, diaDeLima, mensajeDeFallo } from "@appweb/core/formato";

const ETIQUETA_ROL: Record<Rol, string> = {
  CLIENTE: "Cliente",
  VENDEDOR: "Vendedor",
  ALMACEN: "Almacén",
  ADMIN: "Administrador",
};

const OPCIONES_ROL = ROLES.map((rol) => ({
  valor: rol,
  etiqueta: ETIQUETA_ROL[rol],
}));

/** El filtro de la lista: en clientes, si estan activos; en el equipo, ademas el rol. */
type FiltroUsuarios = "TODOS" | "ACTIVOS" | "DESACTIVADOS" | Rol;

const FILTROS: Record<"clientes" | "equipo", { id: FiltroUsuarios; etiqueta: string }[]> = {
  clientes: [
    { id: "TODOS", etiqueta: "Todos los clientes" },
    { id: "ACTIVOS", etiqueta: "Activos" },
    { id: "DESACTIVADOS", etiqueta: "Desactivados" },
  ],
  equipo: [
    { id: "TODOS", etiqueta: "Todo el equipo" },
    { id: "ADMIN", etiqueta: "Administradores" },
    { id: "VENDEDOR", etiqueta: "Vendedores" },
    { id: "ALMACEN", etiqueta: "Almacén" },
    { id: "DESACTIVADOS", etiqueta: "Desactivados" },
  ],
};

function cumpleFiltro(usuario: { rol: string; activo: boolean }, filtro: FiltroUsuarios): boolean {
  if (filtro === "TODOS") return true;
  if (filtro === "ACTIVOS") return usuario.activo;
  if (filtro === "DESACTIVADOS") return !usuario.activo;
  return usuario.rol === filtro;
}

/** Los dias que cubre el minigrafico de altas. */
const DIAS_ALTAS = 30;

/** Cuantas cuentas se ven por pagina. */
const PAGINA = 10;

/**
 * Cuentas del panel, en dos secciones: "clientes" (rol CLIENTE, se registran
 * solos) y "equipo" (el resto, que se crea aqui con su rol). Si a alguien le
 * cambian el rol, pasa de una lista a la otra.
 *
 * Ninguna regla se decide aqui — quien puede cambiar que lo resuelve
 * @appweb/api con `exige("gestionar_usuarios")` y @appweb/core con
 * `revisarCambioRol`. Esta pantalla solo muestra el mensaje que le devuelven.
 */
export function Usuarios({
  usuarioIdActual,
  alcance,
}: {
  usuarioIdActual: string;
  alcance: "clientes" | "equipo";
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroUsuarios>("TODOS");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rolNuevo, setRolNuevo] = useState<string>("VENDEDOR");

  const lista = useQuery(trpc.panel.usuarios.listar.queryOptions());

  const delAlcance = useMemo(
    () =>
      (lista.data ?? []).filter(
        (usuario) => (usuario.rol === "CLIENTE") === (alcance === "clientes"),
      ),
    [lista.data, alcance],
  );

  /** El filtro es local: la lista ya esta en la cache y escribir no debe
      provocar una consulta por tecla. */
  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return delAlcance.filter(
      (usuario) =>
        cumpleFiltro(usuario, filtro) &&
        (termino === "" ||
          usuario.nombre.toLowerCase().includes(termino) ||
          usuario.email.toLowerCase().includes(termino)),
    );
  }, [busqueda, filtro, delAlcance]);
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA),
    [coinciden, paginaActual],
  );

  const cifras = useMemo(() => cifrasDeCuentas(delAlcance), [delAlcance]);

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((u) => u.id === elegido) ?? visibles[0] ?? null;

  // Precarga la ficha de los que se ven: al elegir uno, ya esta en cache.
  useEffect(() => {
    if (!escritorio) return;
    for (const usuario of visibles) {
      void queryClient.prefetchQuery(
        trpc.panel.usuarios.detalle.queryOptions({ usuarioId: usuario.id }),
      );
    }
  }, [escritorio, visibles, queryClient, trpc]);

  function refrescar() {
    void queryClient.invalidateQueries(trpc.panel.usuarios.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const crear = useMutation(
    trpc.panel.usuarios.crear.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`Cuenta creada para ${usuario.email}.`);
        setNombre("");
        setEmail("");
        setClave("");
        setTelefono("");
        setRolNuevo("VENDEDOR");
        setCreando(false);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const cambiarRol = useMutation(
    trpc.panel.usuarios.cambiarRol.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`${usuario.nombre} ahora es ${ETIQUETA_ROL[usuario.rol as Rol]}.`);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const cambiarActivo = useMutation(
    trpc.panel.usuarios.cambiarActivo.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`${usuario.nombre} quedó ${usuario.activo ? "activo" : "desactivado"}.`);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const trabajando = crear.isPending || cambiarRol.isPending || cambiarActivo.isPending;

  if (abierto !== null) {
    return (
      <DetalleUsuario
        usuarioId={abierto}
        usuarioIdActual={usuarioIdActual}
        etiquetaRol={(rol) => ETIQUETA_ROL[rol as Rol] ?? rol}
        onVolver={() => setAbierto(null)}
      />
    );
  }

  const conteo = (id: FiltroUsuarios) => delAlcance.filter((u) => cumpleFiltro(u, id)).length;
  const opciones = FILTROS[alcance].map((f) => {
    const cantidad = f.id === "TODOS" ? 0 : conteo(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const sustantivo = alcance === "clientes" ? "clientes" : "cuentas";

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Tarjeta
        titulo={alcance === "clientes" ? "Clientes" : "Equipo"}
        sinMarco
        {...(alcance === "equipo"
          ? {
              acciones: (
                <Boton variante="secundario" onClick={() => setCreando((valor) => !valor)}>
                  {creando ? "Cancelar" : "+ Nueva cuenta"}
                </Boton>
              ),
            }
          : {})}
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta={alcance === "clientes" ? "Clientes" : "Cuentas"}
            valor={String(cifras.total)}
            contexto={`${cifras.activas} activas`}
          />
          <TarjetaMetrica
            etiqueta={`Nuevas en ${DIAS_ALTAS} días`}
            valor={String(cifras.nuevas)}
            serie={cifras.serieAltas}
            contexto={cifras.nuevas === 1 ? "1 cuenta creada" : `${cifras.nuevas} cuentas creadas`}
          />
          {alcance === "equipo" ? (
            <TarjetaMetrica
              etiqueta="Administradores"
              valor={String(cifras.administradores)}
              contexto="Con acceso a todo el panel"
            />
          ) : (
            <TarjetaMetrica
              etiqueta="Activas"
              valor={String(cifras.activas)}
              contexto="Pueden comprar en la tienda"
            />
          )}
          <TarjetaMetrica
            etiqueta="Desactivadas"
            valor={String(cifras.desactivadas)}
            contexto={cifras.desactivadas === 0 ? "Ninguna bloqueada" : "No pueden entrar"}
          />
        </RejillaMetricas>
      </Tarjeta>

      {alcance === "equipo" && creando ? (
        <Tarjeta titulo="Crear cuenta">
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              crear.mutate({
                nombre,
                email,
                clave,
                rol: rolNuevo as Rol,
                ...(telefono.trim() === "" ? {} : { telefono }),
              });
            }}
          >
            <p>
              Las cuentas del equipo se crean aquí con su rol. El público se registra por su cuenta
              como cliente.
            </p>
            <Campo
              id="nuevo-nombre"
              etiqueta="Nombre"
              valor={nombre}
              onCambio={setNombre}
              requerido
            />
            <Campo
              id="nuevo-email"
              etiqueta="Correo"
              tipo="email"
              valor={email}
              onCambio={setEmail}
              requerido
            />
            <Campo
              id="nueva-clave"
              etiqueta="Clave"
              tipo="password"
              valor={clave}
              onCambio={setClave}
              placeholder="Mínimo 8 caracteres"
              requerido
            />
            <Campo
              id="nuevo-telefono"
              etiqueta="Teléfono (opcional)"
              tipo="tel"
              bandera="pe"
              prefijo="+51"
              valor={telefono}
              onCambio={setTelefono}
              placeholder="9XXXXXXXX"
            />
            <CampoSelect
              id="nuevo-rol"
              etiqueta="Rol"
              valor={rolNuevo}
              opciones={OPCIONES_ROL}
              onCambio={setRolNuevo}
            />
            <Boton tipo="submit" disabled={crear.isPending}>
              {crear.isPending ? "Creando…" : "Crear cuenta"}
            </Boton>
          </Formulario>
        </Tarjeta>
      ) : null}

      <ListaConLateral
        filasPorPagina={PAGINA}
        barra={
          <BarraLista
            juntos
            buscador={
              <Campo
                id={`busqueda-${alcance}`}
                etiqueta="Buscar por nombre o correo"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Nombre o correo"
              />
            }
          >
            <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id={`filtro-${alcance}`}
              ancho="amplio"
              etiqueta={alcance === "clientes" ? "Estado de la cuenta" : "Rol o estado"}
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as FiltroUsuarios);
                setPagina(1);
              }}
            />
            {filtro !== "TODOS" || busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
                  setFiltro("TODOS");
                  setBusqueda("");
                  setPagina(1);
                }}
              />
            ) : null}
          </BarraLista>
        }
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionado
              ? {}
              : { vacio: "Elige una cuenta de la lista para ver su resumen." })}
          >
            {seleccionado ? (
              <CuadrosUsuario
                usuarioId={seleccionado.id}
                usuarioIdActual={usuarioIdActual}
                alcance={alcance}
                etiquetaRol={(rol) => ETIQUETA_ROL[rol]}
                opcionesRol={OPCIONES_ROL}
                trabajando={trabajando}
                onAbrir={() => setAbierto(seleccionado.id)}
                onCambiarActivo={(activo) =>
                  cambiarActivo.mutate({ usuarioId: seleccionado.id, activo })
                }
                onCambiarRol={(rol) => cambiarRol.mutate({ usuarioId: seleccionado.id, rol })}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando cuentas…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              texto={
                busqueda.trim() === "" && filtro === "TODOS"
                  ? `Todavía no hay ${sustantivo} aquí.`
                  : `Ningún resultado coincide con esa búsqueda o ese filtro.`
              }
            />
          ) : (
            <div>
              {visibles.map((usuario) => {
                const esUnoMismo = usuario.id === usuarioIdActual;
                const anonimizada = estaAnonimizada(usuario.email);
                return (
                  <FilaPedido
                    key={usuario.id}
                    logo={
                      <LogoIcono
                        icono={
                          alcance === "equipo" ? (
                            <IconoEscudo tamano={16} />
                          ) : (
                            <IconoUsuario tamano={16} />
                          )
                        }
                        nombre={usuario.nombre}
                      />
                    }
                    titulo={`${usuario.nombre}${esUnoMismo ? " (tú)" : ""}`}
                    {...(alcance === "equipo" ? { detalle: ETIQUETA_ROL[usuario.rol as Rol] } : {})}
                    contenido={anonimizada ? "Datos eliminados" : usuario.email}
                    centro={[FECHA.format(new Date(usuario.creadoEn)), "Cuenta creada"]}
                    estado={estadoDeCuenta({ activo: usuario.activo, anonimizada })}
                    seleccionada={escritorio && seleccionado?.id === usuario.id}
                    onAbrir={() => (escritorio ? setElegido(usuario.id) : setAbierto(usuario.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} cuenta de ${usuario.nombre}`}
                  />
                );
              })}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}

/** Las cifras de arriba, contadas sobre la lista que ya trae la cache. */
function cifrasDeCuentas(cuentas: { rol: string; activo: boolean; creadoEn: Date | string }[]) {
  const ahora = Date.now();
  const dias = Array.from({ length: DIAS_ALTAS }, (_, i) =>
    diaDeLima(new Date(ahora - (DIAS_ALTAS - 1 - i) * 86_400_000)),
  );
  const serieAltas = dias.map(() => 0);
  for (const cuenta of cuentas) {
    const indice = dias.indexOf(diaDeLima(new Date(cuenta.creadoEn)));
    if (indice >= 0) serieAltas[indice] = (serieAltas[indice] ?? 0) + 1;
  }
  const activas = cuentas.filter((c) => c.activo).length;
  return {
    total: cuentas.length,
    activas,
    desactivadas: cuentas.length - activas,
    administradores: cuentas.filter((c) => c.rol === "ADMIN" && c.activo).length,
    nuevas: serieAltas.reduce((suma, n) => suma + n, 0),
    serieAltas,
  };
}
