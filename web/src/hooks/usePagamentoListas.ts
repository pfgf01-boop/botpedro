"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type {
  PagamentoLista,
  PagamentoListaItem,
} from "@/types/domain";

export function usePagamentoListas() {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [listas, setListas] = React.useState<PagamentoLista[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pagamento_listas")
      .select("*")
      .order("semana_inicio", { ascending: false });
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
  const [itens, setItens] = React.useState<PagamentoListaItem[]>([]);
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
      .select("*")
      .eq("lista_id", listaId)
      .order("ordem", { ascending: true });
    setItens((data ?? []) as PagamentoListaItem[]);
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
