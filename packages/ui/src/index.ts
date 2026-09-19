export { tokens, tokensOscuro, type Tokens } from "./tokens";
export { GUION_TEMA, TEMA_LLAVE, type Tema } from "./tema";

// Primitivos. Las paginas importan de aqui y nunca escriben estilos propios.
// Se van añadiendo conforme hagan falta; cada uno con su CSS en
// src/componentes/estilos/, que consume las variables de theme.css.
export { Contenedor, type PropsContenedor } from "./componentes/Contenedor";
export { Logo, type PropsLogo } from "./componentes/Logo";
export { Buscador, type PropsBuscador } from "./componentes/Buscador";
export { AccionesCuenta, type PropsAccionesCuenta } from "./componentes/AccionesCuenta";
export { AlternarTema } from "./componentes/AlternarTema";
export { Cabecera, type PropsCabecera } from "./componentes/Cabecera";
export { Precio, type PropsPrecio } from "./componentes/Precio";
export { TarjetaProducto, type PropsTarjetaProducto } from "./componentes/TarjetaProducto";
export { RejillaProductos, type PropsRejillaProductos } from "./componentes/RejillaProductos";
export { CarruselProductos, type PropsCarruselProductos } from "./componentes/CarruselProductos";
