"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import type { DocumentosFilter } from "@/hooks/useDocumentos";
import { useFornecedores } from "@/hooks/useFornecedores";

interface FilterBarProps {
  value: DocumentosFilter;
  onChange: (next: DocumentosFilter) => void;
  showSubtipo?: boolean;
}

export function FilterBar({ value, onChange, showSubtipo }: FilterBarProps) {
  const { fornecedores } = useFornecedores();
  const hasActive =
    !!value.busca ||
    !!value.fornecedor ||
    !!value.dataInicio ||
    !!value.dataFim ||
    value.somenteVencidos;

  return (
    <div className="rounded-lg bg-surface-1 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Buscar por número, fornecedor, observação..."
            value={value.busca ?? ""}
            onChange={(e) => onChange({ ...value, busca: e.target.value })}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Select
          value={value.fornecedor ?? ""}
          onChange={(e) =>
            onChange({ ...value, fornecedor: e.target.value || null })
          }
          className="w-48"
        >
          <option value="">Todos fornecedores</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={value.dataInicio ?? ""}
          onChange={(e) =>
            onChange({ ...value, dataInicio: e.target.value || null })
          }
          className="w-44"
          aria-label="Data início"
        />
        <Input
          type="date"
          value={value.dataFim ?? ""}
          onChange={(e) =>
            onChange({ ...value, dataFim: e.target.value || null })
          }
          className="w-44"
          aria-label="Data fim"
        />

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface-3 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={!!value.somenteVencidos}
            onChange={(e) =>
              onChange({ ...value, somenteVencidos: e.target.checked })
            }
            className="accent-primary-500"
          />
          Apenas vencidos
        </label>
      </div>

      {hasActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-muted">Filtros ativos:</span>
          {value.busca && (
            <Chip tone="primary">
              "{value.busca}"
              <button
                onClick={() => onChange({ ...value, busca: "" })}
                aria-label="Limpar busca"
              >
                <X className="w-3 h-3" />
              </button>
            </Chip>
          )}
          {value.fornecedor && (
            <Chip tone="primary">
              Fornecedor
              <button
                onClick={() => onChange({ ...value, fornecedor: null })}
                aria-label="Limpar fornecedor"
              >
                <X className="w-3 h-3" />
              </button>
            </Chip>
          )}
          {(value.dataInicio || value.dataFim) && (
            <Chip tone="primary">
              Período
              <button
                onClick={() =>
                  onChange({ ...value, dataInicio: null, dataFim: null })
                }
                aria-label="Limpar período"
              >
                <X className="w-3 h-3" />
              </button>
            </Chip>
          )}
          {value.somenteVencidos && (
            <Chip tone="danger">
              Vencidos
              <button
                onClick={() => onChange({ ...value, somenteVencidos: false })}
                aria-label="Limpar vencidos"
              >
                <X className="w-3 h-3" />
              </button>
            </Chip>
          )}
          <button
            onClick={() => onChange({})}
            className="text-xs text-ink-muted hover:text-ink ml-2"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* showSubtipo reservado para uso futuro na tela de Extras */}
      {showSubtipo ? null : null}
    </div>
  );
}
