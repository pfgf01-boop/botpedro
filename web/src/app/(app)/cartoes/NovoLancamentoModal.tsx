"use client";

import * as React from "react";
import { addMonths, format, parseISO, setDate } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Cartao } from "@/types/domain";

interface Props {
  open: boolean;
  onClose: () => void;
  cartaoId: string;
}

export function NovoLancamentoModal({ open, onClose, cartaoId }: Props) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [cartao, setCartao] = React.useState<Cartao | null>(null);
  const [descricao, setDescricao] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [dataCompra, setDataCompra] = React.useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [parcelas, setParcelas] = React.useState("1");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !cartaoId) return;
    (async () => {
      const { data } = await supabase
        .from("cartoes")
        .select("*")
        .eq("id", cartaoId)
        .single();
      setCartao(data as Cartao | null);
    })();
  }, [open, cartaoId, supabase]);

  function computeCompetencia(compraISO: string, c: Cartao): Date {
    // Se compra for até o dia de fechamento → competência é o mês atual; senão, mês+1.
    const d = parseISO(compraISO);
    const dia = d.getDate();
    const fech = c.dia_fechamento ?? 25;
    const venc = c.dia_vencimento ?? 10;
    let base = d;
    if (dia > fech) {
      base = addMonths(d, 1);
    }
    return setDate(base, venc);
  }

  async function handleSave() {
    setError(null);
    if (!cartao) return setError("Cartão não carregado.");
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valorNum) || valorNum <= 0)
      return setError("Valor inválido.");
    const n = Math.max(1, Math.min(36, Number(parcelas) || 1));
    if (!descricao.trim()) return setError("Informe uma descrição.");

    setSaving(true);
    try {
      const baseComp = computeCompetencia(dataCompra, cartao);
      const valorPorParcela = Math.round((valorNum / n) * 100) / 100;

      const rows = Array.from({ length: n }).map((_, i) => {
        const comp = addMonths(baseComp, i);
        return {
          cartao_id: cartaoId,
          descricao: descricao.trim(),
          valor: valorPorParcela,
          data_compra: dataCompra,
          competencia: format(comp, "yyyy-MM-dd"),
          parcela_atual: i + 1,
          parcela_total: n,
        };
      });
      const { error: e } = await supabase
        .from("cartao_lancamentos")
        .insert(rows);
      if (e) throw e;
      onClose();
      setDescricao("");
      setValor("");
      setParcelas("1");
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
      title="Novo lançamento"
      description={
        cartao
          ? `Cartão ${cartao.apelido} (•••• ${cartao.final_4})`
          : undefined
      }
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
        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">Descrição</label>
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Onde foi a compra?"
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
            Data da compra
          </label>
          <Input
            type="date"
            value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">
            Parcelas (1–36)
          </label>
          <Input
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            inputMode="numeric"
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
