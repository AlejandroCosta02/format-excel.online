import { formulaPatternForTemplate } from "@/lib/excel/formulas";
import { templateConfigSchema, type TemplateConfig } from "@/lib/schemas/template";
import { DEFAULT_COLUMN_STYLE, type ColumnMeta } from "@/types/excel";

export function buildTemplateConfig(input: {
  originalColumns: ColumnMeta[];
  visibleColumns: ColumnMeta[];
  templateName?: string;
}): TemplateConfig {
  const visibleIds = new Set(input.visibleColumns.map((column) => column.id));
  const originalHeaders = input.originalColumns.map((column) => column.header);
  const removed = input.originalColumns
    .filter((column) => !visibleIds.has(column.id))
    .map((column) => column.header);

  const column_styles = input.visibleColumns
    .filter((column) => {
      const style = column.style;
      return (
        style.bg_color !== DEFAULT_COLUMN_STYLE.bg_color ||
        style.font_color !== DEFAULT_COLUMN_STYLE.font_color ||
        style.font_size !== DEFAULT_COLUMN_STYLE.font_size ||
        style.bold !== DEFAULT_COLUMN_STYLE.bold
      );
    })
    .map((column) => ({
      column: column.header,
      bg_color: column.style.bg_color,
      font_color: column.style.font_color,
      bold: column.style.bold,
      font_size: column.style.font_size,
    }));

  const operations = input.visibleColumns
    .filter((column) => column.summary)
    .map((column) => ({ column: column.header, type: "SUM" as const }));

  const formulas = input.visibleColumns
    .filter((column) => column.formula)
    .map((column) => ({
      target_column: column.header,
      formula_pattern: formulaPatternForTemplate(column.formula!, input.visibleColumns),
    }));

  const added_columns = input.visibleColumns.flatMap((column, index) => {
    if (!column.formula) return [];
    const previous = input.visibleColumns[index - 1];
    return [
      {
        header: column.header,
        insert_after: previous?.header ?? null,
        formula: column.formula,
      },
    ];
  });

  const config: TemplateConfig = {
    template_id: `tpl_${Date.now()}`,
    template_name: input.templateName ?? "Plantilla sin título",
    match_criteria: {
      expected_columns: originalHeaders,
    },
    actions: {
      remove_columns: removed,
      column_styles,
      formulas,
      added_columns,
      summary_row: {
        enabled: operations.length > 0,
        operations,
      },
    },
  };

  return templateConfigSchema.parse(config);
}
