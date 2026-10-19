/**
 * Corre una vez al arrancar el servidor del panel: revisa las variables de
 * entorno antes de atender a nadie (ver @appweb/api/entorno).
 */
export async function register() {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const { revisarEntorno } = await import("@appweb/api/entorno");
    revisarEntorno("panel");
  }
}
