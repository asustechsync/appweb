export type Tema = "claro" | "oscuro";

export const TEMA_LLAVE = "appweb:tema";

/**
 * Guion anti-parpadeo. Corre sincrono en <head>, ANTES del primer pintado, asi
 * que el usuario nunca ve el tema claro un instante antes del oscuro.
 *
 * Va inline a proposito: un archivo externo llegaria tarde.
 */
export const GUION_TEMA = `(function(){try{
var t=localStorage.getItem("${TEMA_LLAVE}");
if(t==="claro"||t==="oscuro"){document.documentElement.dataset.tema=t}
}catch(e){}})();`;
