import Link from "next/link";

import { Alerta, DisposicionAcceso } from "@appweb/ui";

import { FormularioNuevaClave } from "./FormularioNuevaClave";

export const metadata = { title: "Nueva contraseña" };

// El token llega por la URL: la pagina no se puede pre-generar.
export const instant = false;

interface Props {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Destino del enlace del correo. Si el enlace vino sin token, se dice de una
 * vez; si el token vencio, lo dice la accion al guardar (validarlo aqui
 * obligaria a leer la base solo para pintar el formulario).
 */
export default async function PaginaNuevaClave({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <DisposicionAcceso
        titulo="Enlace incompleto"
        pie={<Link href="/recuperar-clave">Pedir otro enlace</Link>}
      >
        <Alerta tono="error" centrada>
          Abre el enlace completo que te llegó por correo, o pide uno nuevo.
        </Alerta>
      </DisposicionAcceso>
    );
  }

  return <FormularioNuevaClave token={token} />;
}
