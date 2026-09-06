"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Layers3, Lock } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ManifestPreviewTable } from "@/components/manifest-preview-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { triggerDownload } from "@/lib/scripts/mail-merge";
import {
  detectManifestColumns,
  exportExtractedCsv,
  exportExtractedXlsx,
  extractRows,
  guessKeyColumn,
  MANIFEST_GUEST_MAX_BYTES,
  mergeExtractedTables,
  parseManifestMatrix,
  parseSearchQuery,
  type ExtractedTable,
  type ExtractOptions,
  type ManifestMatrix,
  type ManifestSchema,
} from "@/lib/scripts/manifest-extractor";
import { fetchSampleFile, SAMPLE_FILES } from "@/lib/samples/files";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type LoadedSheet = {
  fileName: string;
  matrix: ManifestMatrix;
  schema: ManifestSchema;
};

export function ManifestExtractorTool() {
  const { isPro, requirePro } = useAuth();
  const { t } = useI18n();
  const [sheets, setSheets] = useState<LoadedSheet[]>([]);
  const [targetColumn, setTargetColumn] = useState("");
  const [searchRaw, setSearchRaw] = useState("");
  const [outputColumns, setOutputColumns] = useState<string[]>([]);
  const [result, setResult] = useState<ExtractedTable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primary = sheets[0];
  const columns = primary?.schema.columns ?? [];
  const queries = useMemo(() => parseSearchQuery(searchRaw), [searchRaw]);

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files);
    setError(null);
    setResult(null);
    if (list.length === 0) return;

    if (list.length > 1) {
      if (
        !requirePro({
          title: "Extracción por lotes",
          description:
            "El plan gratis procesa un archivo. Pro aplica la misma regla a varios manifiestos.",
        })
      ) {
        return;
      }
    }

    const accepted: LoadedSheet[] = [];
    try {
      for (const file of list) {
        if (!isPro && file.size > MANIFEST_GUEST_MAX_BYTES) {
          requirePro({
            title: "Archivo demasiado grande",
            description:
              "El plan gratis extrae archivos de hasta 2 MB. Pasa a Pro para archivos mayores o lotes.",
          });
          return;
        }
        const buffer = await file.arrayBuffer();
        const matrix = parseManifestMatrix(buffer);
        if (matrix.length === 0) throw new Error(`${file.name} está vacío`);
        const schema = detectManifestColumns(matrix);
        if (schema.columns.length === 0) throw new Error(`No se detectaron columnas en ${file.name}`);
        accepted.push({ fileName: file.name, matrix, schema });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo");
      return;
    }

    const first = accepted[0];
    setSheets(accepted);
    setTargetColumn((current) =>
      first.schema.columns.includes(current) ? current : guessKeyColumn(first.schema.columns),
    );
    setOutputColumns(first.schema.columns);
  }

  function toggleOutput(column: string) {
    setOutputColumns((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
    );
    setResult(null);
  }

  function extractOptions(): ExtractOptions {
    return {
      targetColumn,
      searchQuery: queries,
      outputColumns: outputColumns.length > 0 ? outputColumns : columns,
    };
  }

  function runExtract() {
    if (!primary || !targetColumn || queries.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const options = extractOptions();
      const tables: ExtractedTable[] = [];
      const sourceNames: string[] = [];
      const failed: string[] = [];
      for (const sheet of sheets) {
        try {
          tables.push(extractRows(sheet.matrix, options, sheet.schema));
          sourceNames.push(sheet.fileName);
        } catch {
          failed.push(sheet.fileName);
        }
      }
      if (tables.length === 0) {
        setError(
          failed.length > 0
            ? `Ningún archivo tiene la columna “${targetColumn}”.`
            : "No se pudo extraer",
        );
        return;
      }
      const merged = mergeExtractedTables(tables, sourceNames);
      if (merged.rows.length === 0) {
        setResult(merged);
        setError("Ninguna fila coincidió con los términos en la columna seleccionada.");
        return;
      }
      setResult(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function download(format: "xlsx" | "csv") {
    if (!result || result.rows.length === 0) return;
    setBusy(true);
    try {
      if (format === "xlsx") {
        triggerDownload(await exportExtractedXlsx(result), "extraccion.xlsx");
      } else {
        triggerDownload(exportExtractedCsv(result), "extraccion.csv");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar");
    } finally {
      setBusy(false);
    }
  }

  function requestBatch() {
    if (
      !requirePro({
        title: "Procesar varios archivos",
        description:
          "Con Pro puedes aplicar la misma columna clave, términos y columnas de salida a varios manifiestos a la vez.",
      })
    ) {
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.multiple = true;
    input.onchange = () => {
      if (input.files) void ingestFiles(input.files);
    };
    input.click();
  }

  const canExtract = Boolean(primary) && Boolean(targetColumn) && queries.length > 0 && outputColumns.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Elige la columna de búsqueda, los valores a filtrar y las columnas del resultado.
        </p>
        <Badge variant="secondary">{isPro ? "Pro · lotes" : "Gratis · 1 archivo ≤ 2 MB"}</Badge>
      </div>

      <label
        className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card px-6 py-8 text-center hover:border-primary/50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void ingestFiles(event.dataTransfer.files);
        }}
      >
        <FileSpreadsheet className="mb-2 size-8 text-primary" />
        <p className="font-medium">Paso 1 · Arrastra el archivo o haz clic</p>
        <p className="text-sm text-muted-foreground">.xlsx, .xls o .csv (PDF no está soportado)</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const sample = SAMPLE_FILES.manifest;
            void fetchSampleFile(sample.url, sample.name, sample.mime).then((file) => {
              void ingestFiles([file]);
              setSearchRaw("T100");
            });
          }}
        >
          {t.samples.try}
        </Button>
        {sheets.length > 0 ? (
          <p className="mt-2 text-sm text-excel">
            {sheets.map((sheet) => sheet.fileName).join(", ")}
          </p>
        ) : null}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void ingestFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {primary ? (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Paso 2 · Configuración de extracción</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="key-col">Columna clave</Label>
              <Select
                value={targetColumn || undefined}
                onValueChange={(value) => {
                  setTargetColumn(value);
                  setResult(null);
                }}
              >
                <SelectTrigger id="key-col" className="w-full max-w-full">
                  <SelectValue placeholder="Selecciona una columna" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="search-terms">Valores a extraer</Label>
              <Textarea
                id="search-terms"
                value={searchRaw}
                onChange={(event) => {
                  setSearchRaw(event.target.value);
                  setResult(null);
                }}
                placeholder="Uno o varios, separados por coma o salto de línea"
                className="min-h-20"
              />
              {queries.length > 0 ? (
                <p className="text-xs text-muted-foreground">{queries.length} término(s)</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Columnas de salida</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setOutputColumns(columns)}>
                  Todas
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOutputColumns([])}>
                  Ninguna
                </Button>
              </div>
            </div>
            <div className="grid max-h-40 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2">
              {columns.map((column) => {
                const checked = outputColumns.includes(column);
                return (
                  <label key={column} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={checked}
                      onChange={() => toggleOutput(column)}
                    />
                    <span className={cn("truncate", !checked && "text-muted-foreground")}>{column}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!canExtract || busy} onClick={runExtract}>
              {busy ? "Extrayendo…" : "Extraer datos"}
            </Button>
            <Button type="button" variant="outline" onClick={requestBatch}>
              {isPro ? <Layers3 data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
              Procesar en lote
              <Badge variant="outline" className="ml-1">
                Pro
              </Badge>
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Paso 3 · {result.rows.length} fila{result.rows.length === 1 ? "" : "s"} extraída
              {result.rows.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-excel text-excel-foreground hover:bg-excel-hover"
                disabled={busy || result.rows.length === 0}
                onClick={() => void download("xlsx")}
              >
                <Download data-icon="inline-start" />
                Descargar resultado
                <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                  Gratis · xlsx
                </Badge>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || result.rows.length === 0}
                onClick={() => void download("csv")}
              >
                CSV
              </Button>
            </div>
          </div>
          {result.rows.length > 0 ? (
            <ManifestPreviewTable headers={result.headers} rows={result.rows} />
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
