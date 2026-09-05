"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { ExcelEditor } from "@/components/excel-editor";
import { MailMergeTool } from "@/components/mail-merge-tool";
import { ManifestExtractorTool } from "@/components/manifest-extractor-tool";
import { MyTemplates } from "@/components/my-templates";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getProPriceLabel } from "@/lib/billing/checkout";

const HERO = {
  formatter: {
    title: "Formatea Excel en el navegador, sin registro.",
    description:
      "Arrastra un .xlsx o .csv, elimina columnas, pinta cabeceras y añade totales. Exportar es gratis. Guardar plantilla o lotes requiere Pro (pago).",
  },
  "mail-merge": {
    title: "Mail Merge semi-automático con cupo diario.",
    description:
      "Carga el Excel y las plantillas .docx. Invitados: 5 cartas/día. Cuenta gratis: 10/día. Pro: ilimitado tras el pago.",
  },
  manifest: {
    title: "Extrae filas de cualquier manifiesto.",
    description:
      "Elige la columna de búsqueda, los valores a filtrar y las columnas de salida. Un archivo ≤ 2 MB es gratis; varios a la vez es Pro.",
  },
  templates: {
    title: "Mis plantillas Pro.",
    description:
      "Lista, renombra o elimina las configuraciones guardadas en tu cuenta de Supabase (solo las tuyas, vía RLS).",
  },
} as const;

export function AppWorkspace() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}

function WorkspaceShell() {
  const { isPro, openUpgrade } = useAuth();
  const [tab, setTab] = useState<keyof typeof HERO>("formatter");
  const [pricesOpen, setPricesOpen] = useState(false);
  const hero = HERO[tab];

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as keyof typeof HERO)}
        className="flex min-h-full flex-1 flex-col gap-0"
      >
        <SiteHeader onPrices={() => setPricesOpen(true)} />

        <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
          <section>
            <Badge variant="outline">Guest-first · 3 herramientas</Badge>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              {hero.title}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{hero.description}</p>
          </section>

          <Card className="min-w-0 overflow-hidden bg-white ring-border">
            <CardHeader className="border-b">
              <CardTitle>
                {tab === "formatter"
                  ? "Editor"
                  : tab === "mail-merge"
                    ? "Generador de cartas"
                    : tab === "templates"
                      ? "Mis plantillas"
                      : "Extractor configurable"}
              </CardTitle>
              <CardDescription>
                {tab === "templates"
                  ? "Las plantillas se guardan en Supabase asociadas a tu usuario."
                  : "El archivo se procesa en tu dispositivo. Las plantillas Pro sí se persisten en tu cuenta."}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden pt-4">
              <TabsContent value="formatter" className="mt-0 min-w-0">
                <ExcelEditor />
              </TabsContent>
              <TabsContent value="mail-merge" className="mt-0">
                <MailMergeTool />
              </TabsContent>
              <TabsContent value="manifest" className="mt-0">
                <ManifestExtractorTool />
              </TabsContent>
              <TabsContent value="templates" className="mt-0">
                <MyTemplates />
              </TabsContent>
            </CardContent>
          </Card>
        </main>

        <SiteFooter />
      </Tabs>

      <Dialog open={pricesOpen} onOpenChange={setPricesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Planes</DialogTitle>
            <DialogDescription>Sin registro para las funciones gancho.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="font-medium">Gratis</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                <li>1 Excel formateado y exportado</li>
                <li>Mail Merge: 5/día invitado · 10/día con cuenta</li>
                <li>1 manifiesto ≤ 2 MB</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-accent p-4">
              <p className="font-medium text-primary">Pro</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                <li>Plantillas JSON y lotes</li>
                <li>Mail Merge ilimitado</li>
                <li>Extractos masivos consolidados</li>
              </ul>
            </div>
          </div>
          {isPro ? (
            <p className="text-sm text-excel">Tu cuenta ya es Pro.</p>
          ) : (
            <Button type="button" className="w-full" onClick={() => { setPricesOpen(false); openUpgrade(); }}>
              Obtener Plan Pro ({getProPriceLabel()})
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
