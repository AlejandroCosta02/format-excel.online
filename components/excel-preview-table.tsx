"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { ChevronsLeft, ChevronsRight, FunctionSquare, ListEnd, Paintbrush, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EXCEL_PREVIEW_FALLBACK } from "@/lib/excel/excel-preview-eval";
import { isNumericColumn, sumColumn } from "@/lib/excel/parse";
import type { ColumnMeta, ColumnStyle, ExcelRow } from "@/types/excel";
import { cn } from "@/lib/utils";

type ExcelPreviewTableProps = {
  columns: ColumnMeta[];
  rows: ExcelRow[];
  onRemoveColumn: (columnId: string) => void;
  onStyleChange: (columnId: string, style: Partial<ColumnStyle>) => void;
  onToggleSummary: (columnId: string) => void;
  onAddFormula: (columnId: string) => void;
};

export function ExcelPreviewTable({
  columns,
  rows,
  onRemoveColumn,
  onStyleChange,
  onToggleSummary,
  onAddFormula,
}: ExcelPreviewTableProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({
      left: el.scrollLeft > 4,
      right: max > 4 && el.scrollLeft < max - 4,
    });
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns.length, rows.length, updateOverflow]);

  const columnDefs: LegacyColumnDef<ExcelRow>[] = columns.map((column) => ({
    id: column.id,
    accessorKey: column.id,
    size: 180,
    minSize: 180,
    header: () => (
      <ColumnHeader
        column={column}
        numeric={isNumericColumn(rows, column.id)}
        onRemoveColumn={onRemoveColumn}
        onStyleChange={onStyleChange}
        onToggleSummary={onToggleSummary}
        onAddFormula={onAddFormula}
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === EXCEL_PREVIEW_FALLBACK) {
        return (
          <span className="italic text-muted-foreground">{EXCEL_PREVIEW_FALLBACK}</span>
        );
      }
      return value === null || value === undefined ? "" : String(value);
    },
  }));

  const table = useLegacyTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (_row, index) => String(index),
  });

  const showSummary = columns.some((column) => column.summary);

  return (
    <div className="relative min-w-0 w-full max-w-full">
      {overflow.left ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-white to-transparent"
          aria-hidden
        />
      ) : null}
      {overflow.right ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-14 items-center justify-end bg-gradient-to-l from-white to-transparent pr-1"
          aria-hidden
        >
          <span className="pointer-events-none flex items-center gap-0.5 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow">
            <ChevronsRight className="size-3" />
            Más columnas
          </span>
        </div>
      ) : null}
      {overflow.left ? (
        <span className="pointer-events-none absolute top-2 left-2 z-30 flex items-center rounded-full bg-slate-800/80 px-2 py-1 text-[10px] font-medium text-white">
          <ChevronsLeft className="size-3" />
        </span>
      ) : null}

      <div
        ref={scrollerRef}
        onScroll={updateOverflow}
        className="max-h-[min(560px,65vh)] w-full max-w-full min-w-0 overflow-auto rounded-xl border bg-card [scrollbar-color:var(--color-primary)_#e2e8f0] [scrollbar-width:thin]"
      >
        <table className="w-max min-w-full border-separate border-spacing-0 text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const meta = columns.find((column) => column.id === header.id);
                  const style = meta?.style;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "sticky top-0 z-10 min-w-[180px] max-w-[280px] border-b border-r border-border p-0 shadow-[0_1px_0_#e2e8f0]",
                        index === 0 && "sticky left-0 z-30 shadow-[1px_0_0_#e2e8f0]",
                      )}
                      style={{
                        backgroundColor: style?.bg_color ?? "#F1F5F9",
                        color: style?.font_color,
                        fontSize: style ? `${style.font_size}px` : undefined,
                        fontWeight: style?.bold ? 700 : 500,
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group odd:bg-card even:bg-muted/40">
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "min-w-[180px] max-w-[280px] border-b border-r border-border px-3 py-2 font-mono text-xs break-words text-slate-800",
                      index === 0 &&
                        "sticky left-0 z-10 bg-card group-even:bg-muted/40",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {showSummary ? (
              <tr className="bg-emerald-50 font-medium">
                {columns.map((column, index) => (
                  <td
                    key={`sum-${column.id}`}
                    className={cn(
                      "min-w-[180px] border-b border-r border-border px-3 py-2 font-mono text-xs text-excel",
                      index === 0 && "sticky left-0 z-10 bg-emerald-50",
                    )}
                  >
                    {column.summary
                      ? sumColumn(rows, column.id)
                      : index === 0
                        ? "Totales (pie)"
                        : ""}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Desplaza horizontalmente para ver las {columns.length} columnas. El menú de formato
        (color, tamaño, eliminar). fx = fórmula por fila · icono de lista = totales al pie.
      </p>
    </div>
  );
}

function ColumnHeader({
  column,
  numeric,
  onRemoveColumn,
  onStyleChange,
  onToggleSummary,
  onAddFormula,
}: {
  column: ColumnMeta;
  numeric: boolean;
  onRemoveColumn: (columnId: string) => void;
  onStyleChange: (columnId: string, style: Partial<ColumnStyle>) => void;
  onToggleSummary: (columnId: string) => void;
  onAddFormula: (columnId: string) => void;
}) {
  return (
    <div className="flex min-w-[180px] items-start justify-between gap-2 px-2 py-2">
      <span className="font-mono leading-tight">
        {column.header}
        {column.formula ? (
          <span className="mt-0.5 block text-[10px] font-normal opacity-70">fórmula</span>
        ) : null}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="hover:bg-black/5"
              aria-label={`Estilo de ${column.header}`}
            >
              <Paintbrush className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="z-[80] w-64">
            <PopoverHeader>
              <PopoverTitle>Cabecera</PopoverTitle>
            </PopoverHeader>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              Fondo
              <Input
                type="color"
                className="h-8 w-14 p-1"
                value={column.style.bg_color}
                onChange={(event) =>
                  onStyleChange(column.id, { bg_color: event.target.value })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              Texto
              <Input
                type="color"
                className="h-8 w-14 p-1"
                value={column.style.font_color}
                onChange={(event) =>
                  onStyleChange(column.id, { font_color: event.target.value })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              Tamaño
              <Input
                type="number"
                min={8}
                max={24}
                className="h-8 w-16"
                value={column.style.font_size}
                onChange={(event) =>
                  onStyleChange(column.id, {
                    font_size: Number(event.target.value) || 11,
                  })
                }
              />
            </label>
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="hover:bg-black/5"
              aria-label={`Fórmula a la derecha de ${column.header}`}
              onClick={() => onAddFormula(column.id)}
            >
              <FunctionSquare className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Agregar columna con fórmula (fila a fila)</TooltipContent>
        </Tooltip>
        {numeric || column.formula ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className={cn(column.summary && "bg-emerald-100 text-excel")}
                aria-label={`Totales al pie de ${column.header}`}
                onClick={() => onToggleSummary(column.id)}
              >
                <ListEnd className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fila de resumen / totales al pie (no es fórmula por fila)</TooltipContent>
          </Tooltip>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:bg-destructive/10"
          aria-label={`Eliminar ${column.header}`}
          onClick={() => onRemoveColumn(column.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
