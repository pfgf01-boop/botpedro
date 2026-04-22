"use client";

import * as React from "react";
import { FilterBar } from "@/components/documentos/FilterBar";
import { DocumentosTable } from "@/components/documentos/DocumentosTable";
import { useDocumentos, type DocumentosFilter } from "@/hooks/useDocumentos";

export function HistoricoClient() {
  const [filter, setFilter] = React.useState<DocumentosFilter>({});
  const { rows, loading } = useDocumentos(filter);

  // histórico = todos os documentos (pagos + pendentes + vencidos)
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-sm text-ink-muted mt-1">
          Todos os documentos já cadastrados.
        </p>
      </div>
      <FilterBar value={filter} onChange={setFilter} />
      <DocumentosTable rows={rows} loading={loading} />
    </div>
  );
}
