import type { ColumnMeta, ExcelRow } from "@/types/excel";
import { columnLetter } from "@/lib/excel/column-letter";
import { EXCEL_PREVIEW_FALLBACK } from "@/lib/excel/excel-preview-eval";
import { toExcelFormula } from "@/lib/excel/formulas";
import { sumColumn } from "@/lib/excel/parse";

function hexToArgb(hex: string): string {
  const clean = hex.replace("#", "").toUpperCase();
  return clean.length === 6 ? `FF${clean}` : `FF0F172A`;
}

export type ExportWorkbookInput = {
  fileName: string;
  sheetName: string;
  columns: ColumnMeta[];
  rows: ExcelRow[];
};

/**
 * Builds a styled .xlsx with ExcelJS and triggers a browser download.
 * Computed columns are written as native Excel formulas with cached results.
 */
export async function exportStyledWorkbook(input: ExportWorkbookInput): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExcelFlow";
  const worksheet = workbook.addWorksheet(input.sheetName || "Datos");

  const headers = input.columns.map((column) => column.header);
  worksheet.addRow(headers);

  input.columns.forEach((column, index) => {
    const cell = worksheet.getRow(1).getCell(index + 1);
    cell.font = {
      name: "Calibri",
      bold: column.style.bold,
      size: column.style.font_size,
      color: { argb: hexToArgb(column.style.font_color) },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: hexToArgb(column.style.bg_color) },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  input.rows.forEach((row, rowIndex) => {
    const excelRow = rowIndex + 2;
    const values = input.columns.map((column) => {
      const computed = row[column.id] ?? null;
      if (!column.formula) return computed;
      const formula = toExcelFormula(column.formula, input.columns, excelRow);
      if (!formula) return computed;
      if (computed === EXCEL_PREVIEW_FALLBACK) {
        return { formula };
      }
      return { formula, result: computed ?? undefined };
    });
    worksheet.addRow(values);
  });

  const lastDataRow = 1 + input.rows.length;
  const summaryOps = input.columns.filter((column) => column.summary);

  if (summaryOps.length > 0 && input.rows.length > 0) {
    const summaryValues = input.columns.map((column, index) => {
      if (!column.summary) {
        return index === 0 ? "Totales (pie)" : null;
      }
      const letter = columnLetter(index);
      return {
        formula: `SUM(${letter}2:${letter}${lastDataRow})`,
        result: sumColumn(input.rows, column.id),
      };
    });
    worksheet.addRow(summaryValues);
    const summaryRow = worksheet.getRow(lastDataRow + 1);
    summaryRow.font = { bold: true };
  }

  worksheet.columns.forEach((col) => {
    col.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stem = input.fileName.replace(/\.(xlsx|csv)$/i, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${stem}-formateado.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
