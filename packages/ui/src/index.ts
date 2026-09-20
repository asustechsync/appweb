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
export { SelectorUbicacion } from "./componentes/SelectorUbicacion";
export {
  NavegacionSecciones,
  type PropsNavegacionSecciones,
  type SeccionDeNavegacion,
} from "./componentes/NavegacionSecciones";
export {
  ItemDesplegable,
  type PropsItemDesplegable,
  type EnlaceDeDesplegable,
} from "./componentes/ItemDesplegable";
export { Hero, type PropsHero, type DiapositivaHero } from "./componentes/Hero";
export { CabeceraSeccion, type PropsCabeceraSeccion } from "./componentes/CabeceraSeccion";
export { Precio, type PropsPrecio } from "./componentes/Precio";
export { TarjetaProducto, type PropsTarjetaProducto } from "./componentes/TarjetaProducto";
export { TarjetaMarca, type PropsTarjetaMarca } from "./componentes/TarjetaMarca";
export { BannerOferta, type PropsBannerOferta } from "./componentes/BannerOferta";
export { BannerPromo, type PropsBannerPromo } from "./componentes/BannerPromo";
export { RejillaProductos, type PropsRejillaProductos } from "./componentes/RejillaProductos";
export { Carrusel, type PropsCarrusel } from "./componentes/Carrusel";
// Alias temporal para compatibilidad
export { Carrusel as CarruselProductos, type PropsCarrusel as PropsCarruselProductos } from "./componentes/Carrusel";
export { GaleriaProducto, type PropsGaleriaProducto, type ImagenGaleria } from "./componentes/GaleriaProducto";
export {
  SelectorVariantes,
  type PropsSelectorVariantes,
  type OpcionDeCompra,
} from "./componentes/SelectorVariantes";
export { FichaProducto, type PropsFichaProducto } from "./componentes/FichaProducto";
export {
  PaginaInformativa,
  type PropsPaginaInformativa,
} from "./componentes/PaginaInformativa";
