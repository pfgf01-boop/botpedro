"use client";

import * as React from "react";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useFornecedores } from "@/hooks/useFornecedores";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoPagamentoModal({ open, onClose }: Props) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const { fornecedores } = useFornecedores();
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [fornecedorNome, setFornecedorNome] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [data, setData] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [forma, setForma] = React.useState("PIX");
  const [categoria, setCategoria] = React.useState("");
  const [observacao, setObservacao] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valorNum) || valorNum <= 0)
      return setError("Valor inválido.");
    if (!fornecedorId && !fornecedorNome.trim())
      return setError("Selecione ou informe um fornecedor.");

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sem sessão.");
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", userId)
        .single();
      if (!usuario?.empresa_id) throw new Error("Empresa não encontrada.");

      const nome =
        fornecedores.find((f) => f.id === fornecedorId)?.nome ??
        fornecedorNome.trim();

      const { error: e } = await supabase.from("pagamentos").insert({
        empresa_id: usuario.empresa_id,
        fornecedor_id: fornecedorId || null,
        fornecedor_nome: nome,
        valor: valorNum,
        data_pagamento: data,
        forma_pagamento: forma || null,
        categoria: categoria || null,
        observacao: observacao || null,
        origem: "web",
      });
      if (e) throw e;
      onClose();
      setFornecedorId("");
      setFornecedorNome("");
      setValor("");
      setCategoria("");
      setObservacao("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pagamento avulso"
      description="Pagamentos sem documento vinculado (ex.: feira, combustível)."
      size="md"
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
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Fornecedor
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
            ou nome livre
          </label>
          <Input
            value={fornecedorNome}
            onChange={(e) => setFornecedorNome(e.target.value)}
            disabled={!!fornecedorId}
            placeholder="Ex.: Posto Shell"
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
            Data do pagamento
          </label>
          <Input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Forma de pagamento
          </label>
          <Select value={forma} onChange={(e) => setForma(e.target.value)}>
            <option value="PIX">PIX</option>
            <option value="TED">TED</option>
            <option value="Boleto">Boleto</option>
            <option value="Cartão">Cartão</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Outros">Outros</option>
          </Select>
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Categoria
          </label>
          <Input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ex.: combustível"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">
            Observação
          </label>
          <Input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
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
