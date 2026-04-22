"use client";

import * as React from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { FilterBar } from "@/components/documentos/FilterBar";
import { DocumentosTable } from "@/components/documentos/DocumentosTable";
import { useDocumentos, type DocumentosFilter } from "@/hooks/useDocumentos";
import { fmtBRL } from "@/lib/format";
import { getPayWeekRange, fmtWeekLabel } from "@/lib/weeks";

export function DashboardClient() {
  const [filter, setFilter] = React.useState<DocumentosFilter>({
    excluirFaturaCartao: false,
  });
  const { rows, loading } = useDocumentos(filter);

  const stats = React.useMemo(() => {
    const hoje = new Date();
    const em7 = addDays(hoje, 7);
    const semana = getPayWeekRange(hoje);

    let vencidoValor = 0;
    let vencidoCount = 0;
    let em7Valor = 0;
    let em7Count = 0;
    let semanaValor = 0;
    let semanaCount = 0;
    let pendenteTotal = 0;

    for (const r of rows) {
      pendenteTotal += Number(r.valor_pendente ?? 0);
      if (r.is_overdue) {
        vencidoValor += Number(r.valor_pendente ?? 0);
        vencidoCount += 1;
      }
      if (r.proximo_vencimento) {
        const d = parseISO(r.proximo_vencimento);
        if (d >= hoje && d <= em7) {
          em7Valor += Number(r.valor_pendente ?? 0);
          em7Count += 1;
        }
        if (
          isWithinInterval(d, { start: semana.inicio, end: semana.fim })
        ) {
          semanaValor += Number(r.valor_pendente ?? 0);
          semanaCount += 1;
        }
      }
    }

    return {
      vencidoValor,
      vencidoCount,
      em7Valor,
      em7Count,
      semanaValor,
      semanaCount,
      pendenteTotal,
      semanaLabel: fmtWeekLabel(semana.inicio, semana.fim),
    };
  }, [rows]);

  const chartData = React.useMemo(() => {
    const hoje = new Date();
    const slots = Array.from({ length: 14 }).map((_, i) => {
      const d = addDays(hoje, i);
      return {
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "dd/MM"),
        iso: d,
        valor: 0,
        vencidos: 0,
      };
    });
    const byKey = new Map(slots.map((s) => [s.key, s]));
    for (const r of rows) {
      if (!r.proximo_vencimento) continue;
      const key = r.proximo_vencimento.slice(0, 10);
      const slot = byKey.get(key);
      if (!slot) continue;
      slot.valor += Number(r.valor_pendente ?? 0);
      if (r.is_overdue) slot.vencidos += Number(r.valor_pendente ?? 0);
    }
    return slots;
  }, [rows]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">
          Visão consolidada dos documentos a vencer.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pendente total"
          value={fmtBRL(stats.pendenteTotal)}
          hint={`${rows.length} documentos`}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Vencidos"
          value={fmtBRL(stats.vencidoValor)}
          hint={`${stats.vencidoCount} documento(s)`}
          tone="danger"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Vence em 7 dias"
          value={fmtBRL(stats.em7Valor)}
          hint={`${stats.em7Count} documento(s)`}
          tone="warning"
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <StatCard
          label="Semana atual"
          value={fmtBRL(stats.semanaValor)}
          hint={`${stats.semanaLabel} · ${stats.semanaCount}`}
          tone="primary"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      <div className="rounded-lg bg-surface-1 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">
              Pendências nos próximos 14 dias
            </h2>
            <p className="text-xs text-ink-muted">
              Valores agrupados por data de vencimento.
            </p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(154,167,191,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
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
                cursor={{ fill: "rgba(249,115,22,0.08)" }}
                contentStyle={{
                  background: "#18253f",
                  border: "none",
                  borderRadius: 8,
                  color: "#eef2f8",
                  boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)",
                }}
                formatter={(v: number) => fmtBRL(v)}
                labelFormatter={(l) => `Vencimento ${l}`}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.vencidos > 0 ? "#ef4444" : "#f97316"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <FilterBar value={filter} onChange={setFilter} />
        <DocumentosTable rows={rows} loading={loading} />
      </div>
    </div>
  );
}
