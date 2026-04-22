import { format as dfFormat, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NUM = new Intl.NumberFormat("pt-BR");

export function fmtBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return BRL.format(value);
}

export function fmtNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return NUM.format(value);
}

export function fmtDate(
  value: string | Date | null | undefined,
  pattern = "dd/MM/yyyy",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return dfFormat(date, pattern, { locale: ptBR });
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  return fmtDate(value, "dd/MM/yyyy HH:mm");
}

export function fmtMonth(value: string | Date | null | undefined): string {
  return fmtDate(value, "MMM/yyyy");
}
