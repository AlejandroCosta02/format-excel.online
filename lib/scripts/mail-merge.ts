/**
 * Mail Merge engine — port of `scripts/mail-merge/mail-merge.html`.
 * Original HTML kept as reference; this module is the TypeScript wrapper.
 */
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export type MailMergeRow = Record<string, unknown>;

export type MailMergePackage = {
  templateName: string;
  blob: Blob;
  pageCount: number;
};

export type MailMergeResult = {
  totalProcessedRows: number;
  packages: MailMergePackage[];
  master: MailMergePackage | null;
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PAGE_BREAK = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

export function parseMailMergeWorkbook(buffer: ArrayBuffer): MailMergeRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json<MailMergeRow>(workbook.Sheets[sheetName]);
}

export function uniqueTourNames(rows: MailMergeRow[]): string[] {
  const tours = rows
    .map((row) => (row["Tour Name"] ? String(row["Tour Name"]).trim() : null))
    .filter((value): value is string => Boolean(value));
  return [...new Set(tours)];
}

/** Placeholder aliases: original key, UPPERCASE, and underscore variants. */
export function expandRowKeys(row: MailMergeRow): Record<string, unknown> {
  const expanded: Record<string, unknown> = { ...row };
  for (const key of Object.keys(row)) {
    const upperKey = key.toUpperCase();
    const underscoreKey = key.replace(/[^a-zA-Z0-9]/g, "_");
    const underscoreKeyUpper = underscoreKey.toUpperCase();
    expanded[upperKey] = row[key];
    expanded[underscoreKey] = row[key];
    expanded[underscoreKeyUpper] = row[key];
  }
  return expanded;
}

function extractBodyContent(xmlString: string): string {
  const startTag = "<w:body>";
  const endTag = "</w:body>";
  const startIndex = xmlString.indexOf(startTag) + startTag.length;
  const endIndex = xmlString.indexOf(endTag);
  const bodyHtml = xmlString.substring(startIndex, endIndex);
  return bodyHtml.replace(/<w:sectPr[^]*?<\/w:sectPr>/g, "");
}

function createBlobFromXml(baseTemplateBuffer: ArrayBuffer, combinedBodyXml: string): Blob {
  const zip = new PizZip(baseTemplateBuffer.slice(0));
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("La plantilla Word no contiene word/document.xml");
  }
  const originalXml = documentFile.asText();
  const startTag = "<w:body>";
  const endTag = "</w:body>";
  const startIndex = originalXml.indexOf(startTag) + startTag.length;
  const endIndex = originalXml.indexOf(endTag);
  const sectPrMatch = originalXml
    .substring(startIndex, endIndex)
    .match(/<w:sectPr[^]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : "";
  const newDocumentXml =
    originalXml.substring(0, startIndex) + combinedBodyXml + sectPr + originalXml.substring(endIndex);
  zip.file("word/document.xml", newDocumentXml);
  return zip.generate({ type: "blob", mimeType: DOCX_MIME });
}

function renderRowXml(templateBuffer: ArrayBuffer, row: MailMergeRow): string {
  const zip = new PizZip(templateBuffer.slice(0));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(expandRowKeys(row));
  const xml = doc.getZip().file("word/document.xml")?.asText();
  if (!xml) {
    throw new Error("No se pudo leer el XML generado");
  }
  return extractBodyContent(xml);
}

export function countMappedRows(
  rows: MailMergeRow[],
  mapping: Record<string, string>,
): number {
  return rows.filter((row) => {
    if (!row["Tour Name"]) return false;
    const tourName = String(row["Tour Name"]).trim();
    return Boolean(mapping[tourName]);
  }).length;
}

export async function generateMailMergePackages(input: {
  rows: MailMergeRow[];
  templates: Record<string, ArrayBuffer>;
  mapping: Record<string, string>;
}): Promise<MailMergeResult> {
  const templatePackages: Record<string, string[]> = {};
  const masterPackageDocs: string[] = [];
  let baseTemplateBuffer: ArrayBuffer | null = null;
  let totalProcessedRows = 0;

  for (const row of input.rows) {
    if (!row["Tour Name"]) continue;
    const tourName = String(row["Tour Name"]).trim();
    const targetTemplateName = input.mapping[tourName];
    if (!targetTemplateName || !input.templates[targetTemplateName]) continue;

    if (!baseTemplateBuffer) {
      baseTemplateBuffer = input.templates[targetTemplateName];
    }

    try {
      const bodyContent = renderRowXml(input.templates[targetTemplateName], row);
      if (!templatePackages[targetTemplateName]) {
        templatePackages[targetTemplateName] = [];
      }
      templatePackages[targetTemplateName].push(bodyContent);
      masterPackageDocs.push(bodyContent);
      totalProcessedRows += 1;
    } catch (error) {
      console.error("Error processing row entry structure:", error);
    }
  }

  const packages: MailMergePackage[] = Object.entries(templatePackages)
    .filter(([, bodies]) => bodies.length > 0)
    .map(([templateName, bodies]) => ({
      templateName,
      pageCount: bodies.length,
      blob: createBlobFromXml(input.templates[templateName], bodies.join(PAGE_BREAK)),
    }));

  const master =
    masterPackageDocs.length > 0 && baseTemplateBuffer
      ? {
          templateName: "Master_Combined_Package.docx",
          pageCount: masterPackageDocs.length,
          blob: createBlobFromXml(baseTemplateBuffer, masterPackageDocs.join(PAGE_BREAK)),
        }
      : null;

  return { totalProcessedRows, packages, master };
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
