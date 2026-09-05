"use client";

import type { User } from "@supabase/supabase-js";
import { templateConfigSchema, type TemplateConfig } from "@/lib/schemas/template";
import { createClient } from "@/lib/supabase/client";
import type { TemplateRecord } from "@/lib/templates/types";

function mapRow(row: Record<string, unknown>): TemplateRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    config: templateConfigSchema.parse(row.config),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function ensureProfile(user: User): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@users.local`,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, user_id, title, description, config, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function insertTemplate(input: {
  user: User;
  title: string;
  description: string | null;
  config: TemplateConfig;
}): Promise<TemplateRecord> {
  await ensureProfile(input.user);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: input.user.id,
      title: input.title,
      description: input.description,
      config: input.config,
    })
    .select("id, user_id, title, description, config, created_at, updated_at")
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateTemplate(input: {
  id: string;
  title: string;
  description: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("templates")
    .update({
      title: input.title,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) throw error;
}
