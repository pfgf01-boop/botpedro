"use client";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "./StatusBadge";
import { fmtBRL, fmtDate } from "@/lib/format";
import {
  TIPO_DOCUMENTO_LABEL,
  type DashboardDocumento,
} from "@/types/domain";
import { Chip } from "@/components/ui/Chip";

interface DocumentosTableProps {
  rows: DashboardDocumento[];
  loading?: boolean;
  onRowClick?: (row: DashboardDocumento) => void;
  showTipo?: boolean;
}

export function DocumentosTable({
  rows,
  loading,
  onRowClick,
  showTipo = true,
}: DocumentosTableProps) {
  const columns: Column<DashboardDocumento>[] = [
    {
      key: "proximo_vencimento",
      header: "Vencimento",
      sortable: true,
      sortAccessor: (r) => r.proximo_vencimento ?? "9999-12-31",
      accessor: (r) => (
        <span className={r.is_overdue ? "text-danger-400 font-medium" : ""}>
          {fmtDate(r.proximo_vencimento)}
        </span>
      ),
      width: "130px",
    },
    {
      key: "fornecedor_nome",
      header: "Fornecedor",
      sortable: true,
      sortAccessor: (r) => r.fornecedor_nome ?? "",
      accessor: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.fornecedor_nome ?? "—"}</p>
          {r.numero && (
            <p className="text-xs text-ink-muted truncate">#{r.numero}</p>
          )}
        </div>
      ),
    },
    ...(showTipo
      ? [
          {
            key: "tipo",
            header: "Tipo",
            sortable: true,
            sortAccessor: (r: DashboardDocumento) => r.tipo,
            accessor: (r: DashboardDocumento) => (
              <Chip tone={r.is_fatura_cartao ? "primary" : "neutral"}>
                {TIPO_DOCUMENTO_LABEL[r.tipo]}
              </Chip>
            ),
            width: "140px",
          },
        ]
      : []),
    {
      key: "valor_total",
      header: "Valor",
      sortable: true,
      align: "right" as const,
      sortAccessor: (r) => r.valor_total ?? 0,
      accessor: (r) => (
        <span className="tabular-nums">{fmtBRL(r.valor_total)}</span>
      ),
      width: "130px",
    },
    {
      key: "valor_pendente",
      header: "Pendente",
      align: "right" as const,
      sortable: true,
      sortAccessor: (r) => r.valor_pendente,
      accessor: (r) => (
        <span className="tabular-nums text-ink-muted">
          {fmtBRL(r.valor_pendente)}
        </span>
      ),
      width: "130px",
    },
    {
      key: "parcelas",
      header: "Parcelas",
      align: "center" as const,
      accessor: (r) => (
        <span className="text-xs text-ink-muted">
          {r.parcelas_pagas}/{r.total_parcelas}
        </span>
      ),
      width: "90px",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusBadge doc={r} />,
      width: "110px",
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      loading={loading}
      onRowClick={onRowClick}
      empty="Nenhum documento encontrado com os filtros atuais."
    />
  );
}
