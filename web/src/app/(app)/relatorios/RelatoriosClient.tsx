"use client";

import * as React from "react";
import { FileDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useDocumentos } from "@/hooks/useDocumentos";
import { useContasPagas } from "@/hooks/useContasPagas";
import { gerarPdfRelatorio } from "@/lib/pdf";
import { TIPO_DOCUMENTO_LABEL } from "@/types/domain";
import { fmtDate } from "@/lib/format";

type RelatorioTipo = "a_vencer" | "pagos" | "por_fornecedor";

const COLUNAS_DISPONIVEIS = {
  vencimento: "Vencimento",
  fornecedor: "Fornecedor",
  numero: "Número",
  tipo: "Tipo",
  valor_total: "Valor Total",
  valor_pago: "Valor Pago",
  valor_pendente: "Pendente",
  parcelas: "Parcelas",
  status: "Status",
} as const;

type ColKey = keyof typeof COLUNAS_DISPONIVEIS;

export function RelatoriosClient() {
  const [tipo, setTipo] = React.useState<RelatorioTipo>("a_vencer");
  const [dataInicio, setDataInicio] = React.useState("");
  const [dataFim, setDataFim] = React.useState("");
  const [colsSel, setColsSel] = React.useState<ColKey[]>([
    "vencimento",
    "fornecedor",
    "numero",
    "valor_total",
    "valor_pendente",
    "status",
  ]);

  const { rows: docs } = useDocumentos({
    dataInicio: dataInicio || null,
    dataFim: dataFim || null,
  });
  const { rows: pagos } = useContasPagas({
    dataInicio: dataInicio || null,
    dataFim: dataFim || null,
  });

  function toggleCol(k: ColKey) {
    setColsSel((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  function gerarVencer() {
    const colsMap: Record<
      ColKey,
      {
        header: string;
        value: (r: (typeof docs)[number]) => string | number;
        align?: "left" | "right" | "center";
      }
    > = {
      vencimento: {
        header: "Vencimento",
        value: (r) => fmtDate(r.proximo_vencimento),
      },
      fornecedor: {
        header: "Fornecedor",
        value: (r) => r.fornecedor_nome ?? "—",
      },
      numero: { header: "Número", value: (r) => r.numero ?? "—" },
      tipo: { header: "Tipo", value: (r) => TIPO_DOCUMENTO_LABEL[r.tipo] },
      valor_total: {
        header: "Valor",
        value: (r) => Number(r.valor_total ?? 0),
        align: "right",
      },
      valor_pago: {
        header: "Pago",
        value: (r) => Number(r.valor_pago ?? 0),
        align: "right",
      },
      valor_pendente: {
        header: "Pendente",
        value: (r) => Number(r.valor_pendente ?? 0),
        align: "right",
      },
      parcelas: {
        header: "Parc.",
        value: (r) => `${r.parcelas_pagas}/${r.total_parcelas}`,
        align: "center",
      },
      status: {
        header: "Status",
        value: (r) => (r.is_overdue ? "Vencido" : "Pendente"),
      },
    };
    const columns = colsSel.map((k) => colsMap[k]);
    const total = docs.reduce(
      (s, r) => s + Number(r.valor_pendente ?? 0),
      0,
    );
    gerarPdfRelatorio({
      titulo: "Contas a vencer",
      subtitulo: "Documentos com parcelas em aberto",
      periodo:
        dataInicio && dataFim
          ? { inicio: dataInicio, fim: dataFim }
          : undefined,
      rows: docs,
      columns,
      total,
    });
  }

  function gerarPagos() {
    const total = pagos.reduce((s, r) => s + Number(r.valor), 0);
    gerarPdfRelatorio({
      titulo: "Contas pagas",
      periodo:
        dataInicio && dataFim
          ? { inicio: dataInicio, fim: dataFim }
          : undefined,
      rows: pagos,
      columns: [
        {
          header: "Data",
          value: (r) => fmtDate(r.data_pagamento),
        },
        {
          header: "Fornecedor",
          value: (r) => r.fornecedor_nome ?? "—",
        },
        {
          header: "Categoria",
          value: (r) => r.categoria ?? "—",
        },
        {
          header: "Origem",
          value: (r) => r.origem,
        },
        {
          header: "Valor",
          value: (r) => Number(r.valor),
          align: "right",
        },
      ],
      total,
    });
  }

  function gerarFornecedor() {
    const map = new Map<string, { nome: string; valor: number; docs: number }>();
    for (const d of docs) {
      const k = d.fornecedor_id ?? "sem_fornecedor";
      const nome = d.fornecedor_nome ?? "Sem fornecedor";
      const cur = map.get(k) ?? { nome, valor: 0, docs: 0 };
      cur.valor += Number(d.valor_pendente ?? 0);
      cur.docs += 1;
      map.set(k, cur);
    }
    const agg = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
    gerarPdfRelatorio({
      titulo: "Pendência por fornecedor",
      rows: agg,
      columns: [
        { header: "Fornecedor", value: (r) => r.nome },
        { header: "Documentos", value: (r) => r.docs, align: "center" },
        { header: "Pendente", value: (r) => r.valor, align: "right" },
      ],
      total: agg.reduce((s, r) => s + r.valor, 0),
    });
  }

  function gerar() {
    if (tipo === "a_vencer") gerarVencer();
    else if (tipo === "pagos") gerarPagos();
    else gerarFornecedor();
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-ink-muted mt-1">
          Gere PDFs customizados para impressão ou envio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Parâmetros</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">
                Tipo de relatório
              </label>
              <Select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as RelatorioTipo)
                }
              >
                <option value="a_vencer">Contas a vencer</option>
                <option value="pagos">Contas pagas</option>
                <option value="por_fornecedor">Pendência por fornecedor</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">
                  Data início
                </label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">
                  Data fim
                </label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            {tipo === "a_vencer" && (
              <div>
                <label className="text-xs text-ink-muted mb-2 block">
                  Colunas
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(COLUNAS_DISPONIVEIS) as ColKey[]).map((k) => {
                    const active = colsSel.includes(k);
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => toggleCol(k)}
                        className={
                          "px-3 py-1.5 rounded-full text-xs transition-colors " +
                          (active
                            ? "bg-primary-500 text-white"
                            : "bg-surface-3 text-ink-muted hover:text-ink")
                        }
                      >
                        {COLUNAS_DISPONIVEIS[k]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button onClick={gerar} className="mt-2">
              <FileDown className="w-4 h-4" />
              Gerar PDF
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">Prévia</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Documentos a vencer</dt>
              <dd className="tabular-nums">{docs.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Pagamentos no período</dt>
              <dd className="tabular-nums">{pagos.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Colunas selecionadas</dt>
              <dd className="tabular-nums">{colsSel.length}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
