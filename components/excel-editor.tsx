"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddColumnDialog, type AddColumnPayload } from "@/components/add-column-dialog";
import { FileUploader } from "@/components/file-uploader";
import { ExcelPreviewTable } from "@/components/excel-preview-table";
import { EditorToolbar } from "@/components/editor-toolbar";
import { TemplateMatchBanner } from "@/components/template-match-banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { applyFormulaToRows, nextColumnId } from "@/lib/excel/formulas";
import { applyTemplateConfig } from "@/lib/templates/apply";
import { findMatchingTemplates } from "@/lib/templates/match";
import { listTemplates } from "@/lib/templates/store";
import type { TemplateRecord } from "@/lib/templates/types";
import { DEFAULT_COLUMN_STYLE, type ColumnMeta, type ColumnStyle, type ExcelRow, type ParsedWorkbook } from "@/types/excel";

type EditorState = {
  fileName: string;
  sheetName: string;
  originalColumns: ColumnMeta[];
  originalRows: ExcelRow[];
  columns: ColumnMeta[];
  rows: ExcelRow[];
};

export function ExcelEditor() {
  const { user, isPro, requirePro } = useAuth();
  const [workbook, setWorkbook] = useState<EditorState | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [matches, setMatches] = useState<TemplateRecord[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const onLoaded = useCallback((parsed: ParsedWorkbook) => {
    const originalColumns = parsed.columns.map((column) => ({
      ...column,
      style: { ...column.style },
    }));
    setWorkbook({
      fileName: parsed.fileName,
      sheetName: parsed.sheetName,
      originalColumns,
      originalRows: parsed.rows.map((row) => ({ ...row })),
      columns: originalColumns.map((column) => ({
        ...column,
        style: { ...column.style },
      })),
      rows: parsed.rows.map((row) => ({ ...row })),
    });
    setBannerDismissed(false);
    setMatches([]);
  }, []);

  const originalColumns = workbook?.originalColumns;

  useEffect(() => {
    if (!user || !isPro || !originalColumns) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const headers = originalColumns.map((column) => column.header);
    void listTemplates()
      .then((templates) => {
        if (!cancelled) setMatches(findMatchingTemplates(headers, templates));
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPro, originalColumns]);

  const onRemoveColumn = useCallback((columnId: string) => {
    setWorkbook((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.filter((column) => column.id !== columnId),
      };
    });
  }, []);

  const onStyleChange = useCallback((columnId: string, style: Partial<ColumnStyle>) => {
    setWorkbook((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((column) =>
          column.id === columnId
            ? { ...column, style: { ...column.style, ...style } }
            : column,
        ),
      };
    });
  }, []);

  const onAddColumn = useCallback((payload: AddColumnPayload) => {
    setWorkbook((current) => {
      if (!current) return current;
      const id = nextColumnId(payload.header, current.columns);
      const column: ColumnMeta = {
        id,
        header: payload.header,
        style: { ...DEFAULT_COLUMN_STYLE, bg_color: "#E6F4EA", font_color: "#137333" },
        summary: false,
        formula: payload.formula,
      };
      const insertAt =
        payload.insertAfterId === null
          ? current.columns.length
          : Math.max(
              0,
              current.columns.findIndex((item) => item.id === payload.insertAfterId) + 1,
            );
      const columns = [
        ...current.columns.slice(0, insertAt),
        column,
        ...current.columns.slice(insertAt),
      ];
      return {
        ...current,
        columns,
        rows: applyFormulaToRows(current.rows, id, payload.formula, columns),
      };
    });
  }, []);

  const applyMatch = useCallback((template: TemplateRecord) => {
    setWorkbook((current) => {
      if (!current) return current;
      const applied = applyTemplateConfig({
        originalColumns: current.originalColumns,
        rows: current.originalRows,
        config: template.config,
      });
      return { ...current, columns: applied.columns, rows: applied.rows };
    });
    setBannerDismissed(true);
    toast.success(`Plantilla “${template.title}” aplicada`);
  }, []);

  const onToggleSummary = useCallback((columnId: string) => {
    setWorkbook((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((column) =>
          column.id === columnId ? { ...column, summary: !column.summary } : column,
        ),
      };
    });
  }, []);

  if (!workbook) {
    return <FileUploader onLoaded={onLoaded} />;
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
      <EditorToolbar
        fileName={workbook.fileName}
        sheetName={workbook.sheetName}
        originalColumns={workbook.originalColumns}
        columns={workbook.columns}
        rows={workbook.rows}
        onAddColumn={() => {
          setInsertAfterId(null);
          setAddOpen(true);
        }}
      />
      {!bannerDismissed && matches[0] ? (
        <TemplateMatchBanner
          template={matches[0]}
          extraCount={Math.max(0, matches.length - 1)}
          onApply={() => {
            if (
              !requirePro({
                title: "Aplicar plantilla",
                description: "La aplicación en 1 clic es una función Pro.",
              })
            ) {
              return;
            }
            const template = matches[0];
            if (template) applyMatch(template);
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}
      {workbook.columns.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
          Todas las columnas fueron eliminadas. Carga de nuevo el archivo para restaurarlas.
        </p>
      ) : (
        <ExcelPreviewTable
          columns={workbook.columns}
          rows={workbook.rows}
          onRemoveColumn={onRemoveColumn}
          onStyleChange={onStyleChange}
          onToggleSummary={onToggleSummary}
          onAddFormula={(columnId) => {
            setInsertAfterId(columnId);
            setAddOpen(true);
          }}
        />
      )}
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={() => setWorkbook(null)}>
          Cargar otro archivo
        </Button>
      </div>
      <AddColumnDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        columns={workbook.columns}
        defaultInsertAfterId={insertAfterId}
        onAdd={onAddColumn}
      />
    </div>
  );
}
