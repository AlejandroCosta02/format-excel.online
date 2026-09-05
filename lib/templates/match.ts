import type { TemplateConfig } from "@/lib/schemas/template";
import type { TemplateRecord } from "@/lib/templates/types";

export function headersMatch(fileHeaders: string[], expected: string[]): boolean {
  if (expected.length === 0) return false;
  const file = new Set(fileHeaders.map((header) => header.trim()));
  return expected.every((header) => file.has(header.trim()));
}

export function scoreTemplateMatch(fileHeaders: string[], config: TemplateConfig): number {
  const expected = config.match_criteria.expected_columns;
  if (!headersMatch(fileHeaders, expected)) return 0;
  const sameCount = fileHeaders.length === expected.length ? 1000 : 0;
  return expected.length + sameCount;
}

export function findMatchingTemplates(
  fileHeaders: string[],
  templates: TemplateRecord[],
): TemplateRecord[] {
  return templates
    .map((template) => ({
      template,
      score: scoreTemplateMatch(fileHeaders, template.config),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.template);
}
