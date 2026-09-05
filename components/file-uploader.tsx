"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Upload } from "lucide-react";
import { parseSpreadsheet, validateSpreadsheetFile } from "@/lib/excel/parse";
import type { ParsedWorkbook } from "@/types/excel";
import { cn } from "@/lib/utils";

type FileUploaderProps = {
  onLoaded: (workbook: ParsedWorkbook) => void;
  disabled?: boolean;
};

export function FileUploader({ onLoaded, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setError(null);

      const validation = validateSpreadsheetFile(file);
      if (!validation.ok) {
        setError(validation.message);
        return;
      }

      setLoading(true);
      try {
        const workbook = await parseSpreadsheet(file);
        onLoaded(workbook);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo leer el archivo");
      } finally {
        setLoading(false);
      }
    },
    [disabled, onLoaded],
  );

  return (
    <motion.div
      animate={dragging ? { scale: 1.01 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFile(event.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        {loading ? (
          <Upload className="size-7 animate-pulse" />
        ) : (
          <FileSpreadsheet className="size-7" />
        )}
      </div>
      <p className="text-base font-medium text-foreground">
        {loading ? "Leyendo en el navegador…" : "Arrastra un .xlsx o .csv"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        La vista previa se genera en tu dispositivo. Nada se sube al servidor.
        Máximo 10 MB.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </motion.div>
  );
}
