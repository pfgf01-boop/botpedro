"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fmtBRL, fmtDate } from "./format";

export interface ReportColumn<T> {
  header: string;
  value: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: number;
}

interface GerarRelatorioOpts<T> {
  titulo: string;
  subtitulo?: string;
  periodo?: { inicio: string; fim: string };
  filtros?: Record<string, string | undefined | null>;
  rows: T[];
  columns: ReportColumn<T>[];
  total?: number;
}

export function gerarPdfRelatorio<T>(opts: GerarRelatorioOpts<T>) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho com faixa colorida
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("BOTI · Farm Home", 40, 26);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.text(opts.titulo, 40, 68);

  if (opts.subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(opts.subtitulo, 40, 84);
  }

  let y = 100;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  if (opts.periodo) {
    doc.text(
      `Período: ${fmtDate(opts.periodo.inicio)} a ${fmtDate(opts.periodo.fim)}`,
      40,
      y,
    );
    y += 12;
  }
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 40, y);
  y += 12;

  if (opts.filtros) {
    const parts = Object.entries(opts.filtros)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (parts.length) {
      doc.text(`Filtros: ${parts.join(" · ")}`, 40, y);
      y += 12;
    }
  }

  autoTable(doc, {
    startY: y + 8,
    head: [opts.columns.map((c) => c.header)],
    body: opts.rows.map((r) =>
      opts.columns.map((c) => {
        const v = c.value(r);
        return typeof v === "number" ? fmtBRL(v) : String(v);
      }),
    ),
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
    columnStyles: opts.columns.reduce(
      (acc, c, idx) => {
        acc[idx] = {
          halign: c.align ?? "left",
          cellWidth: c.width ?? "auto",
        };
        return acc;
      },
      {} as Record<number, { halign: "left" | "right" | "center"; cellWidth: number | "auto" }>,
    ),
    margin: { left: 40, right: 40 },
  });

  if (opts.total != null) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Total: ${fmtBRL(opts.total)}`, pageWidth - 40, finalY + 24, {
      align: "right",
    });
  }

  // Rodapé com número de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  doc.save(
    `${opts.titulo.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`,
  );
}
