"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  align?: "left" | "right" | "center";
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  dense?: boolean;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = "Nada por aqui.",
  loading = false,
  onRowClick,
  dense = false,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = col.sortAccessor;
    if (!acc) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-surface-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c) => {
              const isSorted = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted bg-surface-2 first:rounded-tl-lg last:rounded-tr-lg",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-ink transition-colors",
                        isSorted && "text-ink",
                      )}
                    >
                      {c.header}
                      {isSorted ? (
                        sort?.dir === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-ink-muted"
              >
                Carregando...
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-ink-muted"
              >
                {empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  idx % 2 === 1 && "bg-surface-1/40",
                  onRowClick &&
                    "cursor-pointer hover:bg-surface-2 active:bg-surface-3",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-4 py-2" : "px-4 py-3",
                      "align-middle",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.accessor
                      ? c.accessor(row)
                      : ((row as unknown as Record<string, React.ReactNode>)[
                          c.key
                        ] ?? null)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
