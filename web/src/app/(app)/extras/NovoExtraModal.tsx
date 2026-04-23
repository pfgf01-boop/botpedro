"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useFornecedores } from "@/hooks/useFornecedores";
import { SUBTIPO_EXTRA_LABEL } from "@/types/domain";
import type { SubtipoExtra } from "@/types/database.types";

const SUBTIPOS: SubtipoExtra[] = [
  "dia_a_dia",
  "urgente",
  "sem_documento",
  "compra_imediata",
  "carteira",
];

interface NovoExtraModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovoExtraModal({ open, onClose }: NovoExtraModalProps) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const { fornecedores } = useFornecedores();
  const [subtipo, setSubtipo] = React.useState<SubtipoExtra>("dia_a_dia");
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [fornecedorNovo, setFornecedorNovo] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [vencimento, setVencimento] = React.useState("");
  const [observacao, setObservacao] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setSubtipo("dia_a_dia");
    setFornecedorId("");
    setFornecedorNovo("");
    setValor("");
    setVencimento("");
    setObservacao("");
    setError(null);
  }

  async function handleSave() {
    setError(null);
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!vencimento) {
      setError("Informe o vencimento.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData.user?.id;
      if (!authUserId) throw new Error("Sem sessão de usuário.");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", authUserId)
        .single();
      if (!usuario?.empresa_id) throw new Error("Empresa não encontrada.");

      let fornId: string | null = fornecedorId || null;
      let fornecedorNome: string | null = null;
      if (fornId) {
        fornecedorNome =
          fornecedores.find((f) => f.id === fornId)?.nome ?? null;
      } else if (fornecedorNovo.trim()) {
        const { data: forn, error: e1 } = await supabase
          .from("fornecedores")
          .insert({ nome: fornecedorNovo.trim() })
          .select("id, nome")
          .single();
        if (e1) throw e1;
        fornId = forn.id;
        fornecedorNome = forn.nome;
      }

      // numero_doc é NOT NULL na tabela documentos; como extras não têm número
      // oficial, geramos um identificador curto baseado em timestamp.
      const numeroExtra = `EXT-${Date.now().toString(36).toUpperCase()}`;

      const { data: doc, error: e2 } = await supabase
        .from("documentos")
        .insert({
          empresa_id: usuario.empresa_id,
          fornecedor_id: fornId,
          fornecedor_nome: fornecedorNome,
          numero_doc: numeroExtra,
          tipo: "extra",
          subtipo,
          valor: valorNum,
          vencimento,
          status: "pendente",
          descricao: observacao || null,
        })
        .select("id")
        .single();
      if (e2) throw e2;

      const { error: e3 } = await supabase.from("parcelas").insert({
        documento_id: doc.id,
        numero: 1,
        valor: valorNum,
        vencimento,
        status: "pendente",
      });
      if (e3) throw e3;

      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo extra"
      description="Lançamento manual de documento extra."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">Subtipo</label>
          <Select
            value={subtipo}
            onChange={(e) => setSubtipo(e.target.value as SubtipoExtra)}
          >
            {SUBTIPOS.map((s) => (
              <option key={s} value={s}>
                {SUBTIPO_EXTRA_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Fornecedor existente
          </label>
          <Select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
          >
            <option value="">— selecione —</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            ou novo fornecedor
          </label>
          <Input
            value={fornecedorNovo}
            onChange={(e) => setFornecedorNovo(e.target.value)}
            placeholder="Nome do fornecedor"
            disabled={!!fornecedorId}
          />
        </div>

        <div>
          <label className="text-xs text-ink-muted mb-1 block">Valor</label>
          <Input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Vencimento
          </label>
          <Input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">
            Observação
          </label>
          <Input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: compra urgente para obra"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-danger-500/15 text-danger-400 p-3 text-xs">
          {error}
        </div>
      )}
    </Modal>
  );
}
