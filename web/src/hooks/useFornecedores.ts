"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Fornecedor } from "@/types/domain";

export function useFornecedores() {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [fornecedores, setFornecedores] = React.useState<Fornecedor[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome");
      if (!cancelled) {
        setFornecedores((data ?? []) as Fornecedor[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { fornecedores, loading };
}
