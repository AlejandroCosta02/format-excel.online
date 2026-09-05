import type { ColumnFormula, ColumnMeta, ExcelRow } from "@/types/excel";
import { applyFormulaToRows, nextColumnId } from "@/lib/excel/formulas";
import type { TemplateConfig } from "@/lib/schemas/template";
import { DEFAULT_COLUMN_STYLE } from "@/types/excel";

function resolveColumn(columns: ColumnMeta[], headerOrId: string): ColumnMeta | undefined {
  return columns.find((column) => column.id === headerOrId || column.header === headerOrId);
}

function remapFormula(formula: ColumnFormula, columns: ColumnMeta[]): ColumnFormula {
  const id = (headerOrId: string) => resolveColumn(columns, headerOrId)?.id ?? headerOrId;

  switch (formula.kind) {
    case "sum":
    case "average":
    case "concat":
      return { ...formula, sourceIds: formula.sourceIds.map(id) };
    case "subtract":
      return { ...formula, leftId: id(formula.leftId), rightId: id(formula.rightId) };
    case "binary":
      return {
        ...formula,
        leftId: id(formula.leftId),
        right:
          formula.right.type === "column"
            ? { type: "column", id: id(formula.right.id) }
            : formula.right,
      };
    case "multiply":
      return { ...formula, sourceId: id(formula.sourceId) };
    default:
      return formula;
  }
}

export function applyTemplateConfig(input: {
  originalColumns: ColumnMeta[];
  rows: ExcelRow[];
  config: TemplateConfig;
}): { columns: ColumnMeta[]; rows: ExcelRow[] } {
  const remove = new Set(input.config.actions.remove_columns);
  let columns = input.originalColumns
    .filter((column) => !remove.has(column.header))
    .map((column) => ({ ...column, style: { ...column.style } }));
  let rows = input.rows.map((row) => ({ ...row }));

  for (const style of input.config.actions.column_styles) {
    columns = columns.map((column) =>
      column.header === style.column
        ? {
            ...column,
            style: {
              bg_color: style.bg_color,
              font_color: style.font_color,
              bold: style.bold,
              font_size: style.font_size,
            },
          }
        : column,
    );
  }

  if (input.config.actions.summary_row.enabled) {
    const ops = new Set(input.config.actions.summary_row.operations.map((op) => op.column));
    columns = columns.map((column) =>
      ops.has(column.header) ? { ...column, summary: true } : column,
    );
  }

  for (const added of input.config.actions.added_columns) {
    const formula = remapFormula(added.formula, columns);
    const columnId = nextColumnId(added.header, columns);
    const column: ColumnMeta = {
      id: columnId,
      header: added.header,
      style: { ...DEFAULT_COLUMN_STYLE, bg_color: "#E6F4EA", font_color: "#137333" },
      summary: false,
      formula,
    };
    const after = added.insert_after
      ? columns.findIndex((item) => item.header === added.insert_after || item.id === added.insert_after)
      : -1;
    const insertAt = after >= 0 ? after + 1 : columns.length;
    columns = [...columns.slice(0, insertAt), column, ...columns.slice(insertAt)];
    rows = applyFormulaToRows(rows, columnId, formula, columns);
  }

  return { columns, rows };
}
