"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { startOfMonth, format } from "date-fns";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { useContasPagas, type ContasPagasFilter } from "@/hooks/useContasPagas";
import { fmtBRL, fmtDate } from "@/lib/format";
import type { ContaPaga } from "@/types/domain";
import { NovoPagamentoModal } from "./NovoPagamentoModal";

export function ContasPagasClient() {
  const [filter, setFilter] = React.useState<ContasPagasFilter>({});
  const [modal, setModal] = React.useState(false);
  const { rows, loading } = useContasPagas(filter);

  const totalPago = rows.reduce((sum, r) => sum + Number(r.valor), 0);
  const porMes = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = format(startOfMonth(new Date(r.data_pagamento)), "yyyy-MM");
      map.set(k, (map.get(k) ?? 0) + Number(r.valor));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([mes, valor]) => ({ mes, valor }));
  }, [rows]);

  const columns: Column<ContaPaga>[] = [
    {
      key: "data_pagamento",
      header: "Data",
      sortable: true,
      sortAccessor: (r) => r.data_pagamento,
      accessor: (r) => fmtDate(r.data_pagamento),
      width: "120px",
    },
    {
      key: "fornecedor",
      header: "Fornecedor",
      sortable: true,
      sortAccessor: (r) => r.fornecedor_nome ?? "",
      accessor: (r) => (
        <div className="min-w-0">
          <p className="truncate">{r.fornecedor_nome ?? "—"}</p>
          {r.documento_numero && (
            <p className="text-xs text-ink-muted">#{r.documento_numero}</p>
          )}
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Categoria",
      accessor: (r) => r.categoria ?? <span className="text-ink-dim">—</span>,
      width: "140px",
    },
    {
      key: "origem",
      header: "Origem",
      accessor: (r) => (
        <Chip
          tone={
            r.origem === "bot"
              ? "primary"
              : r.origem === "web"
                ? "secondary"
                : r.origem === "extrato"
                  ? "warning"
                  : "neutral"
          }
        >
          {r.origem}
        </Chip>
      ),
      width: "110px",
    },
    {
      key: "valor",
      header: "Valor",
      align: "right",
      sortable: true,
      sortAccessor: (r) => Number(r.valor),
      accessor: (r) => (
        <span className="tabular-nums font-medium">
          {fmtBRL(Number(r.valor))}
        </span>
      ),
      width: "130px",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Contas pagas</h1>
          <p className="text-sm text-ink-muted mt-1">
            Todos os pagamentos realizados — vinculados ou avulsos.
          </p>
        </div>
        <Button onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" />
          Registrar pagamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total pago (filtro)"
          value={fmtBRL(totalPago)}
          hint={`${rows.length} registros`}
          tone="secondary"
        />
        <StatCard
          label="Avulsos"
          value={rows.filter((r) => r.is_avulso).length}
          hint="Sem documento vinculado"
        />
        <StatCard
          label="Via bot"
          value={rows.filter((r) => r.origem === "bot").length}
          tone="primary"
        />
        <StatCard
          label="Via extrato"
          value={rows.filter((r) => r.origem === "extrato").length}
          tone="warning"
        />
      </div>

      {porMes.length > 1 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Pagamentos por mês</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={porMes}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(154,167,191,0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "#9aa7bf", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9aa7bf", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#18253f",
                    border: "none",
                    borderRadius: 8,
                    color: "#eef2f8",
                  }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="rounded-lg bg-surface-1 p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Buscar..."
            value={filter.busca ?? ""}
            onChange={(e) => setFilter({ ...filter, busca: e.target.value })}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Input
          type="date"
          value={filter.dataInicio ?? ""}
          onChange={(e) =>
            setFilter({ ...filter, dataInicio: e.target.value || null })
          }
          className="w-44"
        />
        <Input
          type="date"
          value={filter.dataFim ?? ""}
          onChange={(e) =>
            setFilter({ ...filter, dataFim: e.target.value || null })
          }
          className="w-44"
        />
        <Select
          value={filter.origem ?? ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              origem: (e.target.value || null) as
                | "bot"
                | "web"
                | "extrato"
                | "manual"
                | null,
            })
          }
          className="w-40"
        >
          <option value="">Todas origens</option>
          <option value="bot">Bot</option>
          <option value="web">Web</option>
          <option value="extrato">Extrato</option>
          <option value="manual">Manual</option>
        </Select>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        empty="Nenhum pagamento registrado no período."
      />

      <NovoPagamentoModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
