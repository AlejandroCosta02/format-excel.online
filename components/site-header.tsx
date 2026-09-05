"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileSpreadsheet, Languages, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
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

export function SiteHeader() {
  const { user, isPro, openAuth, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? t.brandShort;
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.slice(0, 2).toUpperCase();
  const dark = resolvedTheme === "dark";

  function goHome(hash: string, tool?: string) {
    const qs = tool ? `/?tool=${tool}` : "/";
    const scroll = () => {
      if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    };
    if (pathname === "/") {
      if (tool) router.replace(qs, { scroll: false });
      requestAnimationFrame(scroll);
      return;
    }
    router.push(tool ? `${qs}${hash}` : `/${hash}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            Fx
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">{t.brand}</span>
          <Badge variant={isPro ? "default" : "outline"}>{isPro ? t.nav.pro : t.nav.free}</Badge>
        </Link>

        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <FileSpreadsheet data-icon="inline-start" />
                {t.nav.tools}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => goHome("#workspace", "formatter")}>
                {t.nav.formatter}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goHome("#workspace", "manifest")}>
                {t.nav.manifest}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goHome("#workspace", "mail-merge")}>
                {t.nav.mailMerge}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goHome("#workspace", "templates")}>
                {t.nav.templates}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="ghost" size="sm" onClick={() => goHome("#pricing")}>
            {t.nav.pricing}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => goHome("#faq")}>
            {t.nav.faq}
          </Button>
        </nav>

        <div className="flex items-center justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={t.lang[locale]}>
                <Languages />
                {locale.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale("en")}>EN · {t.lang.en}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("es")}>ES · {t.lang.es}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={dark ? t.theme.light : t.theme.dark}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun /> : <Moon />}
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
                    <Badge variant={isPro ? "default" : "outline"}>{isPro ? t.nav.pro : t.nav.free}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut />
                  {t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button type="button" size="sm" onClick={() => openAuth()}>
              {t.nav.login}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
