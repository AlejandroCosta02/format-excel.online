export const SAMPLE_FILES = {
  formatter: {
    url: "/samples/formatter-demo.xlsx",
    name: "formatter-demo.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  manifest: {
    url: "/samples/manifest-demo.xlsx",
    name: "manifest-demo.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  mailExcel: {
    url: "/samples/mail-merge-demo.xlsx",
    name: "mail-merge-demo.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  mailDocx: {
    url: "/samples/letter-template.docx",
    name: "letter-template.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
} as const;

export async function fetchSampleFile(url: string, name: string, mime: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load the sample file");
  }
  const blob = await response.blob();
  return new File([blob], name, { type: mime });
}
