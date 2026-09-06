"use client";

import { useState } from "react";
import { Download, Lock, Plus, Save } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SaveTemplateModal } from "@/components/save-template-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportStyledWorkbook } from "@/lib/excel/export";
import type { ColumnMeta, ExcelRow } from "@/types/excel";

type EditorToolbarProps = {
  fileName: string;
  sheetName: string;
  originalColumns: ColumnMeta[];
  columns: ColumnMeta[];
  rows: ExcelRow[];
  onAddColumn: () => void;
};

export function EditorToolbar({
  fileName,
  sheetName,
  originalColumns,
  columns,
  rows,
  onAddColumn,
}: EditorToolbarProps) {
  const { user, isPro, requirePro } = useAuth();
  const [saveOpen, setSaveOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await exportStyledWorkbook({
        fileName,
        sheetName,
        columns,
        rows,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  }

  function handleSaveTemplate() {
    if (
      !requirePro({
        title: "Guarda tu plantilla con Pro",
        description:
          "El formateo de un archivo es gratis. Guardar la configuración para reutilizarla requiere plan Pro.",
      })
    ) {
      return;
    }
    setSaveOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {rows.length} filas · {columns.length} columnas visibles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={onAddColumn} disabled={columns.length === 0}>
            <Plus data-icon="inline-start" />
            Agregar columna con fórmula
          </Button>
          <Button
            type="button"
            className="bg-excel text-excel-foreground hover:bg-excel-hover"
            onClick={() => void handleExport()}
            disabled={exporting || columns.length === 0}
          >
            <Download data-icon="inline-start" />
            {exporting ? "Exportando…" : "Exportar Excel"}
            <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
              Gratis
            </Badge>
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveTemplate}>
            {user && isPro ? <Save data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
            Guardar Plantilla
            <Badge variant="outline" className="ml-1">
              Pro
            </Badge>
          </Button>
        </div>
      </div>
      {exportError ? (
        <p className="text-sm text-destructive" role="alert">
          {exportError}
        </p>
      ) : null}

      {user && isPro ? (
        <SaveTemplateModal
          open={saveOpen}
          onOpenChange={setSaveOpen}
          user={user}
          fileName={fileName}
          originalColumns={originalColumns}
          columns={columns}
        />
      ) : null}
    </>
  );
}
