"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DocumentosTable } from "@/components/documentos/DocumentosTable";
import { useDocumentos } from "@/hooks/useDocumentos";
import { SUBTIPO_EXTRA_LABEL } from "@/types/domain";
import type { SubtipoExtra } from "@/types/database.types";
import { NovoExtraModal } from "./NovoExtraModal";

const SUBTIPOS: SubtipoExtra[] = [
  "dia_a_dia",
  "urgente",
  "sem_documento",
  "compra_imediata",
  "carteira",
];

export function ExtrasClient() {
  const [sub, setSub] = React.useState<SubtipoExtra | "todos">("todos");
  const [modalOpen, setModalOpen] = React.useState(false);

  const { rows, loading } = useDocumentos({
    tipos: ["extra"],
    subtipos: sub === "todos" ? undefined : [sub],
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Extras</h1>
          <p className="text-sm text-ink-muted mt-1">
            Pagamentos avulsos que não passaram pelo bot — dia a dia, urgências,
            carteira.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo extra
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSub("todos")}>
          <Chip tone={sub === "todos" ? "primary" : "neutral"}>Todos</Chip>
        </button>
        {SUBTIPOS.map((s) => (
          <button key={s} onClick={() => setSub(s)}>
            <Chip tone={sub === s ? "primary" : "neutral"}>
              {SUBTIPO_EXTRA_LABEL[s]}
            </Chip>
          </button>
        ))}
      </div>

      <DocumentosTable rows={rows} loading={loading} showTipo={false} />

      <NovoExtraModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
