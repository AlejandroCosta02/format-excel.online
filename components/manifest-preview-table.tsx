"use client";

import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";

type ManifestPreviewTableProps = {
  headers: string[];
  rows: Record<string, string>[];
};

export function ManifestPreviewTable({ headers, rows }: ManifestPreviewTableProps) {
  const columnDefs: LegacyColumnDef<Record<string, string>>[] = headers.map((header, index) => ({
    id: header,
    accessorKey: header,
    size: 160,
    minSize: 120,
    header: () => (
      <span className={index === 0 ? "sticky left-0 z-10 bg-slate-50" : undefined}>{header}</span>
    ),
    cell: ({ getValue }) => String(getValue() ?? ""),
  }));

  const table = useLegacyTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (_row, index) => String(index),
  });

  return (
    <div className="max-h-[min(480px,55vh)] w-full min-w-0 overflow-auto rounded-xl border bg-white [scrollbar-width:thin]">
      <table className="w-max min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b px-3 py-2 text-left font-medium whitespace-nowrap text-slate-700"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="odd:bg-white even:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b px-3 py-1.5 whitespace-nowrap text-slate-800">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
