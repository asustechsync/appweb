export { tokens, tokensOscuro, type Tokens } from "./tokens";
export { GUION_TEMA, TEMA_LLAVE, type Tema } from "./tema";

// Iconos que las paginas necesitan pasar como prop (ej. NavegacionSecciones).
// El resto de los iconos son detalle interno de cada primitivo y no hace
// falta exponerlos aqui.
export {
  type PropsIcono,
  IconoEtiqueta,
  IconoPregunta,
  IconoMoneda,
  IconoMarca,
  IconoTicket,
  IconoCarrito,
  IconoMenu,
} from "./iconos";

// Primitivos. Las paginas importan de aqui y nunca escriben estilos propios.
// Se van añadiendo conforme hagan falta; cada uno con su CSS en
// src/componentes/estilos/, que consume las variables de theme.css.
export { Contenedor, type PropsContenedor } from "./componentes/Contenedor";
export { Logo, type PropsLogo } from "./componentes/Logo";
export { Header, type PropsHeader } from "./componentes/Header";
export { Ubicacion, type PropsUbicacion } from "./componentes/Ubicacion";
export { Buscador, type PropsBuscador } from "./componentes/Buscador";
export { AccionesCuenta, type PropsAccionesCuenta } from "./componentes/AccionesCuenta";
export { AlternarTema } from "./componentes/AlternarTema";
export {
  EscaparatePortada,
  type PropsEscaparatePortada,
} from "./componentes/EscaparatePortada";
export { Beneficio, type PropsBeneficio } from "./componentes/Beneficio";
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
export {
  LayoutProducto,
  type PropsLayoutProducto,
} from "./componentes/LayoutProducto";
export {
  PanelAcciones,
  type PropsPanelAcciones,
} from "./componentes/PanelAcciones";
export {
  InformacionGrid,
  type PropsInformacionGrid,
  type Dato,
} from "./componentes/InformacionGrid";

// Compra (Clase B): carrito y checkout.
export {
  DisposicionCompra,
  type PropsDisposicionCompra,
} from "./componentes/DisposicionCompra";
export {
  SelectorCantidad,
  type PropsSelectorCantidad,
} from "./componentes/SelectorCantidad";
export { LineaDeCarrito, type PropsLineaDeCarrito } from "./componentes/LineaDeCarrito";
export {
  ResumenCompra,
  type PropsResumenCompra,
  type MetodoEnvioElegible,
} from "./componentes/ResumenCompra";
export { EstadoVacio, type PropsEstadoVacio } from "./componentes/EstadoVacio";
export { Cargando, type PropsCargando } from "./componentes/Cargando";
export { Formulario, type PropsFormulario } from "./componentes/Formulario";
export { Campo, type PropsCampo } from "./componentes/Campo";
export { FilaCampos, type PropsFilaCampos } from "./componentes/FilaCampos";
export { SelectorPais, type PropsSelectorPais } from "./componentes/SelectorPais";
export { SelectorFecha, type PropsSelectorFecha } from "./componentes/SelectorFecha";
export { PAISES, type Pais } from "./datos/paises";
export { Boton, type PropsBoton } from "./componentes/Boton";
export { Alerta, type PropsAlerta } from "./componentes/Alerta";
export {
  TarjetaSeleccionable,
  type PropsTarjetaSeleccionable,
} from "./componentes/TarjetaSeleccionable";
export {
  SeccionCheckout,
  type PropsSeccionCheckout,
} from "./componentes/SeccionCheckout";
export {
  TarjetaPedido,
  type PropsTarjetaPedido,
  type ItemDePedido,
} from "./componentes/TarjetaPedido";

// Cuenta y panel (Clase C).
export {
  DisposicionCuenta,
  type PropsDisposicionCuenta,
  type SeccionDeCuenta,
} from "./componentes/DisposicionCuenta";
export {
  DisposicionPanel,
  type PropsDisposicionPanel,
  type SeccionDePanel,
} from "./componentes/DisposicionPanel";
export { Tarjeta, type PropsTarjeta } from "./componentes/Tarjeta";
export { TarjetaInfo, type PropsTarjetaInfo } from "./componentes/TarjetaInfo";
export { FilaTarjetas, type PropsFilaTarjetas } from "./componentes/FilaTarjetas";
export { TarjetaMetrica, type PropsTarjetaMetrica } from "./componentes/TarjetaMetrica";
export { RejillaMetricas, type PropsRejillaMetricas } from "./componentes/RejillaMetricas";
export { FilaLista, type PropsFilaLista } from "./componentes/FilaLista";
export { Insignia, type PropsInsignia } from "./componentes/Insignia";
export {
  CampoSelect,
  type PropsCampoSelect,
  type OpcionDeSelect,
} from "./componentes/CampoSelect";
export {
  SelectorBuscable,
  type PropsSelectorBuscable,
  type OpcionDeSelectorBuscable,
} from "./componentes/SelectorBuscable";
export {
  CampoSelectorLista,
  type PropsCampoSelectorLista,
} from "./componentes/CampoSelectorLista";
export {
  SelectorLista,
  type PropsSelectorLista,
  type OpcionDeSelectorLista,
} from "./componentes/SelectorLista";
