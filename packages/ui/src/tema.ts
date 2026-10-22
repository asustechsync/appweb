export type Tema = "claro" | "oscuro";

export const TEMA_LLAVE = "appweb:tema";

/**
 * `localStorage` es por origen (tienda :3000, panel :3001), asi que la
 * eleccion tambien se guarda en una cookie: las cookies no distinguen puerto.
 * En produccion con subdominios, definir `NEXT_PUBLIC_DOMINIO_COOKIES`
 * (p. ej. ".tutienda.com") para compartirla.
 */
export function escribirCookieTema(tema: Tema): void {
  const dominio = process.env["NEXT_PUBLIC_DOMINIO_COOKIES"];
  document.cookie = `${TEMA_LLAVE}=${tema}; path=/; max-age=31536000; samesite=lax${
    dominio ? `; domain=${dominio}` : ""
  }`;
}

/**
 * Guion anti-parpadeo. Corre sincrono en <head>, ANTES del primer pintado, asi
 * que el usuario nunca ve el tema claro un instante antes del oscuro.
 *
 * Va inline a proposito: un archivo externo llegaria tarde.
 */
export const GUION_TEMA = `(function(){try{
var t=null;
try{t=localStorage.getItem("${TEMA_LLAVE}")}catch(e){}
var c=document.cookie.match(/(?:^|; )${TEMA_LLAVE}=(claro|oscuro)/);
if(c)t=c[1];
if(t==="claro"||t==="oscuro"){document.documentElement.dataset.tema=t}
}catch(e){}})();`;
