"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columnFormulaSchema, describeFormula } from "@/lib/excel/formulas";
import type { BinaryOperator, ColumnFormula, ColumnMeta } from "@/types/excel";
import { cn } from "@/lib/utils";

const INSERT_END = "__end__";

type Preset1Op = "sum" | "subtract" | "multiply" | "average" | "concat";
type BuilderRight = "column" | "number";

export type AddColumnPayload = {
  header: string;
  insertAfterId: string | null;
  formula: ColumnFormula;
};

type AddColumnDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnMeta[];
  defaultInsertAfterId?: string | null;
  onAdd: (payload: AddColumnPayload) => void;
};

export function AddColumnDialog({
  open,
  onOpenChange,
  columns,
  defaultInsertAfterId = null,
  onAdd,
}: AddColumnDialogProps) {
  const [section, setSection] = useState("preset1");
  const [header, setHeader] = useState("Suma");
  const [insertAfterId, setInsertAfterId] = useState(INSERT_END);
  const [preset1, setPreset1] = useState<Preset1Op>("sum");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [factor, setFactor] = useState("1.21");
  const [multiplyMode, setMultiplyMode] = useState<"column" | "factor">("factor");
  const [separator, setSeparator] = useState(" ");
  const [constant, setConstant] = useState("Pendiente");
  const [operator, setOperator] = useState<BinaryOperator>("*");
  const [builderRight, setBuilderRight] = useState<BuilderRight>("column");
  const [builderValue, setBuilderValue] = useState("1.21");
  const [excelPattern, setExcelPattern] = useState('=F{row}+(TEXTBEFORE(N{row}, " ")/24)');
  const [useExcelString, setUseExcelString] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInsertAfterId(defaultInsertAfterId ?? INSERT_END);
    setLeftId(columns[0]?.id ?? "");
    setRightId(columns[1]?.id ?? columns[0]?.id ?? "");
  }, [open, defaultInsertAfterId, columns]);

  const draftFormula = useMemo((): ColumnFormula | null => {
    const parsed = buildFormulaFromState({
      section,
      preset1,
      selectedIds,
      leftId,
      rightId,
      factor,
      multiplyMode,
      separator,
      constant,
      operator,
      builderRight,
      builderValue,
      excelPattern,
      useExcelString,
    });
    return parsed.success ? parsed.data : null;
  }, [
    section,
    preset1,
    selectedIds,
    leftId,
    rightId,
    factor,
    multiplyMode,
    separator,
    constant,
    operator,
    builderRight,
    builderValue,
    excelPattern,
    useExcelString,
  ]);

  const liveRule = draftFormula ? describeFormula(draftFormula, columns) : "Completa los campos…";

  function toggleId(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function submit() {
    setError(null);
    const name = header.trim();
    if (!name) {
      setError("El nombre de la columna es obligatorio");
      return;
    }
    const parsed = buildFormulaFromState({
      section,
      preset1,
      selectedIds,
      leftId,
      rightId,
      factor,
      multiplyMode,
      separator,
      constant,
      operator,
      builderRight,
      builderValue,
      excelPattern,
      useExcelString,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa la fórmula");
      return;
    }
    onAdd({
      header: name,
      insertAfterId: insertAfterId === INSERT_END ? null : insertAfterId,
      formula: parsed.data,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar columna con fórmula</DialogTitle>
          <DialogDescription>
            Las fórmulas se calculan fila por fila en la vista previa. El botón Σ de cada
            columna solo activa la fila de totales al pie.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="col-name">Nombre de la nueva columna</Label>
            <Input
              id="col-name"
              value={header}
              onChange={(event) => setHeader(event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Insertar</Label>
            <Select value={insertAfterId} onValueChange={setInsertAfterId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INSERT_END}>Al final de la tabla</SelectItem>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    A la derecha de {column.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={section} onValueChange={setSection} className="gap-3">
          <TabsList className="h-auto w-full flex-wrap">
            <TabsTrigger value="preset1" className="px-2 py-1.5">
              Preset 1 · Numéricas
            </TabsTrigger>
            <TabsTrigger value="preset2" className="px-2 py-1.5">
              Preset 2 · Constante
            </TabsTrigger>
            <TabsTrigger value="custom" className="px-2 py-1.5">
              Fórmula personalizada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preset1" className="mt-0 flex flex-col gap-3">
            <Select
              value={preset1}
              onValueChange={(value) => {
                const op = value as Preset1Op;
                setPreset1(op);
                setHeader(
                  {
                    sum: "Suma",
                    subtract: "Diferencia",
                    multiply: "Con IVA",
                    average: "Promedio",
                    concat: "Concatenado",
                  }[op],
                );
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">SUMA TOTAL (ColA + ColB + …) por fila</SelectItem>
                <SelectItem value="subtract">DIFERENCIA / RESTA (ColA − ColB)</SelectItem>
                <SelectItem value="multiply">MULTIPLICACIÓN / % (ColA × ColB o factor)</SelectItem>
                <SelectItem value="average">PROMEDIO (AVG) por fila</SelectItem>
                <SelectItem value="concat">CONCATENAR TEXTO (Nombre + Apellido)</SelectItem>
              </SelectContent>
            </Select>

            {preset1 === "sum" || preset1 === "average" || preset1 === "concat" ? (
              <ColumnChips
                columns={columns}
                selectedIds={selectedIds}
                onToggle={toggleId}
                extra={
                  preset1 === "concat" ? (
                    <div className="grid w-full gap-1 pt-1">
                      <Label htmlFor="sep">Separador</Label>
                      <Input
                        id="sep"
                        value={separator}
                        onChange={(event) => setSeparator(event.target.value)}
                      />
                    </div>
                  ) : null
                }
              />
            ) : null}

            {preset1 === "subtract" ? (
              <PairSelect
                columns={columns}
                leftId={leftId}
                rightId={rightId}
                onLeft={setLeftId}
                onRight={setRightId}
              />
            ) : null}

            {preset1 === "multiply" ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Columna A</Label>
                  <ColumnSelect columns={columns} value={leftId} onChange={setLeftId} />
                </div>
                <Select
                  value={multiplyMode}
                  onValueChange={(value) => setMultiplyMode(value as "column" | "factor")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factor">× Factor (ej. IVA 1.21)</SelectItem>
                    <SelectItem value="column">× Otra columna</SelectItem>
                  </SelectContent>
                </Select>
                {multiplyMode === "factor" ? (
                  <div className="grid gap-1">
                    <Label htmlFor="factor">Factor</Label>
                    <Input
                      id="factor"
                      inputMode="decimal"
                      value={factor}
                      onChange={(event) => setFactor(event.target.value)}
                    />
                  </div>
                ) : (
                  <div className="grid gap-1">
                    <Label>Columna B</Label>
                    <ColumnSelect columns={columns} value={rightId} onChange={setRightId} />
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="preset2" className="mt-0 grid gap-2">
            <p className="text-xs text-muted-foreground">
              El mismo valor se copia en todas las filas (estado, fecha fija, IVA 0.21…).
            </p>
            <Label htmlFor="const">Valor constante</Label>
            <Input
              id="const"
              value={constant}
              onChange={(event) => {
                setConstant(event.target.value);
                setHeader("Estado");
              }}
            />
          </TabsContent>

          <TabsContent value="custom" className="mt-0 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useExcelString}
                onChange={(event) => setUseExcelString(event.target.checked)}
              />
              Escribir fórmula nativa de Excel
            </label>
            <p className="text-xs text-muted-foreground">
              TEXTBEFORE, IF, SUM, LEFT, comillas, comas y el token {`{row}`} (p. ej.{" "}
              {`=F{row}+(TEXTBEFORE(N{row}, " ")/24)`}).
            </p>

            {useExcelString ? (
              <div className="grid gap-1">
                <Label htmlFor="excel-pat">
                  Fórmula ({`{row}`} se sustituye por el número de fila al exportar)
                </Label>
                <textarea
                  id="excel-pat"
                  className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={excelPattern}
                  onChange={(event) => setExcelPattern(event.target.value)}
                  placeholder={'=F{row}+(TEXTBEFORE(N{row}, " ")/24)'}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Columna A</Label>
                  <ColumnSelect columns={columns} value={leftId} onChange={setLeftId} />
                </div>
                <div className="grid gap-1">
                  <Label>Operador</Label>
                  <Select value={operator} onValueChange={(value) => setOperator(value as BinaryOperator)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+">+</SelectItem>
                      <SelectItem value="-">−</SelectItem>
                      <SelectItem value="*">×</SelectItem>
                      <SelectItem value="/">÷</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Columna B o valor</Label>
                  <Select
                    value={builderRight}
                    onValueChange={(value) => setBuilderRight(value as BuilderRight)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">Otra columna</SelectItem>
                      <SelectItem value="number">Valor numérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {builderRight === "column" ? (
                  <ColumnSelect columns={columns} value={rightId} onChange={setRightId} />
                ) : (
                  <Input
                    inputMode="decimal"
                    value={builderValue}
                    onChange={(event) => setBuilderValue(event.target.value)}
                  />
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs text-slate-700">
          Regla: {liveRule}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" onClick={submit}>
            <Plus data-icon="inline-start" />
            Insertar y calcular filas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildFormulaFromState(state: {
  section: string;
  preset1: Preset1Op;
  selectedIds: string[];
  leftId: string;
  rightId: string;
  factor: string;
  multiplyMode: "column" | "factor";
  separator: string;
  constant: string;
  operator: BinaryOperator;
  builderRight: BuilderRight;
  builderValue: string;
  excelPattern: string;
  useExcelString: boolean;
}) {
  if (state.section === "preset2") {
    return columnFormulaSchema.safeParse({ kind: "constant", value: state.constant });
  }

  if (state.section === "custom") {
    if (state.useExcelString) {
      return columnFormulaSchema.safeParse({ kind: "excel", pattern: state.excelPattern.trim() });
    }
    return columnFormulaSchema.safeParse({
      kind: "binary",
      leftId: state.leftId,
      operator: state.operator,
      right:
        state.builderRight === "number"
          ? { type: "number", value: Number(state.builderValue.replace(",", ".")) }
          : { type: "column", id: state.rightId },
    });
  }

  switch (state.preset1) {
    case "sum":
      return columnFormulaSchema.safeParse({ kind: "sum", sourceIds: state.selectedIds });
    case "average":
      return columnFormulaSchema.safeParse({ kind: "average", sourceIds: state.selectedIds });
    case "concat":
      return columnFormulaSchema.safeParse({
        kind: "concat",
        sourceIds: state.selectedIds,
        separator: state.separator,
      });
    case "subtract":
      return columnFormulaSchema.safeParse({
        kind: "subtract",
        leftId: state.leftId,
        rightId: state.rightId,
      });
    case "multiply":
      if (state.multiplyMode === "factor") {
        return columnFormulaSchema.safeParse({
          kind: "multiply",
          sourceId: state.leftId,
          factor: Number(state.factor.replace(",", ".")),
        });
      }
      return columnFormulaSchema.safeParse({
        kind: "binary",
        leftId: state.leftId,
        operator: "*",
        right: { type: "column", id: state.rightId },
      });
  }
}

function ColumnChips({
  columns,
  selectedIds,
  onToggle,
  extra,
}: {
  columns: ColumnMeta[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>Columnas (mínimo 2) — se combinan en cada fila</Label>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-2">
        {columns.map((column) => {
          const active = selectedIds.includes(column.id);
          return (
            <Button
              key={column.id}
              type="button"
              size="xs"
              variant={active ? "default" : "outline"}
              className={cn(!active && "text-muted-foreground")}
              onClick={() => onToggle(column.id)}
            >
              {column.header}
            </Button>
          );
        })}
      </div>
      {extra}
    </div>
  );
}

function PairSelect({
  columns,
  leftId,
  rightId,
  onLeft,
  onRight,
}: {
  columns: ColumnMeta[];
  leftId: string;
  rightId: string;
  onLeft: (id: string) => void;
  onRight: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1">
        <Label>Columna A</Label>
        <ColumnSelect columns={columns} value={leftId} onChange={onLeft} />
      </div>
      <div className="grid gap-1">
        <Label>Columna B</Label>
        <ColumnSelect columns={columns} value={rightId} onChange={onRight} />
      </div>
    </div>
  );
}

function ColumnSelect({
  columns,
  value,
  onChange,
}: {
  columns: ColumnMeta[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Columna" />
      </SelectTrigger>
      <SelectContent>
        {columns.map((column) => (
          <SelectItem key={column.id} value={column.id}>
            {column.header}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
