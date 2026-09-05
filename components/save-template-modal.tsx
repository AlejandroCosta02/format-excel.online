"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildTemplateConfig } from "@/lib/excel/template";
import { describeFormula } from "@/lib/excel/formulas";
import { insertTemplate } from "@/lib/templates/store";
import type { ColumnMeta } from "@/types/excel";

type SaveTemplateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  fileName: string;
  originalColumns: ColumnMeta[];
  columns: ColumnMeta[];
};

export function SaveTemplateModal({
  open,
  onOpenChange,
  user,
  fileName,
  originalColumns,
  columns,
}: SaveTemplateModalProps) {
  const suggested = fileName.replace(/\.(xlsx|csv)$/i, "") || "Plantilla";
  const [title, setTitle] = useState(suggested);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(suggested);
      setDescription("");
    }
  }, [open, suggested]);

  const preview = useMemo(
    () =>
      buildTemplateConfig({
        originalColumns,
        visibleColumns: columns,
        templateName: title.trim() || suggested,
      }),
    [originalColumns, columns, title, suggested],
  );

  async function save() {
    const name = title.trim();
    if (!name) return;
    setPending(true);
    try {
      const config = buildTemplateConfig({
        originalColumns,
        visibleColumns: columns,
        templateName: name,
      });
      await insertTemplate({
        user,
        title: name,
        description: description.trim() || null,
        config,
      });
      toast.success("Plantilla guardada correctamente");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar";
      toast.error(
        message.includes("schema") || message.includes("relation")
          ? "Falta crear las tablas en Supabase. Ejecuta supabase/schema.sql en el SQL Editor."
          : message,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guardar plantilla</DialogTitle>
          <DialogDescription>
            Se almacenará en tu cuenta (Supabase) para aplicarla en 1 clic a
            archivos con las mismas cabeceras.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="tpl-name">Nombre de la plantilla</Label>
            <Input
              id="tpl-name"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Reporte Mensual de Ventas"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="tpl-desc">Descripción (opcional)</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Formato para enviar a contabilidad"
            />
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <p className="mb-2 font-medium">Se guardará</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                ✂️ Columnas a eliminar:{" "}
                {preview.actions.remove_columns.length === 0
                  ? "ninguna"
                  : `${preview.actions.remove_columns.length} (${preview.actions.remove_columns.join(", ")})`}
              </li>
              <li>
                🎨 Estilos aplicados:{" "}
                {preview.actions.column_styles.length === 0
                  ? "sin cambios de color, fuente o tamaño"
                  : preview.actions.column_styles
                      .map(
                        (style) =>
                          `${style.column} (${style.bg_color}, ${style.font_color}, ${style.font_size}px${style.bold ? ", negrita" : ""})`,
                      )
                      .join("; ")}
              </li>
              <li>
                🧮 Fórmulas y presets:{" "}
                {preview.actions.added_columns.length === 0
                  ? "ninguna"
                  : preview.actions.added_columns
                      .map(
                        (column) =>
                          `${column.header} (${describeFormula(column.formula, columns)})`,
                      )
                      .join("; ")}
              </li>
              <li>
                Fila de totales:{" "}
                {preview.actions.summary_row.enabled
                  ? preview.actions.summary_row.operations.map((op) => op.column).join(", ")
                  : "no"}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => void save()} disabled={pending || !title.trim()}>
            {pending ? "Guardando…" : "Guardar plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
