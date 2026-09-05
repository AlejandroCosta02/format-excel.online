import { letterToIndex } from "@/lib/excel/column-letter";
import { toNumber } from "@/lib/excel/parse";
import type { CellValue, ColumnMeta, ExcelRow } from "@/types/excel";

/** Shown in the preview grid when the formula cannot be simulated in-browser. Export still writes the native Excel formula. */
export const EXCEL_PREVIEW_FALLBACK = "[Fórmula Excel]";

function cellDisplayValue(row: ExcelRow, columns: ColumnMeta[], letters: string): { ok: true; js: string } | { ok: false } {
  const index = letterToIndex(letters);
  const column = columns[index];
  if (!column) return { ok: false };
  const value = row[column.id];
  if (value === null || value === undefined || value === "") {
    return { ok: true, js: `""` };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ok: true, js: String(value) };
  }
  if (typeof value === "boolean") {
    return { ok: true, js: value ? "TRUE" : "FALSE" };
  }
  return { ok: true, js: JSON.stringify(String(value)) };
}

function stripOuterQuotes(token: string): string {
  const t = token.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).replace(/""/g, '"');
  }
  return t;
}

function parseLiteral(token: string): unknown {
  const t = token.trim();
  if (t === "") return "";
  if (t === "TRUE") return true;
  if (t === "FALSE") return false;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return stripOuterQuotes(t);
  }
  const n = Number(t.replace(",", "."));
  if (Number.isFinite(n) && t !== "") return n;
  return stripOuterQuotes(t);
}

function hoursFromTimeText(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const seconds = m[3] ? Number(m[3]) : 0;
  const meridiem = m[4]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours + minutes / 60 + seconds / 3600;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const text = String(value).trim();
  if (text === "") return null;
  const fromTime = hoursFromTimeText(text);
  if (fromTime !== null) return fromTime;
  const n = toNumber(text);
  return n;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function splitExcelArgs(inner: string): string[] {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      current += ch;
      continue;
    }
    if ((ch === "," || ch === ";") && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim() !== "") args.push(current.trim());
  return args;
}

function findInnermostCall(
  expr: string,
): { start: number; end: number; name: string; inner: string } | null {
  let quote: '"' | "'" | null = null;
  let nameStart = -1;
  const stack: { name: string; nameStart: number; open: number }[] = [];

  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      nameStart = -1;
      continue;
    }
    if (/[A-Za-z._]/.test(ch)) {
      if (nameStart < 0) nameStart = i;
      continue;
    }
    if (ch === "(" && nameStart >= 0) {
      const name = expr.slice(nameStart, i);
      if (/^[A-Za-z][A-Za-z0-9._]*$/.test(name)) {
        stack.push({ name, nameStart, open: i });
      }
      nameStart = -1;
      continue;
    }
    nameStart = -1;
    if (ch === ")" && stack.length > 0) {
      const call = stack.pop()!;
      return {
        start: call.nameStart,
        end: i + 1,
        name: call.name,
        inner: expr.slice(call.open + 1, i),
      };
    }
  }
  return null;
}

function callExcelFn(name: string, rawArgs: string[]): unknown {
  const fn = name.toUpperCase();
  const args = rawArgs.map(parseLiteral);

  switch (fn) {
    case "TEXTBEFORE": {
      const text = asText(args[0]);
      const delimiter = asText(args[1]);
      if (delimiter === "") return text;
      const cut = text.indexOf(delimiter);
      if (cut < 0) return args[5] !== undefined ? args[5] : text;
      return text.slice(0, cut);
    }
    case "TEXTAFTER": {
      const text = asText(args[0]);
      const delimiter = asText(args[1]);
      const pos = text.indexOf(delimiter);
      if (pos < 0) return args[5] !== undefined ? args[5] : text;
      return text.slice(pos + delimiter.length);
    }
    case "LEFT":
      return asText(args[0]).slice(0, typeof args[1] === "number" ? args[1] : 1);
    case "RIGHT": {
      const text = asText(args[0]);
      const n = typeof args[1] === "number" ? args[1] : 1;
      return text.slice(Math.max(0, text.length - n));
    }
    case "MID": {
      const start = typeof args[1] === "number" ? Math.max(1, args[1]) : 1;
      const len = typeof args[2] === "number" ? args[2] : 0;
      return asText(args[0]).slice(start - 1, start - 1 + len);
    }
    case "LEN":
      return asText(args[0]).length;
    case "TRIM":
      return asText(args[0]).trim().replace(/\s+/g, " ");
    case "UPPER":
      return asText(args[0]).toUpperCase();
    case "LOWER":
      return asText(args[0]).toLowerCase();
    case "VALUE": {
      const n = asNumber(args[0]);
      if (n === null) throw new Error("VALUE");
      return n;
    }
    case "TIMEVALUE": {
      const hours = hoursFromTimeText(asText(args[0]));
      if (hours === null) throw new Error("TIMEVALUE");
      return hours / 24;
    }
    case "IF": {
      const cond = args[0];
      const truthy =
        cond === true || (typeof cond === "number" && cond !== 0) || String(cond).toUpperCase() === "TRUE";
      return truthy ? args[1] : args[2];
    }
    case "IFERROR":
      return args[0];
    case "SUM":
    case "AVERAGE": {
      const nums = args.map(asNumber).filter((n): n is number => n !== null);
      if (nums.length === 0) return 0;
      const total = nums.reduce((a, b) => a + b, 0);
      return fn === "AVERAGE" ? total / nums.length : total;
    }
    case "CONCAT":
    case "CONCATENATE":
    case "TEXTJOIN":
      if (fn === "TEXTJOIN") {
        const delim = asText(args[0]);
        return args.slice(2).map(asText).join(delim);
      }
      return args.map(asText).join("");
    case "ROUND": {
      const n = asNumber(args[0]);
      const digits = typeof args[1] === "number" ? args[1] : 0;
      if (n === null) return null;
      const p = 10 ** digits;
      return Math.round(n * p) / p;
    }
    case "ABS": {
      const n = asNumber(args[0]);
      return n === null ? null : Math.abs(n);
    }
    case "TEXT":
      return asText(args[0]);
    default:
      throw new Error(`unsupported:${fn}`);
  }
}

function injectValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value === null || value === undefined) return "0";
  const numeric = asNumber(value);
  if (numeric !== null && String(value).trim() !== "" && typeof value !== "boolean") {
    if (typeof value === "string" && hoursFromTimeText(value) !== null) {
      return String(numeric);
    }
    if (typeof value === "string" && /^-?\d+([.,]\d+)?$/.test(value.trim())) {
      return String(numeric);
    }
  }
  return JSON.stringify(asText(value));
}

function evalArithmetic(expr: string): number {
  if (!/^[\d.\s+\-*/()]+$/.test(expr)) {
    throw new Error("unsafe");
  }
  const result = Function(`"use strict"; return (${expr})`)() as unknown;
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("nan");
  }
  return result;
}

/**
 * Client-side preview of an Excel pattern like `=F{row}+(TEXTBEFORE(N{row}, " ")/24)`.
 * Unknown functions return {@link EXCEL_PREVIEW_FALLBACK} without blocking export.
 */
export function evaluateExcelPatternForPreview(
  row: ExcelRow,
  columns: ColumnMeta[],
  pattern: string,
): CellValue {
  let expr = pattern.trim().replace(/^=/, "");
  expr = expr.replace(/([A-Za-z]{1,3})\{row\}/g, (match, letters: string) => {
    const mapped = cellDisplayValue(row, columns, letters);
    if (!mapped.ok) return match;
    return mapped.js;
  });

  try {
    let guard = 0;
    while (guard < 32) {
      const call = findInnermostCall(expr);
      if (!call) break;
      const args = splitExcelArgs(call.inner);
      const result = callExcelFn(call.name, args);
      expr = expr.slice(0, call.start) + injectValue(result) + expr.slice(call.end);
      guard += 1;
    }

    if (/^[A-Za-z][A-Za-z0-9._]*\(/.test(expr)) {
      return EXCEL_PREVIEW_FALLBACK;
    }

    const remaining = expr.trim();
    if (
      (remaining.startsWith('"') && remaining.endsWith('"')) ||
      (remaining.startsWith("'") && remaining.endsWith("'"))
    ) {
      return stripOuterQuotes(remaining);
    }

    try {
      return evalArithmetic(remaining);
    } catch {
      return EXCEL_PREVIEW_FALLBACK;
    }
  } catch {
    return EXCEL_PREVIEW_FALLBACK;
  }
}
