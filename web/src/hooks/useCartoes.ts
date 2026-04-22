"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Cartao, CartaoLancamento } from "@/types/domain";

export function useCartoes() {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [cartoes, setCartoes] = React.useState<Cartao[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cartoes")
      .select("*")
      .order("ativo", { ascending: false })
      .order("apelido");
    setCartoes((data ?? []) as Cartao[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const ch = supabase
      .channel("cartoes_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cartoes" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, load]);

  return { cartoes, loading, refetch: load };
}

export function useCartaoLancamentos(cartaoId: string | null) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [lancamentos, setLancamentos] = React.useState<CartaoLancamento[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!cartaoId) {
      setLancamentos([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cartao_lancamentos")
        .select("*")
        .eq("cartao_id", cartaoId)
        .order("data_compra", { ascending: false });
      if (!cancelled) {
        setLancamentos((data ?? []) as CartaoLancamento[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, cartaoId]);

  return { lancamentos, loading };
}
