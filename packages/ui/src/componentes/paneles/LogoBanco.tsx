import "./logo-banco.css";
import {
  IconoBancoNacion,
  IconoBbva,
  IconoBcp,
  IconoInterbank,
  IconoScotiabank,
} from "../../iconos";

export type BancoTransferencia =
  | "BCP"
  | "INTERBANK"
  | "BBVA"
  | "SCOTIABANK"
  | "BANCO_NACION"
  | "OTRO";

const MARCAS: Record<
  BancoTransferencia,
  { nombre: string; icono: typeof IconoBcp | null }
> = {
  BCP: { nombre: "BCP", icono: IconoBcp },
  INTERBANK: { nombre: "Interbank", icono: IconoInterbank },
  BBVA: { nombre: "BBVA", icono: IconoBbva },
  SCOTIABANK: { nombre: "Scotiabank", icono: IconoScotiabank },
  BANCO_NACION: { nombre: "Banco de la Nación", icono: IconoBancoNacion },
  OTRO: { nombre: "Otro banco", icono: null },
};

/** Distintivo compacto del banco elegido para una transferencia. */
export function LogoBanco({ banco }: { banco: BancoTransferencia }) {
  const marca = MARCAS[banco];
  const Icono = marca.icono;
  return (
    <span
      className={`ui-logo-medio-pago ui-logo-banco ui-logo-banco--${banco.toLowerCase()}`}
      role="img"
      aria-label={marca.nombre}
      title={marca.nombre}
    >
      {Icono ? <Icono className="ui-logo-banco__icono" /> : "···"}
    </span>
  );
}
