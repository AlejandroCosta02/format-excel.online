"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/templates/store";
import type { TemplateRecord } from "@/lib/templates/types";

export function MyTemplates() {
  const { user, isPro, ready, openAuth, openUpgrade } = useAuth();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      return;
    }
    setLoading(true);
    try {
      setTemplates(await listTemplates());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las plantillas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Inicia sesión para ver las plantillas. Guardarlas requiere plan Pro.
        </p>
        <Button type="button" className="mt-4" onClick={() => openAuth()}>
          Iniciar sesión con Google
        </Button>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Tu cuenta está en el plan gratis. Las plantillas guardadas son una función Pro.
        </p>
        <Button type="button" className="mt-4" onClick={openUpgrade}>
          Obtener Plan Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {loading ? "Cargando…" : `${templates.length} plantilla${templates.length === 1 ? "" : "s"}`}
      </p>
      {templates.length === 0 && !loading ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aún no hay plantillas. Formatea un Excel y pulsa Guardar plantilla.
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {templates.map((template) => (
          <li key={template.id} className="rounded-xl border bg-white p-4">
            {editing === template.id ? (
              <div className="grid gap-2">
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateTemplate({
                          id: template.id,
                          title: title.trim(),
                          description: description.trim() || null,
                        });
                        toast.success("Plantilla actualizada");
                        setEditing(null);
                        await refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error al actualizar");
                      }
                    }}
                    disabled={!title.trim()}
                  >
                    Guardar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{template.title}</p>
                  {template.description ? (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {template.config.match_criteria.expected_columns.length} cabeceras ·{" "}
                    {template.config.actions.remove_columns.length} a eliminar ·{" "}
                    {template.config.actions.added_columns.length} fórmulas
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(template.id);
                      setTitle(template.title);
                      setDescription(template.description ?? "");
                    }}
                  >
                    <Pencil data-icon="inline-start" />
                    Renombrar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      try {
                        await deleteTemplate(template.id);
                        toast.success("Plantilla eliminada");
                        await refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error al eliminar");
                      }
                    }}
                  >
                    <Trash2 data-icon="inline-start" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
