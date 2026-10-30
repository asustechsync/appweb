import "./logo-banco.css";

export type BancoTransferencia =
  | "BCP"
  | "INTERBANK"
  | "BBVA"
  | "SCOTIABANK"
  | "BANCO_NACION"
  | "OTRO";

const MARCAS: Record<BancoTransferencia, { texto: string; nombre: string }> = {
  BCP: { texto: "BCP", nombre: "BCP" },
  INTERBANK: { texto: "IBK", nombre: "Interbank" },
  BBVA: { texto: "BBVA", nombre: "BBVA" },
  SCOTIABANK: { texto: "S", nombre: "Scotiabank" },
  BANCO_NACION: { texto: "BN", nombre: "Banco de la Nación" },
  OTRO: { texto: "···", nombre: "Otro banco" },
};

/** Distintivo compacto del banco elegido para una transferencia. */
export function LogoBanco({ banco }: { banco: BancoTransferencia }) {
  const marca = MARCAS[banco];
  return (
    <span
      className={`ui-logo-medio-pago ui-logo-banco ui-logo-banco--${banco.toLowerCase()}`}
      role="img"
      aria-label={marca.nombre}
      title={marca.nombre}
    >
      {marca.texto}
    </span>
  );
}
