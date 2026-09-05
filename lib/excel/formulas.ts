import { z } from "zod";
import { columnLetter } from "@/lib/excel/column-letter";
import { evaluateExcelPatternForPreview } from "@/lib/excel/excel-preview-eval";
import { toNumber } from "@/lib/excel/parse";
import type { CellValue, ColumnFormula, ColumnMeta, ExcelRow, FormulaOperand } from "@/types/excel";

export const binaryOperatorSchema = z.enum(["+", "-", "*", "/"]);

export const formulaOperandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("column"), id: z.string().min(1) }),
  z.object({ type: z.literal("number"), value: z.number().finite() }),
]);

const excelPatternSchema = z
  .string()
  .trim()
  .min(1, "La fórmula no puede estar vacía")
  .max(4000, "La fórmula es demasiado larga");

export const columnFormulaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("sum"),
    sourceIds: z.array(z.string().min(1)).min(2),
  }),
  z.object({
    kind: z.literal("subtract"),
    leftId: z.string().min(1),
    rightId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("average"),
    sourceIds: z.array(z.string().min(1)).min(2),
  }),
  z.object({
    kind: z.literal("concat"),
    sourceIds: z.array(z.string().min(1)).min(2),
    separator: z.string(),
  }),
  z.object({
    kind: z.literal("constant"),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("binary"),
    leftId: z.string().min(1),
    operator: binaryOperatorSchema,
    right: formulaOperandSchema,
  }),
  z.object({
    kind: z.literal("multiply"),
    sourceId: z.string().min(1),
    factor: z.number().finite(),
  }),
  z.object({
    kind: z.literal("excel"),
    pattern: excelPatternSchema,
  }),
]);

function applyOp(left: number, operator: "+" | "-" | "*" | "/", right: number): number | null {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? null : left / right;
  }
}

function operandValue(row: ExcelRow, operand: FormulaOperand): number | null {
  if (operand.type === "number") return operand.value;
  return toNumber(row[operand.id] ?? null);
}

export function formulaSourceIds(formula: ColumnFormula): string[] {
  switch (formula.kind) {
    case "sum":
    case "average":
    case "concat":
      return formula.sourceIds;
    case "subtract":
      return [formula.leftId, formula.rightId];
    case "binary":
      return formula.right.type === "column"
        ? [formula.leftId, formula.right.id]
        : [formula.leftId];
    case "multiply":
      return [formula.sourceId];
    case "constant":
    case "excel":
      return [];
  }
}

function evaluateExcelPattern(
  row: ExcelRow,
  columns: ColumnMeta[],
  pattern: string,
): CellValue {
  return evaluateExcelPatternForPreview(row, columns, pattern);
}

export function evaluateFormula(
  row: ExcelRow,
  formula: ColumnFormula,
  columns: ColumnMeta[] = [],
): CellValue {
  switch (formula.kind) {
    case "sum": {
      const nums = formula.sourceIds
        .map((id) => toNumber(row[id] ?? null))
        .filter((n): n is number => n !== null);
      return nums.length === 0 ? null : nums.reduce((acc, n) => acc + n, 0);
    }
    case "subtract": {
      const left = toNumber(row[formula.leftId] ?? null);
      const right = toNumber(row[formula.rightId] ?? null);
      if (left === null || right === null) return null;
      return left - right;
    }
    case "average": {
      const nums = formula.sourceIds
        .map((id) => toNumber(row[id] ?? null))
        .filter((n): n is number => n !== null);
      return nums.length === 0 ? null : nums.reduce((acc, n) => acc + n, 0) / nums.length;
    }
    case "concat": {
      return formula.sourceIds
        .map((id) => {
          const value = row[id];
          return value === null || value === undefined ? "" : String(value);
        })
        .join(formula.separator);
    }
    case "constant":
      return formula.value;
    case "binary": {
      const left = toNumber(row[formula.leftId] ?? null);
      const right = operandValue(row, formula.right);
      if (left === null || right === null) return null;
      return applyOp(left, formula.operator, right);
    }
    case "multiply": {
      const n = toNumber(row[formula.sourceId] ?? null);
      return n === null ? null : n * formula.factor;
    }
    case "excel":
      return evaluateExcelPattern(row, columns, formula.pattern);
  }
}

export function applyFormulaToRows(
  rows: ExcelRow[],
  columnId: string,
  formula: ColumnFormula,
  columns: ColumnMeta[],
): ExcelRow[] {
  return rows.map((row) => ({
    ...row,
    [columnId]: evaluateFormula(row, formula, columns),
  }));
}

export function nextColumnId(header: string, columns: ColumnMeta[]): string {
  const used = new Set(columns.map((column) => column.id));
  const base = header.trim() || "Columna";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}_${n}`;
    n += 1;
  }
  return id;
}

function cellRef(columns: ColumnMeta[], columnId: string, excelRow: number): string | null {
  const index = columns.findIndex((column) => column.id === columnId);
  if (index < 0) return null;
  return `${columnLetter(index)}${excelRow}`;
}

function operandExcel(columns: ColumnMeta[], operand: FormulaOperand, excelRow: number): string | null {
  if (operand.type === "number") return String(operand.value);
  return cellRef(columns, operand.id, excelRow);
}

function columnLabel(columns: ColumnMeta[], columnId: string): string {
  return columns.find((column) => column.id === columnId)?.header ?? columnId;
}

export function describeFormula(formula: ColumnFormula, columns: ColumnMeta[]): string {
  const name = (id: string) => columnLabel(columns, id);
  switch (formula.kind) {
    case "sum":
      return formula.sourceIds.map(name).join(" + ");
    case "subtract":
      return `${name(formula.leftId)} − ${name(formula.rightId)}`;
    case "average":
      return `AVG(${formula.sourceIds.map(name).join(", ")})`;
    case "concat":
      return formula.sourceIds.map(name).join(` + "${formula.separator}" + `);
    case "constant":
      return `"${formula.value}" (todas las filas)`;
    case "binary": {
      const right =
        formula.right.type === "number" ? String(formula.right.value) : name(formula.right.id);
      return `${name(formula.leftId)} ${formula.operator} ${right}`;
    }
    case "multiply":
      return `${name(formula.sourceId)} * ${formula.factor}`;
    case "excel":
      return formula.pattern.startsWith("=") ? formula.pattern : `=${formula.pattern}`;
  }
}

/** ExcelJS `formula` field (without leading =). */
export function toExcelFormula(
  formula: ColumnFormula,
  columns: ColumnMeta[],
  excelRow: number,
): string | null {
  const refs = (ids: string[]) =>
    ids.map((id) => cellRef(columns, id, excelRow)).filter((ref): ref is string => Boolean(ref));

  switch (formula.kind) {
    case "constant":
      return null;
    case "sum": {
      const cells = refs(formula.sourceIds);
      if (cells.length < 2) return null;
      return `SUM(${cells.join(",")})`;
    }
    case "subtract": {
      const left = cellRef(columns, formula.leftId, excelRow);
      const right = cellRef(columns, formula.rightId, excelRow);
      if (!left || !right) return null;
      return `${left}-${right}`;
    }
    case "average": {
      const cells = refs(formula.sourceIds);
      if (cells.length < 2) return null;
      return `AVERAGE(${cells.join(",")})`;
    }
    case "concat": {
      const cells = refs(formula.sourceIds);
      if (cells.length < 2) return null;
      const sep = JSON.stringify(formula.separator);
      return cells.join(`&${sep}&`);
    }
    case "binary": {
      const left = cellRef(columns, formula.leftId, excelRow);
      const right = operandExcel(columns, formula.right, excelRow);
      if (!left || !right) return null;
      return `${left}${formula.operator}${right}`;
    }
    case "multiply": {
      const left = cellRef(columns, formula.sourceId, excelRow);
      if (!left) return null;
      return `${left}*${formula.factor}`;
    }
    case "excel":
      return formula.pattern.trim().replace(/^=/, "").replace(/\{row\}/g, String(excelRow));
  }
}

export function formulaPatternForTemplate(formula: ColumnFormula, columns: ColumnMeta[]): string {
  if (formula.kind === "constant") return String(formula.value);
  if (formula.kind === "excel") {
    const pattern = formula.pattern.trim();
    return pattern.startsWith("=") ? pattern : `=${pattern}`;
  }
  const sample = toExcelFormula(formula, columns, 99999);
  return sample ? `=${sample.replace(/99999/g, "{row}")}` : formula.kind;
}
