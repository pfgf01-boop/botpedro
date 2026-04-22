"use client";

import * as React from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useCartoes } from "@/hooks/useCartoes";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function ConfiguracoesClient() {
  const { fornecedores } = useFornecedores();
  const { cartoes } = useCartoes();
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = React.useState<{
    email?: string | null;
    id?: string;
  } | null>(null);
  const [empresa, setEmpresa] = React.useState<{
    nome?: string | null;
    cnpj?: string | null;
  } | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { email: data.user.email, id: data.user.id } : null);
      if (data.user) {
        const { data: u } = await supabase
          .from("usuarios")
          .select("empresa_id, empresas(nome, cnpj)")
          .eq("id", data.user.id)
          .single();
        const emp = (u as unknown as { empresas?: { nome: string; cnpj: string | null } })?.empresas;
        if (emp) setEmpresa({ nome: emp.nome, cnpj: emp.cnpj });
      }
    })();
  }, [supabase]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-ink-muted mt-1">
          Informações da conta, empresa e dados mestres.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-3">Conta</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Email</dt>
              <dd>{user?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">User ID</dt>
              <dd className="text-xs font-mono text-ink-dim">
                {user?.id?.slice(0, 8) ?? "—"}…
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle className="mb-3">Empresa</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Nome</dt>
              <dd>{empresa?.nome ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">CNPJ</dt>
              <dd>{empresa?.cnpj ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle className="mb-3">Fornecedores</CardTitle>
          <p className="text-3xl font-semibold">{fornecedores.length}</p>
          <p className="text-xs text-ink-muted mt-1">
            Gerenciamento completo no bot por enquanto.
          </p>
        </Card>

        <Card>
          <CardTitle className="mb-3">Cartões</CardTitle>
          <p className="text-3xl font-semibold">{cartoes.length}</p>
          <p className="text-xs text-ink-muted mt-1">
            {cartoes.filter((c) => c.ativo).length} ativos.
          </p>
        </Card>
      </div>
    </div>
  );
}
