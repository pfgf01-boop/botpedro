"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoCartaoModal({ open, onClose }: Props) {
  const supabase = React.useMemo(() => getSupabaseBrowser(), []);
  const [apelido, setApelido] = React.useState("");
  const [bandeira, setBandeira] = React.useState("");
  const [final4, setFinal4] = React.useState("");
  const [fech, setFech] = React.useState("");
  const [venc, setVenc] = React.useState("");
  const [limite, setLimite] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!apelido.trim()) return setError("Informe um apelido.");
    if (!/^\d{4}$/.test(final4)) return setError("Final 4 deve ter 4 dígitos.");
    const fechN = Number(fech);
    const vencN = Number(venc);
    if (!Number.isInteger(fechN) || fechN < 1 || fechN > 31)
      return setError("Dia de fechamento inválido.");
    if (!Number.isInteger(vencN) || vencN < 1 || vencN > 31)
      return setError("Dia de vencimento inválido.");

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

      const { error: e } = await supabase.from("cartoes").insert({
        empresa_id: usuario.empresa_id,
        apelido: apelido.trim(),
        bandeira: bandeira.trim() || null,
        final_4: final4,
        dia_fechamento: fechN,
        dia_vencimento: vencN,
        limite: limite
          ? Number(limite.replace(/\./g, "").replace(",", "."))
          : null,
      });
      if (e) throw e;
      onClose();
      setApelido("");
      setBandeira("");
      setFinal4("");
      setFech("");
      setVenc("");
      setLimite("");
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
      title="Novo cartão"
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
          <label className="text-xs text-ink-muted mb-1 block">Apelido</label>
          <Input
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="Ex.: Itaú Platinum"
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">Bandeira</label>
          <Input
            value={bandeira}
            onChange={(e) => setBandeira(e.target.value)}
            placeholder="Visa, Mastercard..."
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">Final 4</label>
          <Input
            value={final4}
            maxLength={4}
            onChange={(e) => setFinal4(e.target.value.replace(/\D/g, ""))}
            placeholder="1234"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Fechamento (dia)
          </label>
          <Input
            value={fech}
            onChange={(e) => setFech(e.target.value)}
            inputMode="numeric"
            placeholder="15"
          />
        </div>
        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            Vencimento (dia)
          </label>
          <Input
            value={venc}
            onChange={(e) => setVenc(e.target.value)}
            inputMode="numeric"
            placeholder="22"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-ink-muted mb-1 block">
            Limite (opcional)
          </label>
          <Input
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
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
