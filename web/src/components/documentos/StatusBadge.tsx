import { Chip } from "@/components/ui/Chip";
import {
  computeStatus,
  STATUS_LABEL,
  type DashboardDocumento,
} from "@/types/domain";

export function StatusBadge({ doc }: { doc: DashboardDocumento }) {
  const status = computeStatus(doc);
  const tone =
    status === "vencido"
      ? "danger"
      : status === "pago"
        ? "secondary"
        : status === "parcial"
          ? "warning"
          : "neutral";
  return <Chip tone={tone}>{STATUS_LABEL[status]}</Chip>;
}
