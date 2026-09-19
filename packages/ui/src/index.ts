export { tokens, tokensOscuro, type Tokens } from "./tokens";
export { GUION_TEMA, TEMA_LLAVE, type Tema } from "./tema";

// Primitivos. Las paginas importan de aqui y nunca escriben estilos propios.
// Se van añadiendo conforme hagan falta; cada uno con su CSS en
// src/componentes/estilos/, que consume las variables de theme.css.
export { Logo, type PropsLogo } from "./componentes/Logo";
export { Buscador, type PropsBuscador } from "./componentes/Buscador";
export { Cabecera, type PropsCabecera } from "./componentes/Cabecera";
