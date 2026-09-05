"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { ExcelEditor } from "@/components/excel-editor";
import { MailMergeTool } from "@/components/mail-merge-tool";
import { ManifestExtractorTool } from "@/components/manifest-extractor-tool";
import { MyTemplates } from "@/components/my-templates";
import { FaqSection } from "@/components/faq-section";
import { PricingSection } from "@/components/pricing-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TOOLS = ["formatter", "mail-merge", "manifest", "templates"] as const;
type ToolTab = (typeof TOOLS)[number];

function isTool(value: string | null): value is ToolTab {
  return TOOLS.includes(value as ToolTab);
}

export function AppWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [tab, setTab] = useState<ToolTab>("formatter");

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (isTool(tool)) setTab(tool);
  }, [searchParams]);

  const hero =
    tab === "formatter"
      ? { title: t.hero.formatterTitle, description: t.hero.formatterDesc }
      : tab === "mail-merge"
        ? { title: t.hero.mailTitle, description: t.hero.mailDesc }
        : tab === "templates"
          ? { title: t.hero.templatesTitle, description: t.hero.templatesDesc }
          : { title: t.hero.manifestTitle, description: t.hero.manifestDesc };

  const cardTitle =
    tab === "formatter"
      ? t.hero.cardFormatter
      : tab === "mail-merge"
        ? t.hero.cardMail
        : tab === "templates"
          ? t.hero.cardTemplates
          : t.hero.cardManifest;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
        <section id="workspace" className="scroll-mt-24">
          <Badge variant="outline">{t.hero.badge}</Badge>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">{hero.description}</p>
        </section>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (!isTool(value)) return;
            setTab(value);
            router.replace(`/?tool=${value}#workspace`, { scroll: false });
          }}
          className="flex min-w-0 flex-col gap-3"
        >
          <TabsList variant="line" className="h-auto w-full max-w-full flex-wrap justify-start">
            <TabsTrigger value="formatter">{t.nav.formatter}</TabsTrigger>
            <TabsTrigger value="manifest">{t.nav.manifest}</TabsTrigger>
            <TabsTrigger value="mail-merge">{t.nav.mailMerge}</TabsTrigger>
            <TabsTrigger value="templates">{t.nav.templates}</TabsTrigger>
          </TabsList>
          <Card className="min-w-0 overflow-hidden bg-card ring-border">
            <CardHeader className="border-b">
              <CardTitle>{cardTitle}</CardTitle>
              <CardDescription>
                {tab === "templates" ? t.hero.cardDescTemplates : t.hero.cardDesc}
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
        </Tabs>

        <PricingSection />
        <FaqSection />
      </main>
    </div>
  );
}
