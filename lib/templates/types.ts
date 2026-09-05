import type { TemplateConfig } from "@/lib/schemas/template";

export type TemplateRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  config: TemplateConfig;
  created_at: string;
  updated_at: string;
};
