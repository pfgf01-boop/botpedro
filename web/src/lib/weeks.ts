import {
  addDays,
  endOfDay,
  format,
  getDay,
  startOfDay,
} from "date-fns";

// Semana de pagamento: sábado (0) → sexta (7 dias).
export function getPayWeekRange(ref: Date = new Date()): {
  inicio: Date;
  fim: Date;
} {
  // getDay: Sun=0 Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6
  const dow = getDay(ref);
  // diff para chegar ao sábado anterior (ou hoje, se for sábado)
  const diffSab = (dow - 6 + 7) % 7; // sábado -> 0, domingo -> 1, ..., sexta -> 6
  const inicio = startOfDay(addDays(ref, -diffSab));
  const fim = endOfDay(addDays(inicio, 6));
  return { inicio, fim };
}

export function getNextPayWeekRange(ref: Date = new Date()) {
  const cur = getPayWeekRange(ref);
  const inicio = addDays(cur.inicio, 7);
  const fim = endOfDay(addDays(inicio, 6));
  return { inicio, fim };
}

export function fmtWeekLabel(inicio: Date, fim: Date) {
  return `${format(inicio, "dd/MM")} a ${format(fim, "dd/MM")}`;
}
