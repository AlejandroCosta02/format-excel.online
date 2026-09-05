/**
 * Generic spreadsheet row extractor (port of `scripts/manifest-extractor/`).
 * Column used as search key is chosen by the caller — never hardcoded.
 */
import * as XLSX from "xlsx";

export const MANIFEST_GUEST_MAX_BYTES = 2 * 1024 * 1024;

export type ManifestMatrix = unknown[][];

export type ExtractOptions = {
  targetColumn: string;
  searchQuery: string[];
  outputColumns?: string[];
};

export type ManifestSchema = {
  headerRowIndex: number;
  columns: string[];
};

export type ExtractedTable = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseManifestMatrix(buffer: ArrayBuffer): ManifestMatrix {
  const workbook = XLSX.read(buffer, { type: "array", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
  });
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function uniqueColumnNames(cells: unknown[]): string[] {
  let lastFilled = -1;
  cells.forEach((cell, index) => {
    if (cellText(cell)) lastFilled = index;
  });
  const width = Math.max(lastFilled + 1, 0);
  const used = new Set<string>();
  const names: string[] = [];
  for (let index = 0; index < width; index++) {
    const base = cellText(cells[index]) || `Columna ${index + 1}`;
    let name = base;
    let n = 2;
    while (used.has(name)) {
      name = `${base} (${n})`;
      n += 1;
    }
    used.add(name);
    names.push(name);
  }
  return names;
}

function looksLikeHeaderRow(row: unknown[]): boolean {
  const filled = row.map(cellText).filter(Boolean);
  if (filled.length < 2) return false;
  const numeric = filled.filter((cell) => /^-?\d+([.,]\d+)?$/.test(cell)).length;
  return numeric / filled.length < 0.6;
}

function isCruiseHeaderRow(row: unknown[]): boolean {
  const compact = row.map((cell) => cellText(cell).toLowerCase().replace(/\s/g, ""));
  return compact.includes("guestname") && compact.includes("tour#");
}

export function detectManifestColumns(matrix: ManifestMatrix): ManifestSchema {
  if (matrix.length === 0) return { headerRowIndex: 0, columns: [] };

  const scanLimit = Math.min(matrix.length, 40);
  for (let i = 0; i < scanLimit; i++) {
    if (isCruiseHeaderRow(matrix[i] ?? [])) {
      return { headerRowIndex: i, columns: uniqueColumnNames(matrix[i] ?? []) };
    }
  }
  for (let i = 0; i < scanLimit; i++) {
    if (looksLikeHeaderRow(matrix[i] ?? [])) {
      return { headerRowIndex: i, columns: uniqueColumnNames(matrix[i] ?? []) };
    }
  }

  return { headerRowIndex: 0, columns: uniqueColumnNames(matrix[0] ?? []) };
}

const KEY_COLUMN_HINTS = [
  /^tour\s*#?$/i,
  /tour\s*id/i,
  /^id$/i,
  /ticket/i,
  /booking/i,
  /reference/i,
  /folio/i,
  /passenger/i,
  /guest\s*name/i,
];

export function guessKeyColumn(columns: string[]): string {
  for (const hint of KEY_COLUMN_HINTS) {
    const match = columns.find((column) => hint.test(column.trim()));
    if (match) return match;
  }
  return columns[0] ?? "";
}

export function parseSearchQuery(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeMatchValue(value: unknown): string {
  return cellText(value).replace(/\s+/g, " ").toLowerCase();
}

function columnIndex(columns: string[], name: string): number {
  const exact = columns.indexOf(name);
  if (exact >= 0) return exact;
  const lowered = name.trim().toLowerCase();
  return columns.findIndex((column) => column.trim().toLowerCase() === lowered);
}

function rowMatchesQuery(cell: unknown, queries: string[]): boolean {
  const haystack = normalizeMatchValue(cell);
  if (!haystack) return false;
  return queries.some((query) => haystack === normalizeMatchValue(query));
}

function matrixToRecords(
  matrix: ManifestMatrix,
  schema: ManifestSchema,
): Record<string, string>[] {
  const { headerRowIndex, columns } = schema;
  const records: Record<string, string>[] = [];
  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const record: Record<string, string> = {};
    let any = false;
    columns.forEach((column, index) => {
      const value = cellText(row[index]);
      record[column] = value;
      if (value) any = true;
    });
    if (!any) continue;
    const looksLikeRepeatedHeader = columns.every(
      (column, index) => !cellText(row[index]) || normalizeMatchValue(row[index]) === normalizeMatchValue(column),
    );
    if (looksLikeRepeatedHeader) continue;
    records.push(record);
  }
  return records;
}

export function extractRows(
  matrix: ManifestMatrix,
  options: ExtractOptions,
  schema?: ManifestSchema,
): ExtractedTable {
  const resolved = schema ?? detectManifestColumns(matrix);
  const targetIndex = columnIndex(resolved.columns, options.targetColumn);
  if (targetIndex < 0) {
    throw new Error(`No existe la columna “${options.targetColumn}” en el archivo`);
  }

  const queries = options.searchQuery.map((item) => item.trim()).filter(Boolean);
  if (queries.length === 0) {
    return { headers: options.outputColumns?.length ? options.outputColumns : resolved.columns, rows: [] };
  }

  const wanted =
    options.outputColumns && options.outputColumns.length > 0
      ? options.outputColumns.filter((column) => columnIndex(resolved.columns, column) >= 0)
      : resolved.columns;

  if (wanted.length === 0) {
    throw new Error("Selecciona al menos una columna de salida");
  }

  const matched = matrixToRecords(matrix, resolved).filter((record) =>
    rowMatchesQuery(record[resolved.columns[targetIndex] ?? ""] ?? record[options.targetColumn], queries),
  );

  const rows = matched.map((record) => {
    const next: Record<string, string> = {};
    for (const header of wanted) {
      const source = resolved.columns[columnIndex(resolved.columns, header)];
      next[header] = source ? (record[source] ?? "") : "";
    }
    return next;
  });

  return { headers: wanted, rows };
}

export function mergeExtractedTables(tables: ExtractedTable[], sourceNames?: string[]): ExtractedTable {
  const headers = tables[0]?.headers ?? [];
  const includeSource = Boolean(sourceNames && sourceNames.length > 1);
  const outHeaders = includeSource && !headers.includes("Archivo") ? ["Archivo", ...headers] : headers;
  const rows: Record<string, string>[] = [];
  tables.forEach((table, index) => {
    for (const row of table.rows) {
      const aligned: Record<string, string> = {};
      for (const header of headers) {
        aligned[header] = row[header] ?? "";
      }
      if (includeSource) {
        rows.push({ Archivo: sourceNames![index] ?? "", ...aligned });
      } else {
        rows.push(aligned);
      }
    }
  });
  return { headers: outHeaders, rows };
}

function hexBorder(argb: string) {
  return {
    top: { style: "thin" as const, color: { argb } },
    left: { style: "thin" as const, color: { argb } },
    bottom: { style: "thin" as const, color: { argb } },
    right: { style: "thin" as const, color: { argb } },
  };
}

export async function exportExtractedXlsx(table: ExtractedTable): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracción");
  worksheet.columns = table.headers.map((header) => ({
    header,
    key: header,
    width: Math.min(45, Math.max(12, header.length + 4)),
  }));
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "000000" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = hexBorder("A6A6A6");
  });
  for (const item of table.rows) {
    const row = worksheet.addRow(table.headers.map((header) => item[header] ?? ""));
    row.height = 20;
    row.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = hexBorder("BFBFBF");
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function exportExtractedCsv(table: ExtractedTable): Blob {
  const aoa = [table.headers, ...table.rows.map((row) => table.headers.map((header) => row[header] ?? ""))];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}
