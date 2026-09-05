"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMailMergeQuota } from "@/hooks/use-mail-merge-quota";
import { consumeMailMergeQuota } from "@/lib/quotas/mail-merge";
import {
  countMappedRows,
  generateMailMergePackages,
  parseMailMergeWorkbook,
  triggerDownload,
  uniqueTourNames,
  type MailMergePackage,
  type MailMergeRow,
} from "@/lib/scripts/mail-merge";

const SKIP_VALUE = "__skip__";

export function MailMergeTool() {
  const { user, isPro, openUpgrade } = useAuth();
  const quota = useMailMergeQuota(user?.id ?? null, isPro);
  const [rows, setRows] = useState<MailMergeRow[]>([]);
  const [excelName, setExcelName] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, ArrayBuffer>>({});
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    total: number;
    packages: MailMergePackage[];
    master: MailMergePackage | null;
  } | null>(null);

  const tours = useMemo(() => uniqueTourNames(rows), [rows]);
  const templateNames = Object.keys(templates);

  async function onExcel(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    const buffer = await file.arrayBuffer();
    const parsed = parseMailMergeWorkbook(buffer);
    setRows(parsed);
    setExcelName(file.name);
    setMapping({});
  }

  async function onTemplates(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setResult(null);
    const next: Record<string, ArrayBuffer> = {};
    for (const file of Array.from(fileList)) {
      next[file.name] = await file.arrayBuffer();
    }
    setTemplates(next);
    setMapping({});
  }

  async function generate() {
    const activeMapping = Object.fromEntries(
      Object.entries(mapping).filter(([, value]) => value && value !== SKIP_VALUE),
    );
    if (Object.keys(activeMapping).length === 0) {
      setError("Asigna una plantilla a al menos un Tour Name.");
      return;
    }

    const needed = countMappedRows(rows, activeMapping);
    const overQuota = !isPro && (quota.remaining <= 0 || needed > quota.remaining);
    if (overQuota) {
      openUpgrade();
      setError(
        "Has alcanzado tu límite diario gratuito. Actualiza a Pro para envíos ilimitados.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const generated = await generateMailMergePackages({
        rows,
        templates,
        mapping: activeMapping,
      });
      if (!isPro) {
        consumeMailMergeQuota(generated.totalProcessedRows, {
          userId: user?.id ?? null,
          isPro: false,
        });
      }
      setResult({
        total: generated.totalProcessedRows,
        packages: generated.packages,
        master: generated.master,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron generar los documentos");
    } finally {
      setBusy(false);
    }
  }

  const ready = rows.length > 0 && templateNames.length > 0;
  const quotaBlocked = !isPro && quota.remaining <= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Motor portado desde <code className="font-mono text-xs">scripts/mail-merge/</code>.
          Placeholders: <code className="font-mono text-xs">{"{GUEST_NAME}"}</code>,{" "}
          <code className="font-mono text-xs">{"{FOLIO}"}</code>.
        </p>
        <Badge variant={isPro ? "default" : "secondary"}>
          {isPro
            ? "Pro · ilimitado"
            : `${quota.remaining}/${quota.limit} envíos restantes hoy (${user ? "cuenta gratis" : "invitado"})`}
        </Badge>
      </div>

      <ul className="list-disc space-y-1 rounded-xl border bg-white px-5 py-4 text-sm text-slate-600">
        <li>Prepara el Excel (p. ej. Lat2.0) y elimina filas no vendidas.</li>
        <li>Si hace falta, incluye columnas Section y Desk #.</li>
        <li>Las etiquetas del .docx van entre llaves simples.</li>
      </ul>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-white px-4 py-8 text-center hover:border-primary/50">
          <FileSpreadsheet className="mb-2 size-8 text-primary" />
          <p className="font-medium">1. Fuente de datos</p>
          <p className="text-sm text-muted-foreground">Excel o CSV</p>
          {excelName ? <p className="mt-2 text-sm text-excel">{excelName}</p> : null}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => void onExcel(event.target.files?.[0])}
          />
        </label>
        <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-white px-4 py-8 text-center hover:border-primary/50">
          <FileText className="mb-2 size-8 text-primary" />
          <p className="font-medium">2. Plantillas Word</p>
          <p className="text-sm text-muted-foreground">Uno o varios .docx</p>
          {templateNames.length > 0 ? (
            <p className="mt-2 text-sm text-excel">{templateNames.join(", ")}</p>
          ) : null}
          <input
            type="file"
            accept=".docx"
            multiple
            className="hidden"
            onChange={(event) => void onTemplates(event.target.files)}
          />
        </label>
      </div>

      {ready ? (
        <Card className="bg-white ring-border">
          <CardHeader>
            <CardTitle className="text-base">Asignación de plantillas</CardTitle>
            <CardDescription>
              Las filas sin tour o sin plantilla se ignoran.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Tour Name</th>
                    <th className="py-2 font-medium">Plantilla</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <tr key={tour} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{tour}</td>
                      <td className="py-2">
                        <Select
                          value={mapping[tour] ?? SKIP_VALUE}
                          onValueChange={(value) =>
                            setMapping((current) => ({ ...current, [tour]: value }))
                          }
                        >
                          <SelectTrigger className="w-full max-w-sm">
                            <SelectValue placeholder="Omitir este tour" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SKIP_VALUE}>Omitir este tour</SelectItem>
                            {templateNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quotaBlocked ? (
              <div className="rounded-xl border border-primary/30 bg-accent p-3 text-sm">
                <p>
                  Has alcanzado tu límite diario gratuito. Actualiza a Pro para envíos
                  ilimitados.
                </p>
                <Button type="button" className="mt-2" onClick={openUpgrade}>
                  Obtener Plan Pro
                </Button>
              </div>
            ) : null}
            <Button type="button" onClick={() => void generate()} disabled={busy || quotaBlocked}>
              {busy ? "Generando…" : "Generar documentos"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <Card className="bg-white ring-border">
          <CardHeader>
            <CardTitle className="text-base">Descargas</CardTitle>
            <CardDescription>
              {result.total} cartas generadas. Paquetes por plantilla y documento maestro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {result.packages.map((pkg) => (
              <Button
                key={pkg.templateName}
                type="button"
                variant="secondary"
                className="justify-start"
                onClick={() =>
                  triggerDownload(
                    pkg.blob,
                    `${pkg.templateName.replace(/\.docx$/i, "")}_Package.docx`,
                  )
                }
              >
                Descargar {pkg.templateName.replace(/\.docx$/i, "")} ({pkg.pageCount} págs.)
              </Button>
            ))}
            {result.master ? (
              <Button
                type="button"
                className="bg-excel text-excel-foreground hover:bg-excel-hover"
                onClick={() =>
                  triggerDownload(result.master!.blob, "Master_Combined_Package.docx")
                }
              >
                Descargar paquete combinado ({result.master.pageCount} págs.)
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
