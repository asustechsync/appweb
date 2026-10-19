import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { type AlmacenArchivos, AlmacenSupabase } from "@appweb/core/puertos";

import { entorno } from "./entorno";

/**
 * Desarrollo sin Supabase: guarda en apps/web/public/subidas, que la tienda
 * sirve tal cual en `npm run dev`. La URL queda relativa ("/subidas/..."), asi
 * que solo vale en local: en produccion la carpeta public se fija al compilar
 * y lo subido despues no se serviria.
 */
class AlmacenDisco implements AlmacenArchivos {
  readonly nombre = "Disco local (solo desarrollo)";

  // El proceso corre en apps/admin (o apps/web); public de la tienda esta al lado.
  private readonly raiz = path.resolve(process.cwd(), "../web/public");

  async subir(ruta: string, contenido: Uint8Array<ArrayBuffer>): Promise<{ url: string }> {
    const destino = path.join(this.raiz, "subidas", ruta);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, contenido);
    return { url: `/subidas/${ruta}` };
  }

  async borrar(url: string): Promise<void> {
    if (!url.startsWith("/subidas/")) return;
    await rm(path.join(this.raiz, url), { force: true });
  }
}

/** En produccion sin configurar: falla con un mensaje que dice que falta. */
class AlmacenSinConfigurar implements AlmacenArchivos {
  readonly nombre = "Sin configurar";

  async subir(): Promise<{ url: string }> {
    throw new Error(
      "Falta configurar el almacén de fotos: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  async borrar(): Promise<void> {}
}

function crearAlmacen(): AlmacenArchivos {
  const e = entorno();
  const url = e.SUPABASE_URL?.replace(/\/+$/, "");
  const clave = e.SUPABASE_SERVICE_ROLE_KEY;
  if (url && clave) {
    return new AlmacenSupabase({ url, clave, bucket: e.SUPABASE_BUCKET ?? "productos" });
  }
  return e.produccion ? new AlmacenSinConfigurar() : new AlmacenDisco();
}

/** Instancia unica, como `correo`. Cambiar de proveedor es cambiar `crearAlmacen`. */
export const almacen: AlmacenArchivos = crearAlmacen();
