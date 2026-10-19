import { ContenidoNoEncontrado } from "@/lib/no-encontrado";

/** Pedido que no existe o no es de quien lo pide. La cabecera ya la pone el layout. */
export default function PedidoNoEncontrado() {
  return (
    <ContenidoNoEncontrado texto="No encontramos ese pedido. Revisa tus pedidos en Mi cuenta." />
  );
}
