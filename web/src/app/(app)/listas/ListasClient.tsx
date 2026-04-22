"use client";

import * as React from "react";
import { format } from "date-fns";
import { Plus, ListTodo, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Chip } from "@/components/ui/Chip";
import {
  usePagamentoListas,
  usePagamentoListaItens,
} from "@/hooks/usePagamentoListas";
import { useDocumentos } from "@/hooks/useDocumentos";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { getPayWeekRange, fmtWeekLabel } from "@/lib/weeks";
import { fmtBRL, fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ListasClient() {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const { listas } = usePagamentoListas();
  const [selected, setSelected] = React.useState<string | null>(null);
  const { itens, refetch } = usePagamentoListaItens(selected);

  React.useEffect(() => {
    if (listas.length > 0 && !selected) setSelected(listas[0].id);
  }, [listas, selected]);

  const lista = listas.find((l) => l.id === selected) ?? null;
  const total = itens.reduce((s, i) => s + Number(i.valor), 0);
  const totalMarcado = itens
    .filter((i) => i.marcado)
    .reduce((s, i) => s + Number(i.valor), 0);

  async function criarListaSemanaAtual() {
    const { inicio, fim } = getPayWeekRange();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();
    if (!usuario?.empresa_id) return;

    const { data: nova, error } = await supabase
      .from("pagamento_listas")
      .insert({
        empresa_id: usuario.empresa_id,
        nome: `Semana ${fmtWeekLabel(inicio, fim)}`,
        semana_inicio: format(inicio, "yyyy-MM-dd"),
        semana_fim: format(fim, "yyyy-MM-dd"),
        status: "aberta",
        criado_por: userId,
      })
      .select("id")
      .single();
    if (error || !nova) return;
    setSelected(nova.id);
  }

  // Documentos a vencer na semana da lista selecionada, para sugerir
  const { rows: docsSemana } = useDocumentos(
    lista
      ? {
          dataInicio: lista.semana_inicio,
          dataFim: lista.semana_fim,
          excluirFaturaCartao: false,
        }
      : {},
  );
  const jaNaLista = new Set(
    itens.map((i) => i.parcela_id).filter((x): x is string => !!x),
  );

  async function adicionarSugestao(parcelaId: string, valor: number, label: string) {
    if (!lista) return;
    await supabase.from("pagamento_lista_itens").insert({
      lista_id: lista.id,
      parcela_id: parcelaId,
      descricao: label,
      valor,
      ordem: itens.length,
    });
    refetch();
  }

  async function toggleMarcado(itemId: string, current: boolean) {
    await supabase
      .from("pagamento_lista_itens")
      .update({ marcado: !current })
      .eq("id", itemId);
    refetch();
  }

  async function removerItem(itemId: string) {
    await supabase.from("pagamento_lista_itens").delete().eq("id", itemId);
    refetch();
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Listas de pagamento</h1>
          <p className="text-sm text-ink-muted mt-1">
            Agendamento semanal (sábado → sexta).
          </p>
        </div>
        <Button onClick={criarListaSemanaAtual}>
          <Plus className="w-4 h-4" />
          Nova lista da semana
        </Button>
      </div>

      {listas.length === 0 ? (
        <Empty
          title="Nenhuma lista ainda"
          description="Crie a primeira lista da semana atual para começar a organizar pagamentos."
          icon={<ListTodo className="w-5 h-5" />}
          action={
            <Button onClick={criarListaSemanaAtual}>
              <Plus className="w-4 h-4" />
              Criar lista
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-2">
            {listas.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l.id)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-colors",
                  selected === l.id
                    ? "bg-surface-3"
                    : "bg-surface-1 hover:bg-surface-2",
                )}
              >
                <p className="text-sm font-medium truncate">{l.nome}</p>
                <p className="text-xs text-ink-muted mt-1">
                  {fmtDate(l.semana_inicio, "dd/MM")} →{" "}
                  {fmtDate(l.semana_fim, "dd/MM")}
                </p>
                <Chip
                  className="mt-2"
                  tone={l.status === "aberta" ? "primary" : "secondary"}
                >
                  {l.status}
                </Chip>
              </button>
            ))}
          </div>

          <div className="space-y-4 min-w-0">
            {lista && (
              <>
                <Card>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-base font-semibold">{lista.nome}</h2>
                      <p className="text-xs text-ink-muted">
                        {fmtDate(lista.semana_inicio)} a{" "}
                        {fmtDate(lista.semana_fim)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-muted">
                        Marcado / total
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        {fmtBRL(totalMarcado)} / {fmtBRL(total)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-sm font-semibold mb-3">Itens da lista</h3>
                  {itens.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      Nenhum item ainda — adicione a partir das sugestões abaixo.
                    </p>
                  ) : (
                    <ul className="divide-y divide-surface-3/40">
                      {itens.map((i) => (
                        <li
                          key={i.id}
                          className="flex items-center gap-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={i.marcado}
                            onChange={() => toggleMarcado(i.id, i.marcado)}
                            className="accent-primary-500 w-4 h-4"
                          />
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              i.marcado &&
                                "line-through text-ink-muted",
                            )}
                          >
                            {i.descricao ?? "(sem descrição)"}
                          </span>
                          <span className="tabular-nums font-medium">
                            {fmtBRL(Number(i.valor))}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerItem(i.id)}
                            className="text-xs text-ink-muted hover:text-danger-400"
                          >
                            remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    <h3 className="text-sm font-semibold">
                      Sugestões da semana
                    </h3>
                  </div>
                  {docsSemana.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      Nenhum documento vencendo nesta semana.
                    </p>
                  ) : (
                    <ul className="divide-y divide-surface-3/40">
                      {docsSemana.map((d) => {
                        // Para simplicidade: trata documento todo como um item
                        // (quando houver parcelas, idealmente buscar cada parcela).
                        const pendente = Number(d.valor_pendente ?? 0);
                        if (pendente <= 0) return null;
                        return (
                          <li
                            key={d.id}
                            className="flex items-center gap-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {d.fornecedor_nome ?? "—"}
                                {d.numero && (
                                  <span className="text-ink-muted">
                                    {" "}
                                    · #{d.numero}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-ink-muted">
                                vence {fmtDate(d.proximo_vencimento)}
                              </p>
                            </div>
                            <span className="tabular-nums text-sm">
                              {fmtBRL(pendente)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                adicionarSugestao(
                                  d.id,
                                  pendente,
                                  `${d.fornecedor_nome ?? "Doc"} · ${d.numero ?? d.id.slice(0, 6)}`,
                                )
                              }
                              disabled={jaNaLista.has(d.id)}
                            >
                              {jaNaLista.has(d.id) ? "na lista" : "adicionar"}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
