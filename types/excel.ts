/** Cell values kept in the in-browser workbook preview. */
export type CellValue = string | number | boolean | null;

export type ExcelRow = Record<string, CellValue>;

export type ColumnStyle = {
  bg_color: string;
  font_color: string;
  bold: boolean;
  font_size: number;
};

export const DEFAULT_COLUMN_STYLE: ColumnStyle = {
  bg_color: "#F1F5F9",
  font_color: "#0F172A",
  bold: true,
  font_size: 11,
};

export type BinaryOperator = "+" | "-" | "*" | "/";

export type FormulaOperand =
  | { type: "column"; id: string }
  | { type: "number"; value: number };

export type ColumnFormula =
  | { kind: "sum"; sourceIds: string[] }
  | { kind: "subtract"; leftId: string; rightId: string }
  | { kind: "average"; sourceIds: string[] }
  | { kind: "concat"; sourceIds: string[]; separator: string }
  | { kind: "constant"; value: string }
  | { kind: "binary"; leftId: string; operator: BinaryOperator; right: FormulaOperand }
  | { kind: "multiply"; sourceId: string; factor: number }
  | { kind: "excel"; pattern: string };

export type ColumnMeta = {
  /** Stable key used in row records (unique even if headers repeat). */
  id: string;
  header: string;
  style: ColumnStyle;
  /** When true, a SUM footer is appended for numeric columns. */
  summary: boolean;
  /** Computed column (preview + native Excel formula on export). */
  formula?: ColumnFormula;
};

export type ParsedWorkbook = {
  fileName: string;
  sheetName: string;
  columns: ColumnMeta[];
  rows: ExcelRow[];
};

export type EditorWorkbook = ParsedWorkbook;
