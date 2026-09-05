import { columnFormulaSchema } from "@/lib/excel/formulas";
import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Color hexadecimal de 6 dígitos");

export const columnStyleSchema = z.object({
  column: z.string().min(1),
  bg_color: hexColor,
  font_color: hexColor,
  bold: z.boolean(),
  font_size: z.number().int().min(8).max(32),
});

export const formulaActionSchema = z.object({
  target_column: z.string().min(1),
  formula_pattern: z.string().min(1),
});

export const summaryOperationSchema = z.object({
  column: z.string().min(1),
  type: z.literal("SUM"),
});

export const addedColumnSchema = z.object({
  header: z.string().min(1),
  insert_after: z.string().nullable(),
  formula: columnFormulaSchema,
});

export const templateConfigSchema = z.object({
  template_id: z.string().min(1),
  template_name: z.string().min(1),
  match_criteria: z.object({
    expected_columns: z.array(z.string()),
  }),
  actions: z.object({
    remove_columns: z.array(z.string()),
    column_styles: z.array(columnStyleSchema),
    formulas: z.array(formulaActionSchema),
    added_columns: z.array(addedColumnSchema),
    summary_row: z.object({
      enabled: z.boolean(),
      operations: z.array(summaryOperationSchema),
    }),
  }),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
