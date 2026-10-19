"use client";

import { useState } from "react";
import Link from "next/link";

import {
  DESCRIPCION_TIPO_RECLAMO,
  ETIQUETA_TIPO_DOCUMENTO,
  ETIQUETAS_TIPO_BIEN,
  ETIQUETAS_TIPO_RECLAMO,
  TIPOS_BIEN,
  TIPOS_DOCUMENTO,
  TIPOS_RECLAMO,
  type TipoBien,
  type TipoDocumento,
  type TipoReclamo,
} from "@appweb/core";
import {
  Alerta,
  BloqueFormulario,
  Boton,
  Campo,
  CampoSelect,
  CampoTexto,
  Casilla,
  FilaCampos,
  Formulario,
  GrupoOpciones,
  TarjetaSeleccionable,
} from "@appweb/ui";

import { registrarReclamo, type ResultadoReclamo } from "./acciones";
import { FECHA_LARGA } from "@appweb/core/formato";

const OPCIONES_DOCUMENTO = TIPOS_DOCUMENTO.map((tipo) => ({
  valor: tipo,
  etiqueta: ETIQUETA_TIPO_DOCUMENTO[tipo],
}));
const OPCIONES_BIEN = TIPOS_BIEN.map((tipo) => ({
  valor: tipo,
  etiqueta: ETIQUETAS_TIPO_BIEN[tipo],
}));

/**
 * Hoja de reclamacion virtual. La validacion es la de `esquemaReclamo`, la
 * misma que corre en el servidor: aqui solo se pintan los errores junto a cada
 * campo. El numero de hoja lo asigna la base al guardar.
 */
export function FormularioReclamo() {
  const [tipo, setTipo] = useState<TipoReclamo>("RECLAMO");
  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [menorDeEdad, setMenorDeEdad] = useState(false);
  const [apoderado, setApoderado] = useState("");
  const [tipoBien, setTipoBien] = useState<TipoBien>("PRODUCTO");
  const [pedidoCodigo, setPedidoCodigo] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcionBien, setDescripcionBien] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedido, setPedido] = useState("");
  const [acepta, setAcepta] = useState(false);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState<Extract<ResultadoReclamo, { ok: true }> | null>(
    null,
  );

  function errorDe(campo: string): string | null {
    return errores[campo] ?? null;
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const montoLimpio = monto.trim().replace(",", ".");
    if (montoLimpio !== "" && Number.isNaN(Number(montoLimpio))) {
      setErrores({ monto: "Escribe el monto en números, por ejemplo 59.90" });
      return;
    }

    setEnviando(true);
    setError(null);
    let resultado: ResultadoReclamo;
    try {
      resultado = await registrarReclamo({
        tipo,
        nombre,
        tipoDocumento,
        numeroDocumento,
        domicilio,
        telefono,
        email,
        menorDeEdad,
        apoderado: menorDeEdad ? apoderado : undefined,
        tipoBien,
        pedidoCodigo: pedidoCodigo.trim() || undefined,
        monto: montoLimpio === "" ? undefined : Number(montoLimpio),
        descripcionBien,
        detalle,
        pedido,
        acepta,
      });
    } catch {
      // Caida del servidor o de la red: lo escrito se queda en el formulario.
      resultado = { ok: false, error: "No pudimos registrar tu hoja. Inténtalo de nuevo." };
    }
    setEnviando(false);

    if (!resultado.ok) {
      setErrores(resultado.campos ?? {});
      setError(resultado.error);
      return;
    }
    setErrores({});
    setRegistrado(resultado);
    window.scrollTo(0, 0);
  }

  if (registrado) {
    return (
      <Alerta tono="exito">
        <strong>Registramos tu hoja N.° {registrado.codigo}</strong> el{" "}
        {FECHA_LARGA.format(new Date(registrado.creadoEn))}. Te enviamos una copia a{" "}
        {registrado.email} y te responderemos a ese correo a más tardar el{" "}
        {FECHA_LARGA.format(new Date(registrado.vence))}.
      </Alerta>
    );
  }

  return (
    <Formulario onSubmit={enviar} ancho="completo">
      <BloqueFormulario titulo="1. Tipo">
        <GrupoOpciones etiqueta="¿Es un reclamo o una queja?" columnas={2}>
          {TIPOS_RECLAMO.map((opcion) => (
            <TarjetaSeleccionable
              key={opcion}
              name="tipo"
              value={opcion}
              checked={tipo === opcion}
              onChange={() => setTipo(opcion)}
            >
              <strong>{ETIQUETAS_TIPO_RECLAMO[opcion]}</strong>
              <span>{DESCRIPCION_TIPO_RECLAMO[opcion]}</span>
            </TarjetaSeleccionable>
          ))}
        </GrupoOpciones>
      </BloqueFormulario>

      <BloqueFormulario titulo="2. Tus datos">
        <Campo
          id="nombre"
          etiqueta="Nombre completo"
          valor={nombre}
          onCambio={setNombre}
          error={errorDe("nombre")}
          autoComplete="name"
          requerido
        />
        <FilaCampos>
          <CampoSelect
            id="tipoDocumento"
            etiqueta="Tipo de documento"
            valor={tipoDocumento}
            opciones={OPCIONES_DOCUMENTO}
            onCambio={(valor) => setTipoDocumento(valor as TipoDocumento)}
          />
          <Campo
            id="numeroDocumento"
            etiqueta="Número de documento"
            valor={numeroDocumento}
            onCambio={setNumeroDocumento}
            error={errorDe("numeroDocumento")}
            requerido
          />
        </FilaCampos>
        <Campo
          id="domicilio"
          etiqueta="Domicilio"
          valor={domicilio}
          onCambio={setDomicilio}
          error={errorDe("domicilio")}
          autoComplete="street-address"
          requerido
        />
        <FilaCampos>
          <Campo
            id="telefono"
            etiqueta="Teléfono"
            tipo="tel"
            valor={telefono}
            onCambio={setTelefono}
            error={errorDe("telefono")}
            autoComplete="tel"
            requerido
          />
          <Campo
            id="email"
            etiqueta="Correo"
            tipo="email"
            valor={email}
            onCambio={setEmail}
            error={errorDe("email")}
            autoComplete="email"
            requerido
          />
        </FilaCampos>
        <Casilla
          id="menorDeEdad"
          etiqueta="Soy menor de edad"
          marcada={menorDeEdad}
          onCambio={setMenorDeEdad}
        />
        {menorDeEdad ? (
          <Campo
            id="apoderado"
            etiqueta="Nombre del padre, madre o apoderado"
            valor={apoderado}
            onCambio={setApoderado}
            error={errorDe("apoderado")}
            requerido
          />
        ) : null}
      </BloqueFormulario>

      <BloqueFormulario titulo="3. Producto o servicio">
        <FilaCampos>
          <CampoSelect
            id="tipoBien"
            etiqueta="¿Sobre qué es?"
            valor={tipoBien}
            opciones={OPCIONES_BIEN}
            onCambio={(valor) => setTipoBien(valor as TipoBien)}
          />
          <Campo
            id="pedidoCodigo"
            etiqueta="N.° de pedido (si tienes)"
            valor={pedidoCodigo}
            onCambio={setPedidoCodigo}
            error={errorDe("pedidoCodigo")}
          />
        </FilaCampos>
        <Campo
          id="monto"
          etiqueta="Monto reclamado en S/ (opcional)"
          valor={monto}
          onCambio={setMonto}
          error={errorDe("monto")}
          placeholder="0.00"
        />
        <Campo
          id="descripcionBien"
          etiqueta="Descripción del producto o servicio"
          valor={descripcionBien}
          onCambio={setDescripcionBien}
          error={errorDe("descripcionBien")}
          placeholder="Ej.: pack de 3 boxers talla M, color negro"
          requerido
        />
      </BloqueFormulario>

      <BloqueFormulario titulo="4. Detalle">
        <CampoTexto
          id="detalle"
          etiqueta="¿Qué pasó?"
          valor={detalle}
          onCambio={setDetalle}
          error={errorDe("detalle")}
          filas={5}
          requerido
        />
        <CampoTexto
          id="pedido"
          etiqueta="¿Qué solución pides?"
          valor={pedido}
          onCambio={setPedido}
          error={errorDe("pedido")}
          filas={3}
          requerido
        />
      </BloqueFormulario>

      <Casilla
        id="acepta"
        etiqueta={
          <>
            Declaro que los datos son correctos y acepto la{" "}
            <Link href="/privacidad">Política de privacidad</Link>
          </>
        }
        marcada={acepta}
        onCambio={setAcepta}
        requerida
      />

      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Boton tipo="submit" anchoCompleto disabled={enviando || !acepta}>
        {enviando ? "Enviando…" : `Enviar ${ETIQUETAS_TIPO_RECLAMO[tipo].toLowerCase()}`}
      </Boton>
    </Formulario>
  );
}
