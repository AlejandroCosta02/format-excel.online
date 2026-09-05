import * as XLSX from "xlsx";
import { z } from "zod";
import {
  DEFAULT_COLUMN_STYLE,
  type ColumnMeta,
  type ExcelRow,
  type ParsedWorkbook,
} from "@/types/excel";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const spreadsheetFileSchema = z.object({
  ext: z.enum(["xlsx", "csv"]),
  size: z.number().max(MAX_FILE_BYTES, "El archivo supera el límite de 10 MB"),
});

export function validateSpreadsheetFile(file: File): { ok: true } | { ok: false; message: string } {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const parsed = spreadsheetFileSchema.safeParse({ ext, size: file.size });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (ext !== "xlsx" && ext !== "csv") {
      return { ok: false, message: "Solo se admiten archivos .xlsx o .csv" };
    }
    return { ok: false, message: first?.message ?? "Archivo no válido" };
  }

  return { ok: true };
}

function uniqueColumnId(header: string, index: number, used: Set<string>): string {
  const base = header.trim() || `Columna_${index + 1}`;
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}_${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function toCellValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Reads the first sheet entirely in the browser (no server upload).
 */
export async function parseSpreadsheet(file: File): Promise<ParsedWorkbook> {
  const validation = validateSpreadsheetFile(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("El archivo no contiene hojas");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error("La hoja está vacía");
  }

  const headerRow = matrix[0] ?? [];
  const usedIds = new Set<string>();
  const columns: ColumnMeta[] = headerRow.map((raw, index) => {
    const header = raw == null || raw === "" ? `Columna ${index + 1}` : String(raw);
    return {
      id: uniqueColumnId(header, index, usedIds),
      header,
      style: { ...DEFAULT_COLUMN_STYLE },
      summary: false,
    };
  });

  if (columns.length === 0) {
    throw new Error("No se encontraron cabeceras");
  }

  const rows: ExcelRow[] = matrix.slice(1).map((line) => {
    const row: ExcelRow = {};
    columns.forEach((column, index) => {
      row[column.id] = toCellValue(line?.[index]);
    });
    return row;
  });

  return {
    fileName: file.name,
    sheetName,
    columns,
    rows,
  };
}

export function isNumericColumn(rows: ExcelRow[], columnId: string): boolean {
  const values = rows
    .map((row) => row[columnId])
    .filter((value) => value !== null && value !== "");

  if (values.length === 0) return false;

  return values.every((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return true;
    if (typeof value === "string") {
      const normalized = value.replace(",", ".").trim();
      return normalized !== "" && Number.isFinite(Number(normalized));
    }
    return false;
  });
}

export function toNumber(value: string | number | boolean | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function sumColumn(rows: ExcelRow[], columnId: string): number {
  return rows.reduce((acc, row) => {
    const n = toNumber(row[columnId]);
    return n === null ? acc : acc + n;
  }, 0);
}
