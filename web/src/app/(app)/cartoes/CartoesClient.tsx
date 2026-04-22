"use client";

import * as React from "react";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { useCartoes, useCartaoLancamentos } from "@/hooks/useCartoes";
import { fmtBRL, fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { NovoCartaoModal } from "./NovoCartaoModal";
import { NovoLancamentoModal } from "./NovoLancamentoModal";

export function CartoesClient() {
  const { cartoes, loading } = useCartoes();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [modalCartao, setModalCartao] = React.useState(false);
  const [modalLanc, setModalLanc] = React.useState(false);

  React.useEffect(() => {
    if (cartoes.length > 0 && !selected) setSelected(cartoes[0].id);
  }, [cartoes, selected]);

  const { lancamentos, loading: loadingLanc } = useCartaoLancamentos(selected);
  const cartao = cartoes.find((c) => c.id === selected) ?? null;

  const totalPorCompetencia = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lancamentos) {
      const k = l.competencia.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + Number(l.valor));
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [lancamentos]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Cartões</h1>
          <p className="text-sm text-ink-muted mt-1">
            Gerencie cartões, compras e fatura mensal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModalCartao(true)}>
            <Plus className="w-4 h-4" />
            Novo cartão
          </Button>
          {selected && (
            <Button onClick={() => setModalLanc(true)}>
              <Plus className="w-4 h-4" />
              Novo lançamento
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-ink-muted">Carregando...</div>
      ) : cartoes.length === 0 ? (
        <Empty
          title="Nenhum cartão cadastrado"
          description="Cadastre o primeiro cartão para começar a registrar compras."
          icon={<CreditCard className="w-5 h-5" />}
          action={
            <Button onClick={() => setModalCartao(true)}>
              <Plus className="w-4 h-4" />
              Cadastrar cartão
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-2">
            {cartoes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  "w-full text-left rounded-lg p-4 transition-colors",
                  selected === c.id
                    ? "bg-gradient-primary text-white"
                    : "bg-surface-1 hover:bg-surface-2",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.apelido}</span>
                  <CreditCard className="w-4 h-4 opacity-80" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span
                    className={cn(
                      "text-xs tracking-widest",
                      selected === c.id ? "text-white/80" : "text-ink-muted",
                    )}
                  >
                    •••• {c.final_4}
                  </span>
                  <span
                    className={cn(
                      "text-[10px]",
                      selected === c.id ? "text-white/80" : "text-ink-dim",
                    )}
                  >
                    fech {c.dia_fechamento} · venc {c.dia_vencimento}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4 min-w-0">
            {cartao && (
              <Card>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-ink-muted">Bandeira</p>
                    <p className="font-medium">{cartao.bandeira ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Limite</p>
                    <p className="font-medium">{fmtBRL(cartao.limite)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Fechamento</p>
                    <p className="font-medium">dia {cartao.dia_fechamento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Vencimento</p>
                    <p className="font-medium">dia {cartao.dia_vencimento}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold mb-3">Faturas por mês</h3>
              {totalPorCompetencia.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Sem lançamentos por enquanto.
                </p>
              ) : (
                <ul className="divide-y divide-surface-3/40">
                  {totalPorCompetencia.map(([comp, total]) => (
                    <li
                      key={comp}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm">{comp}</span>
                      <span className="tabular-nums font-medium">
                        {fmtBRL(total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-3">Lançamentos</h3>
              {loadingLanc ? (
                <p className="text-ink-muted text-sm">Carregando...</p>
              ) : lancamentos.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhum lançamento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-ink-muted uppercase tracking-wider">
                      <tr>
                        <th className="text-left py-2">Data</th>
                        <th className="text-left py-2">Descrição</th>
                        <th className="text-center py-2">Parc.</th>
                        <th className="text-left py-2">Competência</th>
                        <th className="text-right py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lancamentos.map((l) => (
                        <tr
                          key={l.id}
                          className="border-t border-surface-3/40"
                        >
                          <td className="py-2">{fmtDate(l.data_compra)}</td>
                          <td className="py-2">{l.descricao}</td>
                          <td className="py-2 text-center text-ink-muted">
                            {l.parcela_atual}/{l.parcela_total}
                          </td>
                          <td className="py-2">{l.competencia.slice(0, 7)}</td>
                          <td className="py-2 text-right tabular-nums">
                            {fmtBRL(Number(l.valor))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <NovoCartaoModal
        open={modalCartao}
        onClose={() => setModalCartao(false)}
      />
      {selected && (
        <NovoLancamentoModal
          open={modalLanc}
          onClose={() => setModalLanc(false)}
          cartaoId={selected}
        />
      )}
    </div>
  );
}
