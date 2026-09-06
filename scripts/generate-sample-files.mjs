import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const PizZip = require("pizzip");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "samples");
mkdirSync(outDir, { recursive: true });

function writeWorkbook(fileName, rows) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  writeFileSync(join(outDir, fileName), buffer);
}

writeWorkbook("formatter-demo.xlsx", [
  { Name: "Ana Pérez", Email: "ana@example.com", Amount: 120, Status: "Paid", InternalNotes: "VIP" },
  { Name: "Luis Gómez", Email: "luis@example.com", Amount: 85, Status: "Pending", InternalNotes: "Call back" },
  { Name: "María Díaz", Email: "maria@example.com", Amount: 240, Status: "Paid", InternalNotes: "" },
]);

writeWorkbook("manifest-demo.xlsx", [
  { GuestName: "Ana Pérez", "Tour#": "T100", Cabin: "1204", Desk: "A1", Status: "OK" },
  { GuestName: "Luis Gómez", "Tour#": "T100", Cabin: "1205", Desk: "A1", Status: "OK" },
  { GuestName: "María Díaz", "Tour#": "T200", Cabin: "2201", Desk: "B3", Status: "Waitlist" },
  { GuestName: "Carlos Ruiz", "Tour#": "T200", Cabin: "2202", Desk: "B3", Status: "OK" },
]);

writeWorkbook("mail-merge-demo.xlsx", [
  { "Tour Name": "City Walk", GUEST_NAME: "Ana Pérez", FOLIO: "1001", CUENTA_ID: "A-01" },
  { "Tour Name": "City Walk", GUEST_NAME: "Luis Gómez", FOLIO: "1002", CUENTA_ID: "A-02" },
  { "Tour Name": "Sunset Sail", GUEST_NAME: "María Díaz", FOLIO: "1003", CUENTA_ID: "B-10" },
]);

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Dear {GUEST_NAME},</w:t></w:r></w:p>
    <w:p><w:r><w:t>This is a FormatExcel sample letter.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Folio: {FOLIO}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Account: {CUENTA_ID}</w:t></w:r></w:p>
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

const zip = new PizZip();
zip.file("[Content_Types].xml", contentTypes);
zip.file("_rels/.rels", rels);
zip.file("word/document.xml", documentXml);
zip.file("word/_rels/document.xml.rels", docRels);
writeFileSync(join(outDir, "letter-template.docx"), zip.generate({ type: "nodebuffer" }));

console.log("Wrote sample files to public/samples");
