"use client";

import { useCallback, useId, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const BEFORE_ROWS = [
  ["sku", "QTY", "price", "notes"],
  [" a-12 ", "2", "9.5", "  mixed  "],
  ["b9", "10", "1.2", ""],
  ["A-12", "2", "9,50", "dup?"],
  ["c-03", "", "40", "WAIT"],
  ["d1", "3", "2.00", "n/a"],
];

const AFTER_ROWS = [
  ["SKU", "Qty", "Price", "Notes"],
  ["A-12", "2", "$9.50", "Mixed case"],
  ["B-09", "10", "$1.20", "—"],
  ["C-03", "0", "$40.00", "Waitlist"],
  ["D-01", "3", "$2.00", "—"],
  ["Total", "15", "$62.70", ""],
];

function MiniSheet({
  rows,
  variant,
}: {
  rows: string[][];
  variant: "raw" | "pretty";
}) {
  return (
    <table className="w-full border-collapse font-mono text-[10px] leading-tight sm:text-[11px]">
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td
                key={c}
                className={cn(
                  "border px-1.5 py-1.5 sm:px-2",
                  variant === "raw" && "border-neutral-300 bg-white text-neutral-700",
                  variant === "pretty" && r === 0 && "border-blue-700 bg-blue-600 font-semibold text-white",
                  variant === "pretty" && r > 0 && r < rows.length - 1 && r % 2 === 0 && "border-slate-200 bg-slate-50",
                  variant === "pretty" && r > 0 && r < rows.length - 1 && r % 2 === 1 && "border-slate-200 bg-white",
                  variant === "pretty" && r === rows.length - 1 && "border-emerald-700 bg-emerald-600 font-semibold text-white",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CompareSlider() {
  const { t } = useI18n();
  const labelId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(48);

  const moveTo = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(92, Math.max(8, next)));
  }, []);

  return (
    <div className="relative">
      <div
        ref={frameRef}
        className="relative aspect-[5/4] cursor-ew-resize overflow-hidden rounded-2xl border border-border bg-slate-100 shadow-xl ring-1 ring-black/5 dark:bg-slate-900"
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          moveTo(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) {
            if (event.pointerType === "mouse") moveTo(event.clientX);
            return;
          }
          moveTo(event.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <div className="absolute inset-0 p-3 sm:p-4">
          <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t.landing.before}
          </p>
          <MiniSheet rows={BEFORE_ROWS} variant="raw" />
        </div>
        <div
          className="absolute inset-0 bg-slate-50 p-3 sm:p-4 dark:bg-slate-950"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <p className="mb-2 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
            {t.landing.after}
          </p>
          <MiniSheet rows={AFTER_ROWS} variant="pretty" />
        </div>
        <div
          className="absolute top-0 bottom-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.2)]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md">
            <GripVertical className="size-4" />
          </div>
        </div>
        <input
          id={labelId}
          type="range"
          min={8}
          max={92}
          value={Math.round(pos)}
          aria-label={`${t.landing.before} / ${t.landing.after}`}
          className="sr-only"
          onChange={(event) => setPos(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
