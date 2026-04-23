"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { PagamentoLista } from "@/types/domain";

// Item enriquecido com dados da parcela + documento pra exibição na lista.
// Schema real só tem { lista_id, parcela_id, pago, ordem } — todo o resto vem do join.
export interface PagamentoListaItemView {
  lista_id: string;
  parcela_id: string;
  pago: boolean;
  ordem: number;
  // joined:
  valor: number;
  vencimento: string;
  descricao: string;
  documento_id: string | null;
}

export function usePagamentoListas() {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [listas, setListas] = React.useState<PagamentoLista[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pagamento_listas")
      .select("*")
      .order("criado_em", { ascending: false });
    setListas((data ?? []) as PagamentoLista[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const ch = supabase
      .channel("listas_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagamento_listas" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, load]);

  return { listas, loading, refetch: load };
}

export function usePagamentoListaItens(listaId: string | null) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [itens, setItens] = React.useState<PagamentoListaItemView[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!listaId) {
      setItens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("pagamento_lista_itens")
      .select(
        `lista_id, parcela_id, pago, ordem,
         parcelas!inner (
           id, valor, vencimento, documento_id,
           documentos!inner ( id, numero_doc, fornecedor_nome )
         )`,
      )
      .eq("lista_id", listaId)
      .order("ordem", { ascending: true });

    type Row = {
      lista_id: string;
      parcela_id: string;
      pago: boolean;
      ordem: number;
      parcelas: {
        valor: number;
        vencimento: string;
        documento_id: string;
        documentos: {
          numero_doc: string;
          fornecedor_nome: string | null;
        };
      };
    };

    const mapped: PagamentoListaItemView[] = ((data ?? []) as unknown as Row[]).map(
      (r) => ({
        lista_id: r.lista_id,
        parcela_id: r.parcela_id,
        pago: r.pago,
        ordem: r.ordem,
        valor: Number(r.parcelas?.valor ?? 0),
        vencimento: r.parcelas?.vencimento ?? "",
        descricao: r.parcelas?.documentos?.fornecedor_nome
          ? `${r.parcelas.documentos.fornecedor_nome} · #${r.parcelas.documentos.numero_doc}`
          : `#${r.parcelas?.documentos?.numero_doc ?? ""}`,
        documento_id: r.parcelas?.documento_id ?? null,
      }),
    );
    setItens(mapped);
    setLoading(false);
  }, [supabase, listaId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!listaId) return;
    const ch = supabase
      .channel(`lista_itens_${listaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pagamento_lista_itens",
          filter: `lista_id=eq.${listaId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, listaId, load]);

  return { itens, loading, refetch: load };
}
