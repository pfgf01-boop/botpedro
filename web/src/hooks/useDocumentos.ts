"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { DashboardDocumento } from "@/types/domain";
import type { SubtipoExtra, TipoDocumento } from "@/types/database.types";

export interface DocumentosFilter {
  tipos?: TipoDocumento[];
  subtipos?: SubtipoExtra[];
  fornecedor?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  somenteVencidos?: boolean;
  excluirFaturaCartao?: boolean;
  busca?: string;
}

export function useDocumentos(filter: DocumentosFilter = {}) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [rows, setRows] = React.useState<DashboardDocumento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const filterRef = React.useRef(filter);
  filterRef.current = filter;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from("v_dashboard_documentos").select("*");

    const f = filterRef.current;
    if (f.tipos?.length) query = query.in("tipo", f.tipos);
    if (f.subtipos?.length) query = query.in("subtipo", f.subtipos);
    if (f.fornecedor) query = query.eq("fornecedor_id", f.fornecedor);
    if (f.excluirFaturaCartao) query = query.neq("tipo", "fatura_cartao");
    if (f.dataInicio) query = query.gte("proximo_vencimento", f.dataInicio);
    if (f.dataFim) query = query.lte("proximo_vencimento", f.dataFim);
    if (f.somenteVencidos) query = query.eq("is_overdue", true);
    if (f.busca && f.busca.trim()) {
      const b = `%${f.busca.trim()}%`;
      query = query.or(
        `numero.ilike.${b},fornecedor_nome.ilike.${b},observacao.ilike.${b}`,
      );
    }

    query = query
      .order("is_overdue", { ascending: false })
      .order("proximo_vencimento", { ascending: true, nullsFirst: false });

    const { data, error } = await query;
    if (error) {
      setError(new Error(error.message));
      setRows([]);
    } else {
      setRows((data ?? []) as DashboardDocumento[]);
    }
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter)]);

  // Real-time: recarrega quando documentos/parcelas mudam
  React.useEffect(() => {
    const channel = supabase
      .channel("dashboard_documentos_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documentos" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parcelas" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  return { rows, loading, error, refetch: load };
}
