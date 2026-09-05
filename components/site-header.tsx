"use client";

import { Bookmark, FileSpreadsheet, LogOut, Tag } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

type SiteHeaderProps = {
  onPrices: () => void;
};

export function SiteHeader({ onPrices }: SiteHeaderProps) {
  const { user, isPro, openAuth, signOut } = useAuth();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "Cuenta";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            Ex
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            ExcelFlow
          </span>
        </div>

        <div className="flex min-w-0 justify-center">
          <TabsList className="h-auto w-full max-w-3xl flex-wrap justify-center sm:w-fit">
            <TabsTrigger value="formatter" className="px-2.5 py-1.5">
              <FileSpreadsheet data-icon="inline-start" />
              Formateador Excel
            </TabsTrigger>
            <TabsTrigger value="mail-merge" className="px-2.5 py-1.5">
              Mail Merge
            </TabsTrigger>
            <TabsTrigger value="manifest" className="px-2.5 py-1.5">
              Extractor Manifest
            </TabsTrigger>
            <TabsTrigger value="templates" className="px-2.5 py-1.5">
              <Bookmark data-icon="inline-start" />
              Mis Plantillas
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onPrices}>
            <Tag data-icon="inline-start" />
            Precios
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="rounded-full">
                  <Avatar size="sm">
                    {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{name}</p>
                    <Badge variant={isPro ? "default" : "outline"}>{isPro ? "PRO" : "Gratis"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button type="button" size="sm" onClick={() => openAuth()}>
              Iniciar sesión con Google
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
