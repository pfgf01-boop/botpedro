"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { ContaPaga } from "@/types/domain";
import type { OrigemPagamento } from "@/types/database.types";

export interface ContasPagasFilter {
  dataInicio?: string | null;
  dataFim?: string | null;
  categoria?: string | null;
  origem?: OrigemPagamento | null;
  fornecedor?: string | null;
  busca?: string;
}

export function useContasPagas(filter: ContasPagasFilter = {}) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [rows, setRows] = React.useState<ContaPaga[]>([]);
  const [loading, setLoading] = React.useState(true);

  const filterRef = React.useRef(filter);
  filterRef.current = filter;

  const load = React.useCallback(async () => {
    setLoading(true);
    let q = supabase.from("v_contas_pagas").select("*");
    const f = filterRef.current;
    if (f.dataInicio) q = q.gte("data_pagamento", f.dataInicio);
    if (f.dataFim) q = q.lte("data_pagamento", f.dataFim);
    if (f.categoria) q = q.eq("categoria", f.categoria);
    if (f.origem) q = q.eq("origem", f.origem);
    if (f.fornecedor) q = q.eq("fornecedor_id", f.fornecedor);
    if (f.busca?.trim()) {
      const b = `%${f.busca.trim()}%`;
      q = q.or(
        `fornecedor_nome.ilike.${b},documento_numero.ilike.${b},observacao.ilike.${b}`,
      );
    }
    q = q.order("data_pagamento", { ascending: false });
    const { data } = await q;
    setRows((data ?? []) as ContaPaga[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter)]);

  React.useEffect(() => {
    const ch = supabase
      .channel("contas_pagas_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagamentos" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, load]);

  return { rows, loading, refetch: load };
}
